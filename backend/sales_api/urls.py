from django.urls import path
from . import views

urlpatterns = [
    # Core
    path('sales/',                  views.sales_list,        name='sales-list'),
    path('sales/kpis/',             views.kpis,              name='sales-kpis'),
    path('sales/charts/',           views.charts,            name='sales-charts'),
    path('sales/filters/meta/',     views.filters_meta,      name='filters-meta'),

    # Group-by aggregations
    path('sales/by-technology/',    views.by_technology,     name='by-technology'),
    path('sales/by-product-type/',  views.by_product_type,   name='by-product-type'),
    path('sales/by-region/',        views.by_region,         name='by-region'),
    path('sales/by-segment/',       views.by_segment,        name='by-segment'),
    path('sales/by-salesteam/',     views.by_sales_team,     name='by-salesteam'),
    path('sales/by-customer/',      views.by_customer,       name='by-customer'),
    path('sales/by-am/',            views.by_am,             name='by-am'),
    path('sales/by-month/',         views.by_month,          name='by-month'),
    path('sales/by-dealband/',      views.by_deal_band,      name='by-dealband'),
    path('sales/by-fy/',            views.by_fy,             name='by-fy'),

    # Technology-specific pages
    path('sales/cisco/',            views.cisco_page,        name='cisco-page'),
    path('sales/non-cisco/',        views.non_cisco_page,    name='non-cisco-page'),
    path('sales/amc/',              views.amc_page,          name='amc-page'),
    path('sales/saas/',             views.saas_page,         name='saas-page'),
    path('sales/cable/',            views.cable_page,        name='cable-page'),

    # Sheet-equivalent pages
    path('sales/band-wise/',        views.band_wise_page,    name='band-wise'),
    path('sales/sales-summary/',    views.sales_summary_page,name='sales-summary'),
    path('sales/tech-summary/',     views.tech_summary_page, name='tech-summary'),
    path('sales/big-deals/',        views.big_deals_page,    name='big-deals'),
    path('sales/large-deals/',      views.large_deals_page,  name='large-deals'),
    path('sales/fy/',               views.fy_page,           name='fy-page'),

    # Reference
    path('master-data/',            views.master_data,       name='master-data'),
    path('refresh/',                views.refresh_data,      name='refresh'),
    path('data-status/',            views.data_status,       name='data-status'),
    path('auth-test/',              views.auth_test,         name='auth-test'),
    path('bc-date-probe/',          views.bc_date_probe,     name='bc-date-probe'),
    path('settings/',               views.settings_view,     name='settings'),
]
