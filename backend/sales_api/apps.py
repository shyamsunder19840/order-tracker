import threading
from django.apps import AppConfig


class SalesApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sales_api'

    def ready(self):
        """Pre-warm raw + enriched caches in a background thread on startup."""
        def _warm():
            try:
                from .bc_client      import fetch_all_sales_records
                from .data_processor import enrich_all
                from .bc_client      import CACHE_ENRICHED, DATA_TTL
                from django.core.cache import cache

                print('[sales_api] Pre-warming cache...')
                raw = fetch_all_sales_records()
                print(f'[sales_api] Fetched {len(raw):,} raw records. Enriching...')
                enriched = enrich_all(raw)
                cache.set(CACHE_ENRICHED, enriched, DATA_TTL)
                print(f'[sales_api] Done — {len(enriched):,} enriched records cached. All API calls are now instant.')
            except Exception as exc:
                print(f'[sales_api] Cache pre-warm failed: {exc}')

        t = threading.Thread(target=_warm, daemon=True)
        t.start()
