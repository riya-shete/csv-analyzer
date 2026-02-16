import uuid
from django.db import models


class CSVReport(models.Model):
    """Stores an uploaded CSV file along with its parsed data and AI insights."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_filename = models.CharField(max_length=255)
    file = models.FileField(upload_to='csv_uploads/')

    # Parsed data stored as JSON
    columns = models.JSONField(default=list, help_text="List of column names")
    row_count = models.IntegerField(default=0)
    preview_data = models.JSONField(default=list, help_text="First 100 rows as list of dicts")
    column_stats = models.JSONField(default=dict, help_text="Basic stats per column")

    # AI-generated insights
    insights = models.TextField(blank=True, default='')
    follow_up_answers = models.JSONField(default=list, help_text="List of follow-up Q&A pairs")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'CSV Report'
        verbose_name_plural = 'CSV Reports'

    def __str__(self):
        return f"{self.original_filename} ({self.created_at:%Y-%m-%d %H:%M})"
