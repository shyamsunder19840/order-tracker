"""
bc_config.py — read/write Business Central configuration from bc_config.json.

Priority: bc_config.json  >  settings.py defaults
On every save the live Django settings object is patched so services.py
picks up the new values immediately without a server restart.
"""
import json
import os
import sys
from django.conf import settings as _ds

# ── Config file location ──────────────────────────────────────────────────────
# Dev mode  : sits next to manage.py (project root)
# Frozen exe: sits next to the .exe so it is writable and persists between runs
if getattr(sys, 'frozen', False):
    _CONFIG_FILE = os.path.join(os.path.dirname(sys.executable), 'bc_config.json')
else:
    _CONFIG_FILE = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'bc_config.json',
    )

# All keys we manage
KEYS = [
    'BC_TENANT_ID',
    'BC_CLIENT_ID',
    'BC_CLIENT_SECRET',
    'BC_RESOURCE',
    'BC_ENVIRONMENT',
    'BC_COMPANY_ID',
    'BC_COMPANY_NAME',
    'BC_USERNAME',
    'BC_PASSWORD',
    'BC_STATIC_TOKEN',
]

# Keys masked when sent to the browser, and left untouched on save if the
# incoming value is still the masked placeholder (i.e. the user didn't edit it).
SECRET_KEYS = {'BC_CLIENT_SECRET', 'BC_PASSWORD', 'BC_STATIC_TOKEN'}


def _defaults():
    return {k: getattr(_ds, k, '') for k in KEYS}


def load() -> dict:
    """Return merged config: JSON overrides on top of settings.py defaults."""
    cfg = _defaults()
    try:
        with open(_CONFIG_FILE, encoding='utf-8') as f:
            overrides = json.load(f)
        cfg.update({k: v for k, v in overrides.items() if k in KEYS})
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    return cfg


def apply_to_django(cfg: dict):
    """Patch the live Django settings so services.py sees updated values."""
    for k, v in cfg.items():
        if k in KEYS and v:
            setattr(_ds, k, v)


def save(data: dict) -> dict:
    """
    Persist config to JSON file and apply to live Django settings.
    If a secret key is still masked (starts with '•'), the existing value is kept.
    """
    existing = load()
    to_save = {}
    for k in KEYS:
        if k not in data:
            continue
        v = data[k]
        if k in SECRET_KEYS and str(v).startswith('•'):
            v = existing.get(k, '')
        to_save[k] = v

    with open(_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(to_save, f, indent=2, ensure_ascii=False)

    apply_to_django(to_save)
    return to_save


def masked_load() -> dict:
    """Return config safe to send to the browser — secrets are masked."""
    cfg = load()
    for k in SECRET_KEYS:
        secret = cfg.get(k, '')
        if secret:
            cfg[k] = '•' * max(0, len(secret) - 4) + secret[-4:]
    return cfg
