from rest_framework import serializers
from .models import CSVReport


class CSVReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing reports (no preview_data to keep it fast)."""

    class Meta:
        model = CSVReport
        fields = [
            'id', 'original_filename', 'columns', 'row_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class CSVReportDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all data including preview and insights."""

    class Meta:
        model = CSVReport
        fields = [
            'id', 'original_filename', 'file', 'columns', 'row_count',
            'preview_data', 'column_stats', 'insights', 'follow_up_answers',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'columns', 'row_count', 'preview_data', 'column_stats',
            'insights', 'follow_up_answers', 'created_at', 'updated_at',
        ]


class FollowUpQuestionSerializer(serializers.Serializer):
    """Serializer for follow-up question requests."""
    question = serializers.CharField(max_length=500)
