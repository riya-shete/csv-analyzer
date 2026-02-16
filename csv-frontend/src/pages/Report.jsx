import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getReport, generateInsights, askFollowUp } from '../api';
import ChartView from '../components/ChartView';
import './Report.css';

export default function Report() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [question, setQuestion] = useState('');
    const [askingFollowUp, setAskingFollowUp] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            const res = await getReport(id);
            setReport(res.data);
        } catch {
            setError('Failed to load report.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInsights = async () => {
        setGenerating(true);
        setError('');
        try {
            const res = await generateInsights(id);
            setReport(res.data);
            setActiveTab('insights');
        } catch {
            setError('Failed to generate insights. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleAskFollowUp = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setAskingFollowUp(true);
        try {
            await askFollowUp(id, question);
            setQuestion('');
            await fetchReport();
        } catch {
            setError('Failed to get answer. Please try again.');
        } finally {
            setAskingFollowUp(false);
        }
    };

    const buildMarkdownExport = () => {
        if (!report) return '';
        let md = `# CSV Insights Report\n\n`;
        md += `**File:** ${report.original_filename}\n`;
        md += `**Rows:** ${report.row_count}\n`;
        md += `**Columns:** ${report.columns.join(', ')}\n`;
        md += `**Generated:** ${new Date(report.created_at).toLocaleString()}\n\n`;

        if (report.insights) {
            md += `---\n\n${report.insights}\n\n`;
        }

        if (report.follow_up_answers?.length > 0) {
            md += `---\n\n## Follow-up Questions\n\n`;
            report.follow_up_answers.forEach(({ question, answer }) => {
                md += `**Q:** ${question}\n\n${answer}\n\n`;
            });
        }

        return md;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(buildMarkdownExport());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Failed to copy.');
        }
    };

    const handleDownload = () => {
        const md = buildMarkdownExport();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.original_filename.replace('.csv', '')}_insights.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p>Loading report...</p>
            </div>
        );
    }

    if (error && !report) {
        return (
            <div className="container">
                <div className="error-message">{error}</div>
                <Link to="/history" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                    Back to Reports
                </Link>
            </div>
        );
    }

    return (
        <div className="report-page container">
            {/* Header */}
            <div className="report-header">
                <div>
                    <h1 className="page-title">{report.original_filename}</h1>
                    <p className="report-meta">
                        {report.row_count} rows · {report.columns.length} columns ·{' '}
                        {new Date(report.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="report-actions">
                    {!report.insights && (
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerateInsights}
                            disabled={generating}
                        >
                            {generating ? 'Generating...' : 'Generate Insights'}
                        </button>
                    )}
                    {report.insights && (
                        <>
                            <button className="btn btn-secondary" onClick={handleCopy}>
                                {copied ? 'Copied!' : 'Copy Report'}
                            </button>
                            <button className="btn btn-secondary" onClick={handleDownload}>
                                Download .md
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                >
                    Data Preview
                </button>
                <button
                    className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                    disabled={!report.insights}
                >
                    Insights
                </button>
                <button
                    className={`tab ${activeTab === 'charts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('charts')}
                >
                    Charts
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'preview' && (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {report.columns.map((col) => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {report.preview_data.slice(0, 50).map((row, i) => (
                                    <tr key={i}>
                                        {report.columns.map((col) => (
                                            <td key={col}>{row[col] !== undefined ? String(row[col]) : ''}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {report.row_count > 50 && (
                            <p className="table-note">
                                Showing 50 of {report.row_count} rows
                            </p>
                        )}
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="insights-content">
                        {generating ? (
                            <div className="loading-container">
                                <div className="spinner" />
                                <p>AI is analyzing your data...</p>
                            </div>
                        ) : report.insights ? (
                            <>
                                <div className="markdown-content">
                                    <ReactMarkdown>{report.insights}</ReactMarkdown>
                                </div>

                                {/* Follow-up Questions */}
                                {report.follow_up_answers?.length > 0 && (
                                    <div className="follow-ups">
                                        <h3 className="follow-up-title">Follow-up Questions</h3>
                                        {report.follow_up_answers.map((qa, i) => (
                                            <div key={i} className="qa-item">
                                                <div className="qa-question">{qa.question}</div>
                                                <div className="qa-answer">
                                                    <ReactMarkdown>{qa.answer}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form className="follow-up-form" onSubmit={handleAskFollowUp}>
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="Ask a follow-up question about your data..."
                                        className="follow-up-input"
                                        disabled={askingFollowUp}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!question.trim() || askingFollowUp}
                                    >
                                        {askingFollowUp ? 'Asking...' : 'Ask'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <p className="empty-state">
                                Click "Generate Insights" to analyze your data with AI.
                            </p>
                        )}
                    </div>
                )}

                {activeTab === 'charts' && (
                    <ChartView report={report} />
                )}
            </div>
        </div>
    );
}
