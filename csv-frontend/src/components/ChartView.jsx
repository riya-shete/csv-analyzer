import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import './ChartView.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = [
    'rgba(79, 70, 229, 0.65)',
    'rgba(139, 92, 246, 0.65)',
    'rgba(236, 72, 153, 0.65)',
    'rgba(16, 185, 129, 0.65)',
    'rgba(245, 158, 11, 0.65)',
    'rgba(14, 165, 233, 0.65)',
];

const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#5a5d6b', font: { family: 'Inter', size: 12 } },
        },
    },
    scales: {
        x: {
            ticks: { color: '#8b8fa3', font: { size: 11 } },
            grid: { color: '#f1f3f5' },
        },
        y: {
            ticks: { color: '#8b8fa3', font: { size: 11 } },
            grid: { color: '#f1f3f5' },
        },
    },
};

export default function ChartView({ report }) {
    if (!report?.column_stats) {
        return <p className="empty-state">No data available for charts.</p>;
    }

    const numericCols = Object.entries(report.column_stats)
        .filter(([, stats]) => stats.mean !== undefined)
        .map(([col]) => col);

    const categoricalCols = Object.entries(report.column_stats)
        .filter(([, stats]) => stats.top_values && Object.keys(stats.top_values).length > 0)
        .map(([col]) => col);

    if (numericCols.length === 0 && categoricalCols.length === 0) {
        return <p className="empty-state">No suitable columns found for visualization.</p>;
    }

    return (
        <div className="chart-view">
            {numericCols.length > 0 && (
                <div className="chart-card">
                    <h3 className="chart-title">Numeric Column Statistics</h3>
                    <div className="chart-container">
                        <Bar
                            data={{
                                labels: numericCols,
                                datasets: [
                                    { label: 'Mean', data: numericCols.map((c) => report.column_stats[c].mean), backgroundColor: COLORS[0] },
                                    { label: 'Median', data: numericCols.map((c) => report.column_stats[c].median), backgroundColor: COLORS[1] },
                                ],
                            }}
                            options={baseOptions}
                        />
                    </div>
                </div>
            )}

            {numericCols.length > 0 && (
                <div className="chart-card">
                    <h3 className="chart-title">Value Ranges (Min / Max)</h3>
                    <div className="chart-container">
                        <Bar
                            data={{
                                labels: numericCols,
                                datasets: [
                                    { label: 'Min', data: numericCols.map((c) => report.column_stats[c].min), backgroundColor: COLORS[4] },
                                    { label: 'Max', data: numericCols.map((c) => report.column_stats[c].max), backgroundColor: COLORS[5] },
                                ],
                            }}
                            options={baseOptions}
                        />
                    </div>
                </div>
            )}

            {categoricalCols.slice(0, 3).map((col, idx) => {
                const topVals = report.column_stats[col].top_values;
                return (
                    <div key={col} className="chart-card">
                        <h3 className="chart-title">{col} — Top Values</h3>
                        <div className="chart-container">
                            <Bar
                                data={{
                                    labels: Object.keys(topVals),
                                    datasets: [{ label: 'Count', data: Object.values(topVals), backgroundColor: COLORS[idx % COLORS.length] }],
                                }}
                                options={baseOptions}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
