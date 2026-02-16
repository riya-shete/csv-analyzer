"""
API Views for CSV Insights Dashboard.
Handles file upload, insight generation, report management, and health checks.
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db import connection

from .models import CSVReport
from .serializers import (
    CSVReportListSerializer,
    CSVReportDetailSerializer,
    FollowUpQuestionSerializer,
)
from .utils import parse_csv, generate_insights, generate_follow_up_answer, check_llm_health

logger = logging.getLogger(__name__)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_csv(request):
    """
    Upload a CSV file. Parses it and stores preview data + column stats.
    Returns the created report with preview data.
    """
    file = request.FILES.get('file')

    if not file:
        return Response(
            {'error': 'No file provided. Please upload a CSV file.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file extension
    filename = file.name.lower()
    if not filename.endswith('.csv'):
        return Response(
            {'error': 'Invalid file type. Only CSV files are accepted.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        return Response(
            {'error': 'File too large. Maximum size is 10 MB.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file is not empty
    if file.size == 0:
        return Response(
            {'error': 'The uploaded file is empty.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Parse CSV
        parsed = parse_csv(file)

        # Reset file position for saving
        file.seek(0)

        # Create report
        report = CSVReport.objects.create(
            original_filename=file.name,
            file=file,
            columns=parsed['columns'],
            row_count=parsed['row_count'],
            preview_data=parsed['preview_data'],
            column_stats=parsed['column_stats'],
        )

        serializer = CSVReportDetailSerializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        logger.exception("Error uploading CSV")
        return Response(
            {'error': 'An unexpected error occurred while processing the file.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
def generate_report_insights(request, report_id):
    """
    Generate AI insights for a specific report.
    Calls OpenRouter API with the report's column stats.
    """
    try:
        report = CSVReport.objects.get(id=report_id)
    except CSVReport.DoesNotExist:
        return Response(
            {'error': 'Report not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        insights = generate_insights(report)
        report.insights = insights
        report.save(update_fields=['insights', 'updated_at'])

        serializer = CSVReportDetailSerializer(report)
        return Response(serializer.data)

    except Exception as e:
        logger.exception("Error generating insights")
        return Response(
            {'error': 'Failed to generate insights. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
def ask_follow_up(request, report_id):
    """
    Ask a follow-up question about a report's data.
    Stores the Q&A pair in the report's follow_up_answers field.
    """
    try:
        report = CSVReport.objects.get(id=report_id)
    except CSVReport.DoesNotExist:
        return Response(
            {'error': 'Report not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = FollowUpQuestionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    question = serializer.validated_data['question']

    try:
        answer = generate_follow_up_answer(report, question)

        # Append to follow_up_answers
        follow_ups = report.follow_up_answers or []
        follow_ups.append({'question': question, 'answer': answer})
        report.follow_up_answers = follow_ups
        report.save(update_fields=['follow_up_answers', 'updated_at'])

        return Response({
            'question': question,
            'answer': answer,
        })

    except Exception as e:
        logger.exception("Error answering follow-up question")
        return Response(
            {'error': 'Failed to answer question. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
def list_reports(request):
    """List the most recent 5 reports (lightweight, no preview data)."""
    reports = CSVReport.objects.all()[:5]
    serializer = CSVReportListSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def report_detail(request, report_id):
    """Get full details of a specific report including preview data and insights."""
    try:
        report = CSVReport.objects.get(id=report_id)
    except CSVReport.DoesNotExist:
        return Response(
            {'error': 'Report not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = CSVReportDetailSerializer(report)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_report(request, report_id):
    """Delete a specific report and its associated file."""
    try:
        report = CSVReport.objects.get(id=report_id)
    except CSVReport.DoesNotExist:
        return Response(
            {'error': 'Report not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Delete the uploaded file
    if report.file:
        report.file.delete(save=False)

    report.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for the status page.
    Checks backend, database, and LLM connection.
    """
    health = {
        'backend': {'status': 'healthy', 'detail': 'Server is running'},
        'database': {'status': 'unknown', 'detail': ''},
        'llm': {'status': 'unknown', 'detail': ''},
    }

    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        report_count = CSVReport.objects.count()
        health['database'] = {
            'status': 'healthy',
            'detail': f'Connected. {report_count} reports stored.',
        }
    except Exception as e:
        health['database'] = {
            'status': 'error',
            'detail': f'Database error: {str(e)}',
        }

    # Check LLM
    health['llm'] = check_llm_health()

    # Overall status
    statuses = [v['status'] for v in health.values()]
    if all(s == 'healthy' for s in statuses):
        overall = 'healthy'
    elif any(s == 'error' for s in statuses):
        overall = 'error'
    else:
        overall = 'degraded'

    health['overall'] = overall

    return Response(health)
