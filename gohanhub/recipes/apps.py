from django.apps import AppConfig

class RecipesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recipes'

    def ready(self):
        # Import signals so they're registered
        try:
            import recipes.signals  # noqa: F401
        except Exception:
            pass
