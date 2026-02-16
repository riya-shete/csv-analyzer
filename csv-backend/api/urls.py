"""URL patterns for the CSV Insights API."""

from django.urls import path
from . import views

urlpatterns = [
    # CSV Upload
    path('upload/', views.upload_csv, name='upload-csv'),

    # Reports
    path('reports/', views.list_reports, name='list-reports'),
    path('reports/<uuid:report_id>/', views.report_detail, name='report-detail'),
    path('reports/<uuid:report_id>/delete/', views.delete_report, name='delete-report'),

    # AI Insights
    path('reports/<uuid:report_id>/insights/', views.generate_report_insights, name='generate-insights'),
    path('reports/<uuid:report_id>/follow-up/', views.ask_follow_up, name='ask-follow-up'),

    # Health Check
    path('health/', views.health_check, name='health-check'),
]
