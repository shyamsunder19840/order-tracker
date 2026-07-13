import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import authenticate, fetch_orders, fetch_tracker_orders, is_connected
from . import bc_config

logger = logging.getLogger(__name__)


@api_view(['POST'])
def connect(request):
    """Accept username+password from the frontend, generate and cache a token."""
    username = (request.data.get('username') or '').strip()
    password = (request.data.get('password') or '').strip()

    if not username or not password:
        return Response(
            {'error': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        authenticate(username, password)
        return Response({'status': 'connected'})
    except Exception as exc:
        msg = str(exc)
        if 'AADSTS50126' in msg:
            friendly = 'Invalid username or password. Please check your BC credentials.'
        elif 'AADSTS50076' in msg or 'AADSTS50079' in msg:
            friendly = 'Multi-factor authentication is required. ROPC does not support MFA.'
        elif 'AADSTS70011' in msg:
            friendly = 'Invalid scope. The app may not have Business Central API permissions.'
        else:
            friendly = msg
        logger.warning('Connect failed for %s: %s', username, msg)
        return Response({'error': friendly}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def connection_status(request):
    return Response({'connected': is_connected()})


@api_view(['POST'])
def disconnect(request):
    """Clear the cached token so the user is logged out."""
    from .services import _cache, _lock
    with _lock:
        _cache['access_token']  = None
        _cache['refresh_token'] = None
        _cache['expires_at']    = 0
    return Response({'status': 'disconnected'})


@api_view(['GET'])
def get_tracker_orders(request):
    """Return all OrderTrackerAPI records for the tracker table."""
    if not is_connected():
        return Response(
            {'error': 'Not connected. Please sign in first.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    try:
        orders = fetch_tracker_orders()
        return Response({'orders': orders, 'count': len(orders)})
    except Exception as exc:
        logger.exception('Failed to fetch tracker orders')
        return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['GET'])
def get_orders(request):
    if not is_connected():
        return Response(
            {'error': 'Not connected. Please sign in first.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    so_no = request.query_params.get('so_no', '').strip()
    if not so_no:
        return Response(
            {'error': 'Query parameter "so_no" is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        orders = fetch_orders(so_no)
        return Response({'orders': orders, 'count': len(orders)})
    except Exception as exc:
        logger.exception('Failed to fetch orders: %s', customer_po_no)
        return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['GET', 'POST'])
def manage_config(request):
    """GET: return current BC config (secret masked).  POST: save updated config."""
    if request.method == 'GET':
        return Response(bc_config.masked_load())

    # POST — save
    try:
        saved = bc_config.save(request.data)
        # Re-mask secret before echoing back
        if saved.get('BC_CLIENT_SECRET'):
            s = saved['BC_CLIENT_SECRET']
            saved['BC_CLIENT_SECRET'] = '•' * max(0, len(s) - 4) + s[-4:]
        return Response({'status': 'saved', 'config': saved})
    except Exception as exc:
        logger.exception('Failed to save config')
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
