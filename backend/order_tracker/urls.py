from django.urls import path, include, re_path
from django.http import HttpResponse, Http404
from django.conf import settings
import os


def serve_react(request):
    """
    Catch-all: serve the React index.html for any non-API path.
    This lets React handle its own client-side state on page refresh.
    """
    index_file = os.path.join(str(settings.FRONTEND_DIST), 'index.html')
    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    except FileNotFoundError:
        return HttpResponse(
            '<h2>Frontend not built yet.</h2>'
            '<p>Run: <code>cd frontend &amp;&amp; npm run build</code></p>',
            status=404,
        )


urlpatterns = [
    path('api/', include('orders.urls')),

    # Serve React app for every other path (must be last)
    re_path(r'^(?!api/).*$', serve_react),
]
