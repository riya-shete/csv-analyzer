import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHealth } from '../api';
import './Status.css';

export default function Status() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await getHealth();
            setHealth(res.data);
            setLastChecked(new Date());
        } catch {
            setHealth({
                overall: 'error',
                backend: { status: 'error', detail: 'Cannot reach server' },
                database: { status: 'unknown', detail: '' },
                llm: { status: 'unknown', detail: '' },
            });
            setLastChecked(new Date());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const statusLabel = (s) =>
        s === 'healthy' ? 'Healthy' : s === 'degraded' ? 'Degraded' : s === 'error' ? 'Error' : 'Unknown';

    const statusClass = (s) =>
        s === 'healthy' ? 'healthy' : s === 'degraded' ? 'degraded' : 'error';

    const services = health
        ? [
            { label: 'Backend Server', ...health.backend },
            { label: 'Database', ...health.database },
            { label: 'LLM Connection', ...health.llm },
        ]
        : [];

    return (
        <div className="status-page container">
            <Link to="/" className="back-link">← Back to Home</Link>
            <div className="status-top">
                <h1 className="page-title">System Status</h1>
                <button className="btn btn-secondary btn-sm" onClick={fetchHealth} disabled={loading}>
                    {loading ? 'Checking...' : 'Refresh'}
                </button>
            </div>

            {lastChecked && (
                <p className="last-checked">Last checked: {lastChecked.toLocaleTimeString()}</p>
            )}

            {loading && !health ? (
                <div className="loading-container">
                    <div className="spinner" />
                    <p>Checking system health...</p>
                </div>
            ) : (
                <>
                    {health && (
                        <div className={`overall-banner ${statusClass(health.overall)}`}>
                            <span className="dot" />
                            {health.overall === 'healthy'
                                ? 'All Systems Operational'
                                : health.overall === 'degraded'
                                    ? 'Partial Outage'
                                    : 'System Issues Detected'}
                        </div>
                    )}

                    <div className="services-list">
                        {services.map((svc) => (
                            <div key={svc.label} className="service-card card">
                                <div className="service-row">
                                    <span className="service-name">{svc.label}</span>
                                    <span className={`badge ${statusClass(svc.status)}`}>
                                        {statusLabel(svc.status)}
                                    </span>
                                </div>
                                {svc.detail && <p className="service-detail">{svc.detail}</p>}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
