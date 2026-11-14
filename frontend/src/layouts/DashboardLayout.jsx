import { useState, useEffect } from 'react';
import './DashboardLayout.css';
import { Icon } from '../components/common/Icons';

export const DashboardLayout = ({ activeTab, setActiveTab, onLogout, profile, report, isDemoMode = false, children }) => {
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const activeProfile = profile || { name: "MFD Account", arn: "", tier: "Account" };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: 'dashboard' },
    { id: 'trends', label: 'Brokerage Trends & Growth', icon: 'trendUp' },
    { id: 'amc', label: 'AMC Performance Analysis', icon: 'assets' },
    { id: 'assets', label: 'Scheme Performance Analysis', icon: 'returns' },
    { id: 'brokerage', label: 'Commission & Rate Analysis', icon: 'brokerage' },
    { id: 'gst', label: 'GST & Tax Analysis', icon: 'fileSpreadsheet' },
    { id: 'audit', label: 'Brokerage Audit & Data Quality', icon: 'shield' },
    { id: 'accrual', label: 'Accrual & Payment Tracking', icon: 'wallet' },
    { id: 'percentage', label: 'Percentage Comparison Reports', icon: 'trendDown' },
    { id: 'insights', label: 'AI Business Insights', icon: 'insights' },
    { id: 'reports', label: 'Export & Download Reports', icon: 'reports' },
  ];

  const initials = activeProfile.name
    ? activeProfile.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'VS';

  const navigate = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div className="dashboard-container">
      <div className="bg-glow-orb bg-glow-1"></div>
      <div className="bg-glow-orb bg-glow-2"></div>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo-icon">
            <Icon name="brandLogo" size={24} color="#ffffff" />
          </div>
          <div className="brand-info">
            <span className="brand-name">FundLens-AI</span>
            <span className="brand-tagline">Brokerage Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} size={18} color={isActive ? 'var(--primary-light)' : 'var(--text-secondary)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="mfd-profile-card">
            <div className="mfd-avatar">{initials}</div>
            <div className="mfd-meta">
              <div className="mfd-name">{activeProfile.name}</div>
              <div className="mfd-arn">{activeProfile.arn ? `${activeProfile.arn} • ` : ''}{activeProfile.tier || 'MFD'}</div>
            </div>
            <button
              className={`utility-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('settings')}
            >
              <Icon name="settings" size={16} />
              <span>Settings</span>
            </button>
            {onLogout && (
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={onLogout}
                title="Sign Out"
              >
                Exit
              </button>
            )}
          </div>

          <div className="sidebar-controls">
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
              Menu
            </button>
            <div className="global-search-box">
              <Icon name="search" size={16} color="var(--text-muted)" />
              <input
                type="text"
                className="global-search-input"
                placeholder="Search document records, folios, or commission fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            {report && (
              <div className="ticker-pill">
                <span className="status-dot"></span>
                <span>Active Doc: <strong>{report.docName}</strong></span>
              </div>
            )}

            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={15} />
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <button className="header-secondary-btn" onClick={() => navigate('email')}>
              <Icon name="send" size={16} />
              <span>Import from Email</span>
            </button>
            <button className="header-secondary-btn" onClick={() => navigate('history')}>
              <Icon name="history" size={16} />
              <span>History</span>
            </button>
            <button className="header-secondary-btn" onClick={() => navigate('chatbot')}>
              <Icon name="chatbot" size={16} />
              <span>Ask AI</span>
            </button>
            <button
              className="header-action-btn"
              onClick={() => navigate('upload')}
            >
              <Icon name="upload" size={16} color="#fff" />
              <span>Upload Document</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content-body">
          {isDemoMode && (
            <div className="badge badge-warning" role="status" style={{ margin: '12px 20px 0', padding: '10px 14px' }}>
              DEMO MODE — illustrative sample data only. This workspace is local to this browser and does not save to the backend.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};
