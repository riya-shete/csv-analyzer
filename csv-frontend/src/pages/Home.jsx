import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadCSV, getReports, deleteReport } from '../api';
import './Home.css';

export default function Home() {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await getReports();
            setReports(res.data);
        } catch {
            // silently fail for reports list
        } finally {
            setLoadingReports(false);
        }
    };

    const validateFile = (f) => {
        if (!f) return 'Please select a file.';
        if (!f.name.toLowerCase().endsWith('.csv')) return 'Only CSV files are accepted.';
        if (f.size > 25 * 1024 * 1024) return 'File size must be under 25 MB.';
        if (f.size === 0) return 'The file is empty.';
        return '';
    };

    const isLargeFile = file && file.size > 10 * 1024 * 1024;

    const handleFile = (f) => {
        const err = validateFile(f);
        if (err) {
            setError(err);
            setFile(null);
            return;
        }
        setError('');
        setFile(f);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const res = await uploadCSV(file);
            navigate(`/report/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this report?')) return;
        try {
            await deleteReport(id);
            setReports((prev) => prev.filter((r) => r.id !== id));
        } catch {
            setError('Failed to delete report.');
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="home container">
            {/* Header */}
            <div className="home-header">
                <h1 className="home-title">CSV Insights Dashboard</h1>
                <p className="home-subtitle">
                    Upload a CSV file to preview your data, generate AI-powered insights, and export reports.
                </p>
            </div>

            {/* Upload Section */}
            <section className="upload-section card">
                <h2 className="section-label">Upload CSV File</h2>
                <div
                    className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFile(e.target.files[0])}
                        hidden
                    />
                    {file ? (
                        <div className="file-info">
                            <div className="file-badge">CSV</div>
                            <div className="file-details">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatSize(file.size)}</span>
                            </div>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="drop-content">
                            <svg className="drop-icon" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p className="drop-text">Drag and drop your CSV file here, or click to browse</p>
                            <p className="drop-hint">Maximum file size: 25 MB</p>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {isLargeFile && !error && (
                    <div className="info-message">
                        Large dataset detected. Processing may take longer. Insights are generated using aggregated statistics for performance.
                    </div>
                )}

                <button
                    className="btn btn-primary upload-btn"
                    disabled={!file || uploading}
                    onClick={handleUpload}
                >
                    {uploading ? (
                        <>
                            <span className="spinner small" />
                            Analyzing...
                        </>
                    ) : (
                        'Upload & Analyze'
                    )}
                </button>
            </section>

            {/* Recent Reports */}
            <section className="reports-section">
                <h2 className="section-label">Recent Reports</h2>
                {loadingReports ? (
                    <div className="loading-container">
                        <div className="spinner" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="empty-box card">
                        <p>No reports yet. Upload a CSV file to get started.</p>
                    </div>
                ) : (
                    <div className="reports-list">
                        {reports.map((r) => (
                            <div key={r.id} className="report-item card">
                                <div className="report-item-info">
                                    <span className="report-item-name">{r.original_filename}</span>
                                    <span className="report-item-meta">
                                        {r.row_count} rows · {r.columns.length} columns ·{' '}
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="report-item-actions">
                                    <Link to={`/report/${r.id}`} className="btn btn-primary btn-sm">View</Link>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* How It Works */}
            <section className="steps-section">
                <h2 className="section-label">How It Works</h2>
                <div className="steps-grid">
                    <div className="step-card card">
                        <span className="step-number">1</span>
                        <h3>Upload</h3>
                        <p>Upload any CSV file up to 10 MB using drag-and-drop or file picker.</p>
                    </div>
                    <div className="step-card card">
                        <span className="step-number">2</span>
                        <h3>Preview</h3>
                        <p>Instantly preview your data in a clean table with column statistics.</p>
                    </div>
                    <div className="step-card card">
                        <span className="step-number">3</span>
                        <h3>Insights</h3>
                        <p>Generate AI-powered analysis with trends, outliers, and recommendations.</p>
                    </div>
                    <div className="step-card card">
                        <span className="step-number">4</span>
                        <h3>Export</h3>
                        <p>Copy to clipboard, download as Markdown, or ask follow-up questions.</p>
                    </div>
                </div>
            </section>

            {/* What You Get */}
            <section className="features-section">
                <h2 className="section-label">What You Get</h2>
                <div className="features-grid">
                    <div className="feature-item card">
                        <h3>Data Table Preview</h3>
                        <p>Browse your CSV data in a sortable, scrollable table view.</p>
                    </div>
                    <div className="feature-item card">
                        <h3>Auto-generated Charts</h3>
                        <p>Bar charts for numeric stats and categorical distributions.</p>
                    </div>
                    <div className="feature-item card">
                        <h3>AI Summary Report</h3>
                        <p>Trends, outliers, patterns, and actionable next steps.</p>
                    </div>
                    <div className="feature-item card">
                        <h3>Follow-up Questions</h3>
                        <p>Ask the AI anything about your data after generating insights.</p>
                    </div>
                    <div className="feature-item card">
                        <h3>Report History</h3>
                        <p>Access your last 5 reports anytime from this page.</p>
                    </div>
                    <div className="feature-item card">
                        <h3>Export Options</h3>
                        <p>Download reports as Markdown or copy them to clipboard.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
