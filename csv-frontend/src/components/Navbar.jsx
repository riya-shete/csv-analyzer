import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();

    const links = [
        { to: '/', label: 'Home' },
        { to: '/status', label: 'Status' },
    ];

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">CSV Insights</Link>
            <div className="navbar-links">
                {links.map(({ to, label }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`nav-link ${location.pathname === to ? 'active' : ''}`}
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
