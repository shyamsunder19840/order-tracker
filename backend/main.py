"""
main.py — PyInstaller entry point for Sales Order Tracker.

When bundled as an .exe this file is the starting point.
It sets up the Python path, starts Django on port 8001, and
opens the browser automatically.
"""
import sys
import os
import threading
import webbrowser
import time
import multiprocessing


def _open_browser():
    """Wait a few seconds then open the app in the default browser."""
    time.sleep(3)
    webbrowser.open('http://localhost:8001')


def main():
    # ── Path setup ────────────────────────────────────────────────────────────
    if getattr(sys, 'frozen', False):
        # PyInstaller extracts everything to sys._MEIPASS at runtime
        app_dir = sys._MEIPASS
    else:
        app_dir = os.path.dirname(os.path.abspath(__file__))

    # Ensure our Django packages are importable
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'order_tracker.settings')

    # ── Banner ────────────────────────────────────────────────────────────────
    print()
    print('=' * 56)
    print('  Sales Order Tracker')
    print('  Opening at  →  http://localhost:8001')
    print()
    print('  Keep this window open while using the app.')
    print('  Close this window (or press Ctrl+C) to stop.')
    print('=' * 56)
    print()

    # ── Open browser in background ────────────────────────────────────────────
    threading.Thread(target=_open_browser, daemon=True).start()

    # ── Start Django (--noreload avoids a second process that PyInstaller  ─────
    #    cannot handle correctly in frozen mode)
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'runserver', '8001', '--noreload'])


if __name__ == '__main__':
    multiprocessing.freeze_support()   # required on Windows for frozen apps
    main()
