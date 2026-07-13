import os
import sys
from pathlib import Path

# ── Path resolution: dev vs PyInstaller frozen exe ───────────────────────────
if getattr(sys, 'frozen', False):
    # Running as a compiled .exe
    # sys._MEIPASS  → read-only temp dir where PyInstaller extracts files
    # sys.executable parent → writable dir next to the .exe (for bc_config.json)
    APP_DIR  = Path(sys._MEIPASS)
    DATA_DIR = Path(sys.executable).parent
else:
    # Running in normal Python dev mode
    APP_DIR  = Path(__file__).resolve().parent.parent
    DATA_DIR = APP_DIR

BASE_DIR      = APP_DIR
FRONTEND_DIST = APP_DIR / 'frontend_dist'

# True only when the app has been built (frontend/dist copied in)
_HAS_FRONTEND = (FRONTEND_DIST / 'index.html').exists()

# ── Core ─────────────────────────────────────────────────────────────────────
# Env vars are unset in dev / the PyInstaller desktop exe, so these defaults
# preserve today's behavior there. Render sets DJANGO_DEBUG=False and a real
# DJANGO_SECRET_KEY.
SECRET_KEY   = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-order-tracker-change-in-production')
DEBUG        = os.environ.get('DJANGO_DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'corsheaders',
    'orders',
]

# WhiteNoise must come right after SecurityMiddleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True
ROOT_URLCONF = 'order_tracker.urls'

# ── Templates: point at the React build so index.html can be served ──────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [str(FRONTEND_DIST)] if _HAS_FRONTEND else [],
        'APP_DIRS': False,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

# ── Database (not really used — no app models) ───────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(DATA_DIR / 'db.sqlite3'),
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Static / WhiteNoise ───────────────────────────────────────────────────────
# WHITENOISE_ROOT tells WhiteNoise to also serve all files from frontend_dist/
# at their relative URL paths, e.g.:
#   frontend_dist/index.html        → http://localhost:8001/
#   frontend_dist/assets/index.js   → http://localhost:8001/assets/index.js
STATIC_URL  = '/static/'
STATIC_ROOT = str(DATA_DIR / '_static_collected')

if _HAS_FRONTEND:
    WHITENOISE_ROOT = str(FRONTEND_DIST)

# ── Business Central ──────────────────────────────────────────────────────────
# Read from the environment so real credentials never live in source/git.
# Locally (dev or the desktop exe), set these in your shell, or use the app's
# own Settings screen, which persists overrides to bc_config.json instead.
BC_TENANT_ID     = os.environ.get('BC_TENANT_ID', '')
BC_CLIENT_ID     = os.environ.get('BC_CLIENT_ID', '')
BC_CLIENT_SECRET = os.environ.get('BC_CLIENT_SECRET', '')
BC_COMPANY_ID    = os.environ.get('BC_COMPANY_ID', '')
BC_ENVIRONMENT   = os.environ.get('BC_ENVIRONMENT', '')
BC_RESOURCE      = os.environ.get('BC_RESOURCE', 'https://api.businesscentral.dynamics.com')
BC_COMPANY_NAME  = os.environ.get('BC_COMPANY_NAME', '')

BC_USERNAME = os.environ.get('BC_USERNAME', '')
BC_PASSWORD = os.environ.get('BC_PASSWORD', '')
