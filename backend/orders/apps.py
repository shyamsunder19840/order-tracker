from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'orders'

    def ready(self):
        """Apply any saved bc_config.json overrides to Django settings on startup."""
        from . import bc_config
        cfg = bc_config.load()
        bc_config.apply_to_django(cfg)
