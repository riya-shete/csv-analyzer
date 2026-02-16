from django.contrib import admin
from .models import CSVReport


@admin.register(CSVReport)
class CSVReportAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'row_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['original_filename']
    readonly_fields = ['id', 'columns', 'row_count', 'column_stats', 'created_at', 'updated_at']
