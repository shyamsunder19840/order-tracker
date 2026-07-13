# -*- mode: python ; coding: utf-8 -*-
"""
OrderTracker.spec — PyInstaller build configuration.

Run via:  Build Executable.bat   (recommended)
      or: pyinstaller OrderTracker.spec --noconfirm
"""

import os
from PyInstaller.utils.hooks import collect_all, collect_data_files

# ── Collect all files from major packages ────────────────────────────────────
django_datas,       django_bins,       django_hidden       = collect_all('django')
drf_datas,          drf_bins,          drf_hidden          = collect_all('rest_framework')
whitenoise_datas,   whitenoise_bins,   whitenoise_hidden   = collect_all('whitenoise')
corsheaders_datas,  corsheaders_bins,  corsheaders_hidden  = collect_all('corsheaders')

BACKEND_DIR   = os.path.abspath('backend')
FRONTEND_DIST = os.path.abspath(os.path.join('frontend', 'dist'))

a = Analysis(
    [os.path.join(BACKEND_DIR, 'main.py')],
    pathex=[BACKEND_DIR],
    binaries=django_bins + drf_bins + whitenoise_bins + corsheaders_bins,
    datas=(
        django_datas + drf_datas + whitenoise_datas + corsheaders_datas
        + [
            # Django project package
            (os.path.join(BACKEND_DIR, 'order_tracker'), 'order_tracker'),
            # Django app
            (os.path.join(BACKEND_DIR, 'orders'),        'orders'),
            # Built React app (copied here by Build Executable.bat)
            (FRONTEND_DIST,                               'frontend_dist'),
        ]
    ),
    hiddenimports=(
        django_hidden + drf_hidden + whitenoise_hidden + corsheaders_hidden
        + [
            # Django internals commonly missed
            'django.template.loaders.filesystem',
            'django.template.loaders.app_directories',
            'django.template.defaulttags',
            'django.template.defaultfilters',
            'django.template.context_processors',
            'django.middleware.security',
            'django.middleware.common',
            'django.contrib.contenttypes.apps',
            'django.contrib.auth.apps',
            # Third-party
            'requests',
            'requests.adapters',
            'requests.auth',
            'urllib3',
            'certifi',
            'charset_normalizer',
            'idna',
            # Our app
            'orders',
            'orders.views',
            'orders.services',
            'orders.bc_config',
            'orders.urls',
            'orders.apps',
            'order_tracker',
            'order_tracker.settings',
            'order_tracker.urls',
            'order_tracker.wsgi',
        ]
    ),
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'PIL', 'scipy'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='OrderTracker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,        # show a console window (useful to see status / errors)
    icon=None,           # add an .ico path here if you have one
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='OrderTracker',
)
