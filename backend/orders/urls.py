from django.urls import path
from . import views

urlpatterns = [
    path('connect/',    views.connect,            name='connect'),
    path('disconnect/', views.disconnect,         name='disconnect'),
    path('status/',     views.connection_status,  name='status'),
    path('tracker/',  views.get_tracker_orders, name='tracker'),
    path('orders/',   views.get_orders,         name='get_orders'),
    path('config/',   views.manage_config,      name='config'),
]
