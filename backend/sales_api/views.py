"""
REST API views — Customer Sales Summary dashboard.

Endpoints
─────────
GET /api/sales/                  – full enriched dataset (paginated, filterable)
GET /api/sales/kpis/             – KPI aggregates
GET /api/sales/charts/           – all chart bundles
GET /api/sales/filters/meta/     – dropdown option values
GET /api/sales/by-region/        – group by Region
GET /api/sales/by-segment/       – group by Segment
GET /api/sales/by-salesteam/     – group by Sales_Teams
GET /api/sales/by-customer/      – group by customer (top 20)
GET /api/sales/by-am/            – group by AM_Name (top 20)
GET /api/sales/by-month/         – monthly trend
GET /api/sales/by-technology/    – group by Technology
GET /api/sales/by-product-type/  – group by Product_Type
GET /api/sales/by-dealband/      – group by Deal Band (Band)
GET /api/sales/by-fy/            – group by Financial_Year

GET /api/sales/cisco/            – CISCO page
GET /api/sales/non-cisco/        – NON-CISCO page
GET /api/sales/amc/              – AMC page
GET /api/sales/saas/             – SaaS page
GET /api/sales/cable/            – Cabling page

GET /api/sales/band-wise/        – Band Wise Sales sheet equivalent
GET /api/sales/tech-summary/     – Tech Summary sheet equivalent
GET /api/sales/sales-summary/    – Sales Summary multi-FY sheet
GET /api/sales/big-deals/        – Big Deal records only
GET /api/sales/large-deals/      – Large Deal records only

GET /api/master-data/            – static reference tables
POST /api/refresh/               – clear cache, re-fetch
"""
from rest_framework.decorators import api_view
from rest_framework.response    import Response

from django.core.cache import cache

from .bc_client      import fetch_all_sales_records, invalidate_cache, CACHE_ENRICHED, DATA_TTL
from .data_processor import (
    enrich_all, apply_filters, compute_kpis,
    group_by, monthly_trend, band_wise_summary, fy_comparison,
    MASTER_DATA, BAND_THRESHOLDS, BAND_NAMES,
)


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _get_enriched_all() -> list:
    """Return enriched records from cache; compute+cache on first call."""
    enriched = cache.get(CACHE_ENRICHED)
    if enriched is None:
        raw      = fetch_all_sales_records()
        enriched = enrich_all(raw)
        cache.set(CACHE_ENRICHED, enriched, DATA_TTL)
    return enriched


def _get_enriched(request) -> list:
    return apply_filters(_get_enriched_all(), request.query_params)


def _paginate(records: list, params) -> dict:
    try:
        page     = max(int(params.get('page', 1)), 1)
        per_page = max(int(params.get('per_page', 100)), 1)
    except (ValueError, TypeError):
        page, per_page = 1, 100
    total  = len(records)
    start  = (page - 1) * per_page
    return {
        'results':  records[start: start + per_page],
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    (total + per_page - 1) // per_page,
    }


def _filter_tech(records: list, tech: str) -> list:
    return [r for r in records if (r.get('Technology') or '').upper() == tech.upper()]


# ── Core data endpoints ────────────────────────────────────────────────────────

@api_view(['GET'])
def sales_list(request):
    records = _get_enriched(request)
    return Response(_paginate(records, request.query_params))


@api_view(['GET'])
def kpis(request):
    return Response(compute_kpis(_get_enriched(request)))


@api_view(['GET'])
def charts(request):
    records = _get_enriched(request)
    return Response({
        'monthly_trend':    monthly_trend(records),
        'by_region':        group_by(records, 'Region'),
        'by_region_macro':  group_by(records, 'Region_Macro'),
        'by_technology':    group_by(records, 'Technology'),
        'by_product_type':  group_by(records, 'Product_Type'),
        'by_segment':       group_by(records, 'Segment'),
        'by_quarter':       group_by(records, 'Quarter'),
        'by_fy':            group_by(records, 'Financial_Year'),
        'by_band':          group_by(records, 'Band'),
        'top_customers':    group_by(records, 'Master_Customer_Name')[:20],
        'top_ams':          group_by(records, 'AM_Name')[:20],
        'by_sales_team':    group_by(records, 'Sales_Teams')[:20],
        'by_branch':        group_by(records, 'branch_Name'),
        'by_order_type':    group_by(records, 'Order_Type'),
    })


@api_view(['GET'])
def filters_meta(request):
    enriched = _get_enriched_all()

    def distinct(field):
        return sorted({str(r.get(field) or '') for r in enriched if r.get(field)})

    return Response({
        'financial_year': distinct('Financial_Year'),
        'quarter':        distinct('Quarter'),
        'region':         distinct('Region'),
        'region_macro':   distinct('Region_Macro'),
        'segment':        distinct('Segment'),
        'technology':     distinct('Technology'),
        'product_type':   distinct('Product_Type'),
        'sales_team':     distinct('Sales_Teams'),
        'am_name':        distinct('AM_Name'),
        'branch_name':    distinct('branch_Name'),
        'customer_name':  distinct('Master_Customer_Name'),
        'order_type':     distinct('Order_Type'),
        'band':           [t[1] for t in BAND_THRESHOLDS],
        'big_deal':       ['Y', 'N'],
        'large_deal':     ['Y', 'N'],
    })


# ── Group-by endpoints ─────────────────────────────────────────────────────────

@api_view(['GET'])
def by_technology(request):
    return Response(group_by(_get_enriched(request), 'Technology'))

@api_view(['GET'])
def by_product_type(request):
    return Response(group_by(_get_enriched(request), 'Product_Type'))

@api_view(['GET'])
def by_region(request):
    return Response(group_by(_get_enriched(request), 'Region'))

@api_view(['GET'])
def by_segment(request):
    return Response(group_by(_get_enriched(request), 'Segment'))

@api_view(['GET'])
def by_sales_team(request):
    return Response(group_by(_get_enriched(request), 'Sales_Teams'))

@api_view(['GET'])
def by_customer(request):
    return Response(group_by(_get_enriched(request), 'Master_Customer_Name')[:20])

@api_view(['GET'])
def by_am(request):
    return Response(group_by(_get_enriched(request), 'AM_Name')[:20])

@api_view(['GET'])
def by_month(request):
    return Response(monthly_trend(_get_enriched(request)))

@api_view(['GET'])
def by_deal_band(request):
    return Response(group_by(_get_enriched(request), 'Band'))

@api_view(['GET'])
def by_fy(request):
    return Response(group_by(_get_enriched(request), 'Financial_Year'))


# ── Technology-specific pages ──────────────────────────────────────────────────

def _page_data(records: list, params) -> dict:
    return {
        'kpis':          compute_kpis(records),
        'monthly_trend': monthly_trend(records),
        'by_technology': group_by(records, 'Technology'),
        'by_region':     group_by(records, 'Region'),
        'by_segment':    group_by(records, 'Segment'),
        'by_customer':   group_by(records, 'Master_Customer_Name')[:15],
        'by_am':         group_by(records, 'AM_Name')[:15],
        'by_band':       group_by(records, 'Band'),
        'by_order_type': group_by(records, 'Order_Type'),
        'by_branch':     group_by(records, 'branch_Name'),
        'records':       _paginate(records, params),
    }

@api_view(['GET'])
def cisco_page(request):
    # CISCO = Product_Type is CISCO
    records  = _get_enriched(request)
    filtered = [r for r in records if (r.get('Product_Type') or '').upper() == 'CISCO']
    return Response(_page_data(filtered, request.query_params))

@api_view(['GET'])
def non_cisco_page(request):
    # NON-CISCO = Product_Type is NON-CISCO
    records  = _get_enriched(request)
    filtered = [r for r in records if (r.get('Product_Type') or '').upper() == 'NON-CISCO']
    return Response(_page_data(filtered, request.query_params))

@api_view(['GET'])
def amc_page(request):
    # AMC = Order_Type contains 'AMC' (covers AMC, AMC-NON CISCO, MIS-CISCO etc.)
    records  = _get_enriched(request)
    filtered = [r for r in records if 'AMC' in (r.get('Order_Type') or '').upper()
                or 'MIS' in (r.get('Order_Type') or '').upper()]
    return Response(_page_data(filtered, request.query_params))

@api_view(['GET'])
def saas_page(request):
    # SaaS = Order_Type is SAAS
    records  = _get_enriched(request)
    filtered = [r for r in records if (r.get('Order_Type') or '').upper() == 'SAAS']
    return Response(_page_data(filtered, request.query_params))

@api_view(['GET'])
def cable_page(request):
    # Cabling = Order_Type is CABLE or Technology is CABLING
    records  = _get_enriched(request)
    filtered = [r for r in records if
                (r.get('Order_Type') or '').upper() == 'CABLE' or
                (r.get('Technology') or '').upper() == 'CABLING']
    return Response(_page_data(filtered, request.query_params))


# ── Band Wise Sales page ───────────────────────────────────────────────────────

@api_view(['GET'])
def band_wise_page(request):
    records = _get_enriched(request)

    # Cross: Band × FY  (matching "Band Wise Sales" sheet)
    fy_list = sorted({str(r.get('Financial_Year') or '') for r in records if r.get('Financial_Year')})
    band_fy: dict = {}
    for rec in records:
        band = rec.get('Band', 'B')
        fy   = str(rec.get('Financial_Year') or '')
        cid  = str(rec.get('Master_Customer_ID') or '')
        so   = str(rec.get('SO_No_') or '')
        if band not in band_fy:
            band_fy[band] = {}
        if fy not in band_fy[band]:
            band_fy[band][fy] = {'customers': set(), 'orders': set(), 'sales': 0.0, 'tgm': 0.0}
        d = band_fy[band][fy]
        if cid: d['customers'].add(cid)
        if so:  d['orders'].add(so)
        d['sales'] += float(rec.get('Sales_Amount') or 0)
        d['tgm']   += float(rec.get('TGM') or 0)

    band_fy_rows = []
    for band_code, _ in BAND_THRESHOLDS:
        if band_code not in band_fy:
            continue
        row = {'band': band_code, 'band_name': BAND_NAMES.get(band_code, band_code)}
        for fy in fy_list:
            d = band_fy[band_code].get(fy, {})
            sales  = round(d.get('sales', 0), 2)
            tgm    = round(d.get('tgm',   0), 2)
            n_cust = len(d.get('customers', set()))
            n_ord  = len(d.get('orders', set()))
            avg    = round(sales / n_ord, 2) if n_ord else 0
            row[f'{fy}_customers']  = n_cust
            row[f'{fy}_orders']     = n_ord
            row[f'{fy}_sales']      = sales
            row[f'{fy}_tgm']        = tgm
            row[f'{fy}_tgm_pct']    = round(tgm / sales * 100, 2) if sales else 0
            row[f'{fy}_avg_deal']   = avg
        band_fy_rows.append(row)

    return Response({
        'fy_list':        fy_list,
        'band_wise_fy':   band_fy_rows,
        'band_summary':   band_wise_summary(records),
        'by_band':        group_by(records, 'Band'),
        'by_band_tech':   {b: group_by(
                              [r for r in records if r.get('Band') == b], 'Technology'
                           ) for b in BAND_NAMES},
        'kpis':           compute_kpis(records),
    })


# ── Sales Summary page (multi-FY, mirrors "Sales Summary" sheet) ───────────────

@api_view(['GET'])
def sales_summary_page(request):
    records  = _get_enriched(request)
    fy_list  = sorted({str(r.get('Financial_Year') or '') for r in records if r.get('Financial_Year')})

    def build_fy_row(subset, key_label):
        row = {'label': key_label}
        for fy in fy_list:
            fy_recs  = [r for r in subset if str(r.get('Financial_Year') or '') == fy]
            sales    = sum(float(r.get('Sales_Amount') or 0) for r in fy_recs)
            tgm      = sum(float(r.get('TGM') or 0)          for r in fy_recs)
            n_ord    = len({r.get('SO_No_') for r in fy_recs if r.get('SO_No_')})
            n_cust   = len({r.get('Master_Customer_ID') for r in fy_recs if r.get('Master_Customer_ID')})
            avg      = round(sales / n_ord, 2) if n_ord else 0
            row[f'{fy}'] = {
                'sales':     round(sales, 2),
                'tgm':       round(tgm, 2),
                'tgm_pct':   round(tgm / sales * 100, 2) if sales else 0,
                'orders':    n_ord,
                'customers': n_cust,
                'avg_deal':  avg,
            }
        return row

    # By segment
    segments = sorted({str(r.get('Segment') or '') for r in records if r.get('Segment')})
    by_segment_fy = [
        build_fy_row([r for r in records if r.get('Segment') == seg], seg)
        for seg in segments
    ]

    # By technology
    techs = sorted({str(r.get('Technology') or '') for r in records if r.get('Technology')})
    by_tech_fy = [
        build_fy_row([r for r in records if r.get('Technology') == tech], tech)
        for tech in techs
    ]

    # By region
    regions = sorted({str(r.get('Region') or '') for r in records if r.get('Region')})
    by_region_fy = [
        build_fy_row([r for r in records if r.get('Region') == reg], reg)
        for reg in regions
    ]

    # Overall YoY trend
    overall_fy = [
        build_fy_row(records, 'Total')
    ]

    return Response({
        'fy_list':       fy_list,
        'by_segment':    by_segment_fy,
        'by_technology': by_tech_fy,
        'by_region':     by_region_fy,
        'overall':       overall_fy,
        'kpis':          compute_kpis(records),
        'monthly_trend': monthly_trend(records),
    })


# ── Tech Summary page (mirrors "Tech Summary" sheet) ──────────────────────────

@api_view(['GET'])
def tech_summary_page(request):
    records = _get_enriched(request)
    fy_list = sorted({str(r.get('Financial_Year') or '') for r in records if r.get('Financial_Year')})

    def tech_fy_summary(tech_val):
        subset = [r for r in records if (r.get('Technology') or '').upper() == tech_val.upper()]
        row = {'technology': tech_val, 'kpis': compute_kpis(subset)}
        for fy in fy_list:
            fy_r  = [r for r in subset if str(r.get('Financial_Year') or '') == fy]
            sales = sum(float(r.get('Sales_Amount') or 0) for r in fy_r)
            tgm   = sum(float(r.get('TGM') or 0)          for r in fy_r)
            n_ord = len({r.get('SO_No_') for r in fy_r if r.get('SO_No_')})
            row[fy] = {
                'sales':   round(sales, 2),
                'tgm':     round(tgm, 2),
                'tgm_pct': round(tgm / sales * 100, 2) if sales else 0,
                'orders':  n_ord,
            }
        return row

    techs = sorted({str(r.get('Technology') or '') for r in records if r.get('Technology')})
    return Response({
        'fy_list':        fy_list,
        'tech_summaries': [tech_fy_summary(t) for t in techs],
        'by_technology':  group_by(records, 'Technology'),
        'monthly_trend':  monthly_trend(records),
        'kpis':           compute_kpis(records),
    })


# ── Big Deals / Large Deals pages ─────────────────────────────────────────────

@api_view(['GET'])
def big_deals_page(request):
    records  = _get_enriched(request)
    filtered = [r for r in records if r.get('Big_Deal') == 'Y']
    return Response({
        'kpis':          compute_kpis(filtered),
        'by_customer':   group_by(filtered, 'Master_Customer_Name'),
        'by_region':     group_by(filtered, 'Region'),
        'by_fy':         group_by(filtered, 'Financial_Year'),
        'by_technology': group_by(filtered, 'Technology'),
        'monthly_trend': monthly_trend(filtered),
        'records':       _paginate(filtered, request.query_params),
    })


@api_view(['GET'])
def large_deals_page(request):
    records  = _get_enriched(request)
    filtered = [r for r in records if r.get('Large_Deal') == 'Y']
    return Response({
        'kpis':          compute_kpis(filtered),
        'by_customer':   group_by(filtered, 'Master_Customer_Name')[:20],
        'by_region':     group_by(filtered, 'Region'),
        'by_fy':         group_by(filtered, 'Financial_Year'),
        'records':       _paginate(filtered, request.query_params),
    })


# ── FY-specific page (mirrors "FY 26-27" sheet) ────────────────────────────────

@api_view(['GET'])
def fy_page(request):
    """
    Returns sales data for a specific FY (pass ?financial_year=F.Y.2026-27).
    Mirrors the FY 26-27 pivot: Region > Sales Team > Customer.
    """
    records = _get_enriched(request)

    region_team_cust: dict = {}
    for rec in records:
        region = rec.get('Region', 'Other')
        team   = rec.get('Sales_Teams', '')
        cname  = rec.get('Master_Customer_Name', '')
        cid    = rec.get('Master_Customer_ID', '')
        key    = (region, team, cname, cid)
        if key not in region_team_cust:
            region_team_cust[key] = {'sales': 0.0, 'tgm': 0.0}
        region_team_cust[key]['sales'] += float(rec.get('Sales_Amount_Adjusted') or 0)
        region_team_cust[key]['tgm']   += float(rec.get('TGM_Adjusted') or 0)

    rows = []
    for (region, team, cname, cid), vals in region_team_cust.items():
        s = round(vals['sales'], 2)
        t = round(vals['tgm'], 2)
        rows.append({
            'region':        region,
            'sales_team':    team,
            'customer_name': cname,
            'customer_id':   cid,
            'sales_adjusted':s,
            'tgm_adjusted':  t,
            'tgm_pct':       round(t / s * 100, 2) if s else 0,
        })
    rows.sort(key=lambda x: x['sales_adjusted'], reverse=True)

    return Response({
        'kpis':          compute_kpis(records),
        'pivot_rows':    rows,
        'by_region':     group_by(records, 'Region'),
        'by_sales_team': group_by(records, 'Sales_Teams'),
        'by_customer':   group_by(records, 'Master_Customer_Name')[:20],
    })


# ── Master data & cache ────────────────────────────────────────────────────────

@api_view(['GET'])
def master_data(request):
    return Response({
        'branch_region':       MASTER_DATA['branch_region'],
        'region_macro':        MASTER_DATA['region_macro'],
        'sales_team_segment':  MASTER_DATA['sales_team_segment'],
        'band_names':          MASTER_DATA['band_names'],
        'band_thresholds': [
            {'threshold': t, 'code': c, 'name': BAND_NAMES.get(c, c)}
            for t, c in MASTER_DATA['band_thresholds']
        ],
        'big_deal_threshold':   MASTER_DATA['big_deal_threshold'],
        'large_deal_threshold': MASTER_DATA['large_deal_threshold'],
    })


@api_view(['POST'])
def refresh_data(request):
    invalidate_cache()
    return Response({'status': 'cache cleared', 'message': 'Cache cleared — fetching fresh data now.'})


@api_view(['GET'])
def data_status(request):
    """Return record counts and the date range actually held in cache."""
    from .bc_client import CACHE_DATA, CACHE_ENRICHED
    raw      = cache.get(CACHE_DATA)
    enriched = cache.get(CACHE_ENRICHED)

    date_range = {}
    if raw:
        dates = [r.get('Order_Date') for r in raw if r.get('Order_Date')]
        if dates:
            dates_sorted = sorted(dates)
            date_range = {
                'earliest_order_date': dates_sorted[0],
                'latest_order_date':   dates_sorted[-1],
                'total_dates':         len(dates),
            }

    return Response({
        'raw_records':      len(raw)      if raw      is not None else None,
        'enriched_records': len(enriched) if enriched is not None else None,
        'cache_status':     'warm' if raw is not None else 'cold',
        'date_range':       date_range,
    })


@api_view(['GET', 'POST'])
def settings_view(request):
    """
    GET  → return current BC settings (secrets masked).
    POST → save new values via orders.bc_config (same store Order-Tracker's
           own settings screen uses — patches live django settings immediately,
           no restart needed), invalidate token cache so new credentials take
           effect on the next request.
    """
    import re
    from orders import bc_config

    FIELDS = [
        ('BC_TENANT_ID',     'Tenant ID',      False),
        ('BC_CLIENT_ID',     'Client ID',      False),
        ('BC_CLIENT_SECRET', 'Client Secret',  True),
        ('BC_COMPANY_ID',    'Company ID',      False),
        ('BC_ENVIRONMENT',   'Environment',     False),
        ('BC_USERNAME',      'Username',        False),
        ('BC_PASSWORD',      'Password',        True),
        ('BC_STATIC_TOKEN',  'Static Token',    True),
    ]

    if request.method == 'GET':
        vals = bc_config.masked_load()
        result = [
            {'key': key, 'label': label, 'value': vals.get(key, ''), 'secret': secret}
            for key, label, secret in FIELDS
        ]

        # Computed read-only API endpoint URL
        raw = bc_config.load()
        api_url = (
            f"https://api.businesscentral.dynamics.com/v2.0/{raw.get('BC_ENVIRONMENT', '')}"
            f'/api/Proactive/ProactiveAPI/v1.0'
            f"/companies({raw.get('BC_COMPANY_ID', '')})/CustomerSalesSummaryAPI"
        )

        return Response({'settings': result, 'api_url': api_url})

    # POST — write new values
    data = dict(request.data.get('settings', {}))  # {key: value}
    if not data:
        return Response({'error': 'No settings provided'}, status=400)

    # If the user edited the API URL directly, parse out ENVIRONMENT and COMPANY_ID
    if 'BC_API_URL' in data:
        raw_url = str(data.pop('BC_API_URL'))
        # Extract environment: between /v2.0/ and /api/
        env_match = re.search(r'/v2\.0/([^/]+)/api/', raw_url)
        # Extract company ID: between companies( and )
        cid_match = re.search(r'/companies\(([^)]+)\)', raw_url)
        if env_match:
            data['BC_ENVIRONMENT'] = env_match.group(1)
        if cid_match:
            data['BC_COMPANY_ID'] = cid_match.group(1)

    allowed_keys = {f[0] for f in FIELDS}
    data = {k: str(v) for k, v in data.items() if k in allowed_keys}
    bc_config.save(data)

    # Invalidate token cache so new credentials are used immediately
    from django.core.cache import cache
    from .bc_client import CACHE_TOKEN, CACHE_DATA, CACHE_ENRICHED
    cache.delete(CACHE_TOKEN)
    cache.delete(CACHE_DATA)
    cache.delete(CACHE_ENRICHED)

    return Response({'status': 'ok', 'message': 'Settings saved. Cache cleared — data will reload on next request.'})


@api_view(['GET'])
def bc_date_probe(request):
    """
    Probe BC API with different date filters to find which field is causing cutoff.
    Bypasses cache completely.
    """
    from datetime import date, timedelta
    from .bc_client import API_BASE, _raw_get

    today      = date.today()
    plus7      = (today + timedelta(days=7)).strftime('%Y-%m-%d')
    today_str  = today.strftime('%Y-%m-%d')
    results    = {}

    def probe(label, suffix):
        try:
            url  = f'{API_BASE}/{suffix}'
            resp = _raw_get(url)
            if resp.status_code == 200:
                records = resp.json().get('value', [])
                results[label] = {
                    'count': len(records),
                    'records': [
                        {
                            'Order_Date':   r.get('Order_Date'),
                            'Posting_Date': r.get('Posting_Date'),
                            'Document_Date':r.get('Document_Date'),
                            'SO_No_':       r.get('SO_No_'),
                            'Order_Type':   r.get('Order_Type'),
                            'Sales_Amount': r.get('Sales_Amount'),
                        }
                        for r in records
                    ],
                }
            else:
                results[label] = {'error': resp.status_code, 'body': resp.text[:500]}
        except Exception as e:
            results[label] = {'error': str(e)}

    # 1. No filter — raw top 5 (default BC ordering)
    probe('no_filter_top5',         f'CustomerSalesSummaryAPI?$top=5')

    # 2. Filter on Order_Date up to today+7
    probe('filter_order_date_plus7',
          f'CustomerSalesSummaryAPI?$top=5&$filter=Order_Date le {plus7}')

    # 3. Filter on Posting_Date up to today+7
    probe('filter_posting_date_plus7',
          f'CustomerSalesSummaryAPI?$top=5&$filter=Posting_Date le {plus7}')

    # 4. Filter on Order_Date >= 20-Jun to see if recent records exist at all
    probe('order_date_from_20jun',
          f'CustomerSalesSummaryAPI?$top=10&$filter=Order_Date ge 2026-06-20')

    # 5. Filter on Posting_Date >= 20-Jun
    probe('posting_date_from_20jun',
          f'CustomerSalesSummaryAPI?$top=10&$filter=Posting_Date ge 2026-06-20')

    # 6. Count with no filter
    try:
        r = _raw_get(f'{API_BASE}/CustomerSalesSummaryAPI?$count=true&$top=1')
        results['total_count_no_filter'] = r.json().get('@odata.count') if r.status_code == 200 else r.text[:200]
    except Exception as e:
        results['total_count_no_filter'] = str(e)

    return Response(results)


@api_view(['GET'])
def auth_test(request):
    """Diagnose authentication — call this first to check if BC token works."""
    import os
    from .bc_client import get_token, TOKEN_URL, USERNAME, RESOURCE, CLIENT_ID

    results = {
        'env': {
            'BC_USERNAME':    USERNAME,
            'BC_PASSWORD_set':bool(os.getenv('BC_PASSWORD')),
            'BC_STATIC_TOKEN_set': bool(os.getenv('BC_STATIC_TOKEN')),
        },
        'steps': [],
    }

    # Step 1: try getting a token
    try:
        token = get_token()
        results['steps'].append({'step': 'get_token', 'status': 'OK', 'token_prefix': token[:30] + '...'})
    except Exception as e:
        results['steps'].append({'step': 'get_token', 'status': 'FAILED', 'error': str(e)})
        return Response(results, status=500)

    # Step 2: test the BC API with the token
    import requests as req
    from .bc_client import API_BASE
    test_url = f'{API_BASE}/CustomerSalesSummaryAPI?$top=1'
    try:
        r = req.get(test_url, headers={'Authorization': f'Bearer {token}'}, timeout=20)
        results['steps'].append({
            'step': 'bc_api_call',
            'status': 'OK' if r.status_code == 200 else 'FAILED',
            'http_status': r.status_code,
            'record_count': len(r.json().get('value', [])) if r.status_code == 200 else None,
            'error': r.text[:300] if r.status_code != 200 else None,
        })
    except Exception as e:
        results['steps'].append({'step': 'bc_api_call', 'status': 'FAILED', 'error': str(e)})

    results['overall'] = 'OK' if all(s['status'] == 'OK' for s in results['steps']) else 'FAILED'
    return Response(results)
