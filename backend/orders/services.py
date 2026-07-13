import json
import time
import threading
import requests
from django.conf import settings

_lock = threading.Lock()
_cache = {'access_token': None, 'expires_at': 0, 'refresh_token': None}

_BC_NATIVE_CLIENT = '47e3f88a-b0be-4ddf-bf5b-456d854babb4'
_TOKEN_URL = 'https://login.microsoftonline.com/{tenant}/oauth2/token'


def _post(tenant, payload):
    url = _TOKEN_URL.format(tenant=tenant)
    r = requests.post(url, data=payload, timeout=30)
    if not r.ok:
        try:
            e = r.json()
            raise ValueError(e.get('error_description', r.text))
        except (ValueError, KeyError):
            raise ValueError(r.text)
    return r.json()


def authenticate(username, password):
    """Called from the /api/connect/ endpoint. Tries ROPC with both client IDs."""
    tenant = settings.BC_TENANT_ID
    last_err = None

    for payload in [
        # Strategy 1 — native BC public client (no secret)
        {
            'grant_type': 'password',
            'client_id':  _BC_NATIVE_CLIENT,
            'resource':   settings.BC_RESOURCE,
            'username':   username,
            'password':   password,
        },
        # Strategy 2 — configured confidential client + secret
        {
            'grant_type':    'password',
            'client_id':     settings.BC_CLIENT_ID,
            'client_secret': settings.BC_CLIENT_SECRET,
            'resource':      settings.BC_RESOURCE,
            'username':      username,
            'password':      password,
        },
    ]:
        try:
            data = _post(tenant, payload)
            with _lock:
                _store(data)
            return True
        except Exception as e:
            last_err = str(e)

    raise ValueError(last_err or 'Authentication failed')


def _store(data):
    now = time.time()
    _cache['access_token']  = data['access_token']
    _cache['expires_at']    = now + int(data.get('expires_in', 3600))
    if data.get('refresh_token'):
        _cache['refresh_token'] = data['refresh_token']


def get_access_token():
    """Return a valid token, refreshing silently if needed."""
    with _lock:
        now = time.time()

        if _cache['access_token'] and now < _cache['expires_at'] - 60:
            return _cache['access_token']

        # Silent refresh
        if _cache['refresh_token']:
            try:
                data = _post(settings.BC_TENANT_ID, {
                    'grant_type':    'refresh_token',
                    'client_id':     _BC_NATIVE_CLIENT,
                    'resource':      settings.BC_RESOURCE,
                    'refresh_token': _cache['refresh_token'],
                })
                _store(data)
                return _cache['access_token']
            except Exception:
                _cache['refresh_token'] = None
                _cache['access_token']  = None

        # Also try with settings credentials if configured
        username = getattr(settings, 'BC_USERNAME', '').strip()
        password = getattr(settings, 'BC_PASSWORD', '').strip()
        if username and password:
            try:
                authenticate(username, password)
                return _cache['access_token']
            except Exception:
                pass

        raise ValueError('Not authenticated. Please connect via the app.')


def is_connected():
    with _lock:
        return bool(_cache['access_token'] and time.time() < _cache['expires_at'] - 60)


def fetch_tracker_orders():
    """Fetch all records from the OrderTrackerAPI entity set."""
    import urllib.parse
    token        = get_access_token()
    company_name = getattr(settings, 'BC_COMPANY_NAME', 'Proactive Data Systems Pvt.Ltd')
    url = (
        f"{settings.BC_RESOURCE}/v2.0/{settings.BC_TENANT_ID}"
        f"/{settings.BC_ENVIRONMENT}/ODataV4"
        f"/Company('{urllib.parse.quote(company_name)}')/OrderTrackerAPI"
    )
    r = requests.get(
        url,
        headers={'Authorization': f'Bearer {token}'},
        timeout=60,
    )
    if not r.ok:
        raise ValueError(f"BC API error {r.status_code}: {r.text[:300]}")
    return r.json().get('value', [])


def fetch_orders(customer_po_no=None):
    token = get_access_token()
    url = (
        f"{settings.BC_RESOURCE}/v2.0/{settings.BC_TENANT_ID}"
        f"/{settings.BC_ENVIRONMENT}/ODataV4/RequestInformation_GetOrderStatus"
        f"?company={settings.BC_COMPANY_ID}"
    )
    body = {'custorderno': customer_po_no or ''}
    r = requests.post(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}, json=body, timeout=30)
    if not r.ok:
        raise ValueError(f"BC API error {r.status_code}: {r.text[:300]}")

    orders = json.loads(r.json()['value']).get('Order Details', [])
    return orders
