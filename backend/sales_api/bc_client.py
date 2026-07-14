"""
Business Central API client.

Auth strategy (tried in order):
  1. BC_STATIC_TOKEN setting    — manual override / quick testing
  2. Client Credentials grant — app-only, no user password required  ← PRIMARY
  3. ROPC (password grant)    — fallback if CC fails and password is set
Tokens are cached until 60 s before expiry; 401 responses auto-refresh once.

Credentials are read from django.conf.settings (populated from bc_config.json
by orders.bc_config, live-patchable without a restart) rather than os.getenv,
so there are no secrets baked into this file.
"""
import requests
from django.conf import settings
from django.core.cache import cache

RESOURCE  = 'https://api.businesscentral.dynamics.com'

CACHE_TOKEN    = 'bc_access_token'
CACHE_DATA     = 'bc_sales_data'
CACHE_ENRICHED = 'bc_enriched_data'
DATA_TTL       = 3600  # 1 hour


def _token_url():
    return f'https://login.microsoftonline.com/{settings.BC_TENANT_ID}/oauth2/token'


def _api_base():
    return (
        f'{RESOURCE}/v2.0/{settings.BC_ENVIRONMENT}/api/Proactive/ProactiveAPI/v1.0'
        f'/companies({settings.BC_COMPANY_ID})'
    )


def _client_credentials() -> str:
    """OAuth2 client credentials grant — app-only, no user password needed."""
    payload = {
        'grant_type':    'client_credentials',
        'client_id':     settings.BC_CLIENT_ID,
        'client_secret': settings.BC_CLIENT_SECRET,
        'resource':      RESOURCE,
    }
    resp = requests.post(_token_url(), data=payload, timeout=30)
    if resp.status_code == 200:
        body        = resp.json()
        token       = body['access_token']
        expires_in  = int(body.get('expires_in', 3600)) - 60
        cache.set(CACHE_TOKEN, token, expires_in)
        return token
    try:
        err = resp.json()
        msg = err.get('error_description') or err.get('error') or resp.text
    except Exception:
        msg = resp.text
    raise RuntimeError(f'client_credentials failed ({resp.status_code}): {msg}')


def _ropc() -> str:
    """ROPC password grant — fallback when user credentials are available."""
    payload = {
        'grant_type':    'password',
        'client_id':     settings.BC_CLIENT_ID,
        'client_secret': settings.BC_CLIENT_SECRET,
        'resource':      RESOURCE,
        'username':      settings.BC_USERNAME,
        'password':      settings.BC_PASSWORD,
    }
    resp = requests.post(_token_url(), data=payload, timeout=30)
    if resp.status_code == 200:
        body       = resp.json()
        token      = body['access_token']
        expires_in = int(body.get('expires_in', 3600)) - 60
        cache.set(CACHE_TOKEN, token, expires_in)
        return token
    try:
        err = resp.json()
        msg = err.get('error_description') or err.get('error') or resp.text
    except Exception:
        msg = resp.text
    raise RuntimeError(f'ROPC failed ({resp.status_code}): {msg}')


def get_token() -> str:
    # 1. Static override
    static_token = getattr(settings, 'BC_STATIC_TOKEN', '')
    if static_token:
        return static_token

    # 2. Cache hit
    cached = cache.get(CACHE_TOKEN)
    if cached:
        return cached

    # 3. Client credentials (preferred — no user password needed)
    try:
        return _client_credentials()
    except RuntimeError:
        pass

    # 4. ROPC fallback
    if getattr(settings, 'BC_PASSWORD', ''):
        return _ropc()

    raise RuntimeError(
        'Authentication failed. Set BC_PASSWORD or BC_STATIC_TOKEN in App Settings.'
    )


def _get(url: str) -> dict:
    token   = get_token()
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    resp    = requests.get(url, headers=headers, timeout=120)

    if resp.status_code == 401:
        # Token may have just expired — refresh once
        cache.delete(CACHE_TOKEN)
        token                  = get_token()
        headers['Authorization'] = f'Bearer {token}'
        resp                   = requests.get(url, headers=headers, timeout=120)

    resp.raise_for_status()
    return resp.json()


def _raw_get(url: str) -> requests.Response:
    """GET with auth + one 401-retry. Returns the raw Response."""
    token   = get_token()
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    resp    = requests.get(url, headers=headers, timeout=120)
    if resp.status_code == 401:
        cache.delete(CACHE_TOKEN)
        token                    = get_token()
        headers['Authorization'] = f'Bearer {token}'
        resp                     = requests.get(url, headers=headers, timeout=120)
    return resp



def _fetch_pages(url_first: str) -> list:
    """Follow nextLink cursor from url_first and return all records.

    No client-side $top is set on the first request: OData's $top caps the
    *total* result set (not a per-page chunk), so specifying one here would
    make BC omit @odata.nextLink once that cap is hit and silently truncate
    the data. Omitting it lets BC apply its own server-side page size (chunks
    of ~20k) and return a working nextLink for every remaining page.
    """
    all_records = []
    next_url    = url_first
    while next_url:
        resp = _raw_get(next_url)
        resp.raise_for_status()
        data     = resp.json()
        all_records.extend(data.get('value', []))
        next_url = data.get('@odata.nextLink')
    return all_records


def fetch_all_sales_records() -> list:
    """Fetch every record from CustomerSalesSummaryAPI, following @odata.nextLink
    until BC reports no more pages."""
    cached = cache.get(CACHE_DATA)
    if cached is not None:
        return cached

    base_url    = f'{_api_base()}/CustomerSalesSummaryAPI'
    all_records = _fetch_pages(base_url)

    cache.set(CACHE_DATA, all_records, DATA_TTL)
    return all_records


def invalidate_cache():
    cache.delete(CACHE_DATA)
    cache.delete(CACHE_ENRICHED)
    cache.delete(CACHE_TOKEN)
