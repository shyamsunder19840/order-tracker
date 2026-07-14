"""
Computed columns W–AH — exactly matching the Excel workbook logic.


Excel column map (SRM Data sheet):
  W  = Col 23  → Total_for_Year       (sum Sales_Amount per customer per FY)
  X  = Col 24  → Band                 (tier from Total_for_Year thresholds)
  Y  = Col 25  → Band_Revised         (human-readable band name)
  Z  = Col 26  → Segment              (Enterprise/Commercial etc. from Sales Team)
  AA = Col 27  → Sales_Teams_Modified (cleaned team code)
  AB = Col 28  → Region               (West-1/West-2/North/South/East from Branch)
  AC = Col 29  → Big_Deal             (Y/N — order > 10 Cr threshold)
  AD = Col 30  → Sales_Amount_Adjusted(big deals discounted to recognition value)
  AE = Col 31  → TGM_Adjusted         (TGM on adjusted amount)
  AF = Col 32  → Large_Deal           (Y/N — order > 1 Cr threshold)
  AG = Col 33  → Sales_Amount_Credit  (positive sales for credit tracking)
  AH = Col 34  → TGM_Credit           (TGM on credit portion)
"""
from datetime import datetime
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
import functools

# ── Master reference tables (read-only, from "Drop Downs" + "Band Names" sheets) ──

# Branch → Region  (values from actual data: West-1, West-2, North, South, East)
BRANCH_REGION_MAP: dict[str, str] = {
    # West-1
    'Mumbai':     'West-1',
    'Navi Mumbai':'West-1',
    'Pune':       'West-1',
    # West-2
    'Ahmedabad':  'West-2',
    'Surat':      'West-2',
    'Vadodara':   'West-2',
    # North
    'Delhi':      'North',
    'Noida':      'North',
    'Gurugram':   'North',
    'Gurgaon':    'North',
    'Chandigarh': 'North',
    'Jaipur':     'North',
    'Lucknow':    'North',
    # South
    'Bangalore':  'South',
    'Bengaluru':  'South',
    'Chennai':    'South',
    'Hyderabad':  'South',
    'Kochi':      'South',
    # East
    'Kolkata':    'East',
    'Bhubaneswar':'East',
    'Guwahati':   'East',
}

# Region → macro-region (for higher-level grouping)
REGION_MACRO: dict[str, str] = {
    'West-1': 'West', 'West-2': 'West',
    'North':  'North',
    'South':  'South',
    'East':   'East',
}

# Sales Team → Segment  (derived from Drop Downs sheet)
SALES_TEAM_SEGMENT: dict[str, str] = {
    'SALE-00': 'Unattached',
    'SALE-01': 'Enterprise',
    'SALE-02': 'Commercial',
    'SALE-03': 'Enterprise',
    'SALE-04': 'Commercial',
    'SALE-05': 'Enterprise',
    'SALE-06': 'Commercial',
    'SALE-07': 'Enterprise',
    'SALE-08': 'Commercial',
    'SALE-09': 'Enterprise',
    'SALE-10': 'Enterprise',
    'SALE-11': 'Enterprise',
    'SALE-12': 'Commercial',
    'SALE-13': 'Commercial',
    'SALE-14': 'Commercial',
    'SALE-15': 'Enterprise',
    'SALE-16': 'Commercial',
    'SALE-17': 'Enterprise',
    'SALE-18': 'Enterprise',
    'SALE-19': 'Commercial',
    'SALE-20': 'Commercial',
}

# Band thresholds (applied to Total_for_Year = annual cumulative sales per customer)
# Confirmed: BNP Paribas Total_for_Year=778,292 (₹7.78L) → Band A5
# So A5 starts at ₹5L (500,000)
BAND_THRESHOLDS = [
    (50_000_000,  'A+'),  # > ₹5 Cr  → Transformational
    (10_000_000,  'A1'),  # > ₹1 Cr  → Strategic
    (5_000_000,   'A2'),  # > ₹50L
    (2_500_000,   'A3'),  # > ₹25L
    (1_000_000,   'A4'),  # > ₹10L
    (500_000,     'A5'),  # > ₹5L   ← sample confirms 778K → A5
    (0,           'B'),   # ≤ ₹5L
]

# Band code → display name (from "Band Names" sheet)
BAND_NAMES: dict[str, str] = {
    'A+': 'Transformational',
    'A1': 'Strategic',
    'A2': 'Large Enterprise',
    'A3': 'Mid Enterprise',
    'A4': 'Growth',
    'A5': 'Emerging',
    'B':  'Small',
}

# Big Deal adjustment factor (from "Big Deals in FY 25-26" sheet logic)
# Adjusted_Value = Value × (1 − Adjustment_Factor)  i.e. keep only the non-big-deal portion
BIG_DEAL_ADJUSTMENT_FACTOR = 0.85  # 85% removed, 15% recognized
BIG_DEAL_CREDIT_FACTOR     = 0.70  # credit recognition ratio

# Deal-size thresholds
BIG_DEAL_THRESHOLD   = 100_000_000   # ≥ ₹10 Cr  → Big Deal
LARGE_DEAL_THRESHOLD =  10_000_000   # ≥ ₹1 Cr   → Large Deal

MASTER_DATA = {
    'branch_region':       BRANCH_REGION_MAP,
    'region_macro':        REGION_MACRO,
    'sales_team_segment':  SALES_TEAM_SEGMENT,
    'band_thresholds':     BAND_THRESHOLDS,
    'band_names':          BAND_NAMES,
    'big_deal_threshold':  BIG_DEAL_THRESHOLD,
    'large_deal_threshold':LARGE_DEAL_THRESHOLD,
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _decode_order_type(raw: str) -> str:
    """Decode BC OData enum URL-encoding, e.g. AMC_x002D_NON_x0020_CISCO → AMC-NON CISCO."""
    import re
    return re.sub(r'_x([0-9A-Fa-f]{4})_', lambda m: chr(int(m.group(1), 16)), raw)


def _safe_float(val, default=0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def _band_code(total_for_year: float) -> str:
    abs_total = abs(total_for_year)
    for threshold, code in BAND_THRESHOLDS:
        if abs_total >= threshold:
            return code
    return 'B'


def _parse_date(date_str: str):
    if not date_str:
        return None
    for fmt in ('%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%d-%m-%Y'):
        try:
            return datetime.strptime(str(date_str)[:10], fmt)
        except ValueError:
            continue
    return None


# ── Pass 1: compute Total_for_Year per (customer, FY) ────────────────────────

def _build_customer_fy_totals(records: list) -> dict:
    """
    Returns a dict {(Master_Customer_ID, Financial_Year): total_sales}
    used to assign Band codes.
    """
    totals: dict = defaultdict(float)
    for r in records:
        cid = r.get('Master_Customer_ID', '')
        fy  = r.get('Financial_Year',     '')
        totals[(cid, fy)] += _safe_float(r.get('Sales_Amount'))
    return dict(totals)


# ── Pass 2: enrich each record ────────────────────────────────────────────────

def enrich_record(raw: dict, customer_fy_totals: dict) -> dict:
    """
    Accept a raw BC API record and return it with all computed columns (W–AH).
    """
    rec = dict(raw)

    # Decode BC enum URL-encoding on Order_Type (e.g. AMC_x002D_NON_x0020_CISCO → AMC-NON CISCO)
    raw_order_type = str(rec.get('Order_Type') or '')
    rec['Order_Type'] = _decode_order_type(raw_order_type)

    sales     = _safe_float(rec.get('Sales_Amount'))
    tgm       = _safe_float(rec.get('TGM'))
    etgm      = _safe_float(rec.get('ETGM'))
    branch    = str(rec.get('branch_Name') or rec.get('Branch_Name') or '')
    team      = str(rec.get('Sales_Teams') or '').strip()
    order_dt  = str(rec.get('Order_Date') or '')
    fy        = str(rec.get('Financial_Year') or '')
    quarter   = str(rec.get('Quarter') or '')
    cid       = str(rec.get('Master_Customer_ID') or '')
    abs_sales = abs(sales)
    dt        = _parse_date(order_dt)

    # ── W: Total_for_Year ────────────────────────────────────────────────────
    total_for_year = customer_fy_totals.get((cid, fy), 0.0)
    rec['Total_for_Year'] = round(total_for_year, 2)

    # ── X: Band ─────────────────────────────────────────────────────────────
    band_code = _band_code(abs(total_for_year))
    rec['Band'] = band_code

    # ── Y: Band_Revised ──────────────────────────────────────────────────────
    rec['Band_Revised'] = BAND_NAMES.get(band_code, band_code)

    # ── Z: Segment ──────────────────────────────────────────────────────────
    # Strip trailing digits from SALE-11 → look up SALE-11 then SALE-1x
    segment = SALES_TEAM_SEGMENT.get(team, '')
    if not segment:
        # Fallback: try matching prefix SALE-1x patterns
        for k, v in SALES_TEAM_SEGMENT.items():
            if team.startswith(k[:6]):
                segment = v
                break
    rec['Segment'] = segment or 'Unattached'

    # ── AA: Sales_Teams_Modified ─────────────────────────────────────────────
    rec['Sales_Teams_Modified'] = team or 'SALE-00'

    # ── AB: Region ──────────────────────────────────────────────────────────
    region = BRANCH_REGION_MAP.get(branch, '')
    if not region:
        # Try case-insensitive match
        for k, v in BRANCH_REGION_MAP.items():
            if k.lower() == branch.lower():
                region = v
                break
    rec['Region']       = region or 'Other'
    rec['Region_Macro'] = REGION_MACRO.get(region, 'Other')

    # ── AC: Big_Deal ─────────────────────────────────────────────────────────
    is_big_deal = abs_sales >= BIG_DEAL_THRESHOLD
    rec['Big_Deal'] = 'Y' if is_big_deal else 'N'

    # ── AD: Sales_Amount_Adjusted ────────────────────────────────────────────
    # Big deals: keep only (1 - factor) × value for revenue recognition
    if is_big_deal:
        adjusted_sales = round(abs_sales * (1 - BIG_DEAL_ADJUSTMENT_FACTOR) * (1 if sales >= 0 else -1), 2)
        adjusted_tgm   = round(tgm  * (1 - BIG_DEAL_ADJUSTMENT_FACTOR), 2)
    else:
        adjusted_sales = sales
        adjusted_tgm   = tgm
    rec['Sales_Amount_Adjusted'] = adjusted_sales
    rec['TGM_Adjusted']          = adjusted_tgm

    # ── AF: Large_Deal ───────────────────────────────────────────────────────
    is_large_deal = abs_sales >= LARGE_DEAL_THRESHOLD
    rec['Large_Deal'] = 'Y' if is_large_deal else 'N'

    # ── AG: Sales_Amount_Credit ──────────────────────────────────────────────
    # For credit tracking: record the positive (credit) side of the sales amount
    rec['Sales_Amount_Credit'] = max(sales, 0.0)
    rec['TGM_Credit']          = max(tgm, 0.0)

    # ── Extra computed helpers ────────────────────────────────────────────────
    rec['Month']      = dt.strftime('%Y-%m')    if dt else ''
    rec['Month_Name'] = dt.strftime('%b %Y')    if dt else ''
    rec['FY_Quarter'] = f"{fy} {quarter}".strip()

    # TGM ratios (on actual sales)
    rec['TGM_Pct']  = round(tgm  / sales * 100, 2) if sales else 0.0
    rec['ETGM_Pct'] = round(etgm / sales * 100, 2) if sales else 0.0

    # TGM ratios on adjusted amounts
    rec['TGM_Pct_Adjusted'] = (
        round(adjusted_tgm / adjusted_sales * 100, 2)
        if adjusted_sales else 0.0
    )

    return rec


def enrich_all(records: list) -> list:
    totals   = _build_customer_fy_totals(records)
    enricher = functools.partial(enrich_record, customer_fy_totals=totals)
    # Use threads for I/O-free CPU work; keeps order via map()
    with ThreadPoolExecutor(max_workers=4) as ex:
        enriched = list(ex.map(enricher, records))

    # BC returns records in an arbitrary (non-chronological) order. Endpoints
    # paginate this list server-side, so without sorting here, "page 1" can
    # miss the most recent orders entirely — they end up buried on a later
    # page. Sort newest-first so pagination and default views are correct.
    enriched.sort(key=lambda r: str(r.get('Order_Date') or ''), reverse=True)
    return enriched


# ── Filter helpers ────────────────────────────────────────────────────────────

def apply_filters(records: list, params: dict) -> list:
    """
    All filter params are optional comma-separated strings.
    Keys: financial_year, quarter, region, region_macro, segment, sales_team,
          am_name, customer_name, product_type, technology, branch_name,
          band, order_type, big_deal, large_deal
    """
    def match(rec, key, field):
        val = (params.get(key) or '').strip()
        if not val:
            return True
        allowed = {v.strip().lower() for v in val.split(',')}
        return str(rec.get(field) or '').lower() in allowed

    out = []
    for rec in records:
        if (
            match(rec, 'financial_year', 'Financial_Year') and
            match(rec, 'quarter',        'Quarter')         and
            match(rec, 'region',         'Region')          and
            match(rec, 'region_macro',   'Region_Macro')    and
            match(rec, 'segment',        'Segment')         and
            match(rec, 'sales_team',     'Sales_Teams')     and
            match(rec, 'am_name',        'AM_Name')         and
            match(rec, 'customer_name',  'Master_Customer_Name') and
            match(rec, 'product_type',   'Product_Type')    and
            match(rec, 'technology',     'Technology')      and
            match(rec, 'branch_name',    'branch_Name')     and
            match(rec, 'band',           'Band')            and
            match(rec, 'order_type',     'Order_Type')      and
            match(rec, 'big_deal',       'Big_Deal')        and
            match(rec, 'large_deal',     'Large_Deal')
        ):
            out.append(rec)
    return out


# ── Aggregation helpers ───────────────────────────────────────────────────────

def _safe_f(v):
    return _safe_float(v)


def compute_kpis(records: list) -> dict:
    total_sales    = sum(_safe_f(r.get('Sales_Amount'))           for r in records)
    total_adj      = sum(_safe_f(r.get('Sales_Amount_Adjusted'))  for r in records)
    total_credit   = sum(_safe_f(r.get('Sales_Amount_Credit'))    for r in records)
    total_tgm      = sum(_safe_f(r.get('TGM'))                    for r in records)
    total_tgm_adj  = sum(_safe_f(r.get('TGM_Adjusted'))           for r in records)
    total_etgm     = sum(_safe_f(r.get('ETGM'))                   for r in records)
    large_deals    = sum(1 for r in records if r.get('Large_Deal') == 'Y')
    big_deals      = sum(1 for r in records if r.get('Big_Deal')   == 'Y')
    unique_cust    = len({r.get('Master_Customer_ID') for r in records if r.get('Master_Customer_ID')})
    unique_sos     = len({r.get('SO_No_') for r in records if r.get('SO_No_')})

    tgm_pct        = round(total_tgm    / total_sales * 100, 2) if total_sales else 0
    etgm_pct       = round(total_etgm   / total_sales * 100, 2) if total_sales else 0
    tgm_adj_pct    = round(total_tgm_adj/ total_adj   * 100, 2) if total_adj   else 0

    return {
        'total_sales':           round(total_sales, 2),
        'total_sales_adjusted':  round(total_adj, 2),
        'total_sales_credit':    round(total_credit, 2),
        'total_tgm':             round(total_tgm, 2),
        'total_tgm_adjusted':    round(total_tgm_adj, 2),
        'total_etgm':            round(total_etgm, 2),
        'tgm_pct':               tgm_pct,
        'etgm_pct':              etgm_pct,
        'tgm_adjusted_pct':      tgm_adj_pct,
        'large_deal_count':      large_deals,
        'big_deal_count':        big_deals,
        'unique_customers':      unique_cust,
        'unique_orders':         unique_sos,
        'total_records':         len(records),
    }


def group_by(records: list, key: str) -> list:
    """Group records by a field and aggregate sales/TGM/ETGM."""
    groups: dict = {}
    for rec in records:
        grp_key = str(rec.get(key) or 'Unknown')
        if grp_key not in groups:
            groups[grp_key] = {
                'name':     grp_key,
                'sales':    0.0,
                'sales_adj':0.0,
                'tgm':      0.0,
                'tgm_adj':  0.0,
                'etgm':     0.0,
                'count':    0,
                'customers':set(),
            }
        g = groups[grp_key]
        g['sales']     += _safe_f(rec.get('Sales_Amount'))
        g['sales_adj'] += _safe_f(rec.get('Sales_Amount_Adjusted'))
        g['tgm']       += _safe_f(rec.get('TGM'))
        g['tgm_adj']   += _safe_f(rec.get('TGM_Adjusted'))
        g['etgm']      += _safe_f(rec.get('ETGM'))
        g['count']     += 1
        cid = rec.get('Master_Customer_ID')
        if cid:
            g['customers'].add(cid)

    result = []
    for g in sorted(groups.values(), key=lambda x: x['sales'], reverse=True):
        item = {
            'name':          g['name'],
            'sales':         round(g['sales'], 2),
            'sales_adjusted':round(g['sales_adj'], 2),
            'tgm':           round(g['tgm'], 2),
            'tgm_adjusted':  round(g['tgm_adj'], 2),
            'etgm':          round(g['etgm'], 2),
            'count':         g['count'],
            'unique_customers': len(g['customers']),
        }
        item['tgm_pct']     = round(item['tgm']         / item['sales'] * 100, 2) if item['sales'] else 0
        item['tgm_adj_pct'] = round(item['tgm_adjusted']/ item['sales_adjusted'] * 100, 2) if item['sales_adjusted'] else 0
        item['etgm_pct']    = round(item['etgm']        / item['sales'] * 100, 2) if item['sales'] else 0
        result.append(item)
    return result


def monthly_trend(records: list) -> list:
    return sorted(group_by(records, 'Month'), key=lambda x: x['name'])


def band_wise_summary(records: list) -> list:
    """
    Band-wise analysis: for each band show customer count, order count,
    sales, TGM, TGM%, average deal size — matching "Band Wise Sales" sheet.
    """
    bands: dict = {}
    for rec in records:
        band = rec.get('Band', 'B')
        if band not in bands:
            bands[band] = {
                'band':      band,
                'band_name': BAND_NAMES.get(band, band),
                'customers': set(),
                'orders':    set(),
                'sales':     0.0,
                'tgm':       0.0,
            }
        b = bands[band]
        cid = rec.get('Master_Customer_ID')
        so  = rec.get('SO_No_')
        if cid: b['customers'].add(cid)
        if so:  b['orders'].add(so)
        b['sales'] += _safe_f(rec.get('Sales_Amount'))
        b['tgm']   += _safe_f(rec.get('TGM'))

    band_order = [t[1] for t in BAND_THRESHOLDS]
    result = []
    for band_code in band_order:
        if band_code not in bands:
            continue
        b = bands[band_code]
        sales    = round(b['sales'], 2)
        tgm      = round(b['tgm'], 2)
        n_cust   = len(b['customers'])
        n_orders = len(b['orders'])
        result.append({
            'band':           band_code,
            'band_name':      b['band_name'],
            'customer_count': n_cust,
            'order_count':    n_orders,
            'sales':          sales,
            'tgm':            tgm,
            'tgm_pct':        round(tgm / sales * 100, 2) if sales else 0,
            'avg_deal_size':  round(sales / n_orders, 2) if n_orders else 0,
            'avg_tgm':        round(tgm  / n_orders, 2) if n_orders else 0,
        })
    return result


def fy_comparison(records: list, fy_list: list | None = None) -> list:
    """
    Multi-FY comparison — basis for Sales Summary / Tech Summary pages.
    Groups by a given key field and shows each FY as a column.
    """
    if fy_list is None:
        fy_list = sorted({str(r.get('Financial_Year') or '') for r in records if r.get('Financial_Year')})

    # {row_key: {fy: {sales, tgm, count}}}
    data: dict = {}
    for rec in records:
        fy = str(rec.get('Financial_Year') or '')
        # group by customer for this function
        cid  = str(rec.get('Master_Customer_ID') or '')
        name = str(rec.get('Master_Customer_Name') or '')
        key  = (cid, name)
        if key not in data:
            data[key] = {'id': cid, 'name': name}
        fy_data = data[key].setdefault(fy, {'sales': 0.0, 'tgm': 0.0, 'count': 0})
        fy_data['sales'] += _safe_f(rec.get('Sales_Amount'))
        fy_data['tgm']   += _safe_f(rec.get('TGM'))
        fy_data['count'] += 1

    result = []
    for (cid, name), row in data.items():
        entry = {'customer_id': cid, 'customer_name': name}
        for fy in fy_list:
            fd = row.get(fy, {})
            entry[f'{fy}_sales'] = round(fd.get('sales', 0), 2)
            entry[f'{fy}_tgm']   = round(fd.get('tgm', 0), 2)
            entry[f'{fy}_count'] = fd.get('count', 0)
        result.append(entry)

    result.sort(key=lambda x: x.get(f'{fy_list[-1]}_sales', 0) if fy_list else 0, reverse=True)
    return result
