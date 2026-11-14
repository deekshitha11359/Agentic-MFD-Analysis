import { Icon } from '../../../components/common/Icons';
import { TOP_SCHEMES } from '../../../data/mockData';

export const ReturnsPage = ({ onNavigate }) => {
  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Performance & XIRR Analytics</h1>
          <p className="overview-subtitle">
            Investor return benchmarking, risk-adjusted alpha & scheme performance
          </p>
        </div>

        <div className="overview-actions">
          <button className="btn-secondary" onClick={() => onNavigate('reports')}>
            <Icon name="reports" size={15} />
            <span>Generate Performance Sheet</span>
          </button>
        </div>
      </div>

      {/* Return Comparison Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">DISTRIBUTOR WEIGHTED XIRR</span>
            <div className="metric-icon-wrap icon-emerald">
              <Icon name="returns" size={18} />
            </div>
          </div>
          <span className="metric-main-val" style={{ color: 'var(--success)' }}>+16.85%</span>
          <div className="metric-footer">
            <span>Overall Client Portfolio</span>
            <span>Annualized 3Y</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">BENCHMARK (NIFTY 50 TRI)</span>
            <div className="metric-icon-wrap icon-blue">
              <Icon name="trendUp" size={18} />
            </div>
          </div>
          <span className="metric-main-val">+13.20%</span>
          <div className="metric-footer">
            <span>Large Cap Benchmark</span>
            <span>3Y CAGR</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">ALPHA GENERATED</span>
            <div className="metric-icon-wrap icon-purple">
              <Icon name="insights" size={18} />
            </div>
          </div>
          <span className="metric-main-val" style={{ color: 'var(--primary-light)' }}>+3.65%</span>
          <div className="metric-footer">
            <span>Outperformance vs Index</span>
            <span className="badge badge-success">Top Decile</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">PORTFOLIO SHARPE RATIO</span>
            <div className="metric-icon-wrap icon-amber">
              <Icon name="shield" size={18} />
            </div>
          </div>
          <span className="metric-main-val">1.48</span>
          <div className="metric-footer">
            <span>Risk-adjusted ratio</span>
            <span>Beta: 0.88</span>
          </div>
        </div>
      </div>

      {/* Scheme Performance Table */}
      <div className="mfd-card">
        <div className="chart-card-header">
          <div>
            <h2 className="chart-card-title">
              <Icon name="returns" size={18} color="var(--primary-light)" />
              Scheme-Level Return Matrix & Benchmark Comparison
            </h2>
            <p className="overview-subtitle">Comparing individual fund CAGR against category averages</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="mfd-table">
            <thead>
              <tr>
                <th>Fund Name</th>
                <th>Category</th>
                <th>1Y Return</th>
                <th>3Y CAGR</th>
                <th>Investor Realized XIRR</th>
                <th>Category Average</th>
                <th>Alpha Spread</th>
              </tr>
            </thead>
            <tbody>
              {TOP_SCHEMES.map((scheme) => {
                const catAvg = (scheme.cagr3y - 2.8).toFixed(1);
                const alpha = (scheme.cagr3y - catAvg).toFixed(1);

                return (
                  <tr key={scheme.id}>
                    <td>
                      <div className="scheme-name-cell">
                        <span className="scheme-title">{scheme.name}</span>
                        <span className="scheme-category-tag">{scheme.amc}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{scheme.category}</span></td>
                    <td><strong>+{(scheme.cagr3y * 1.15).toFixed(1)}%</strong></td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: '700' }}>+{scheme.cagr3y}%</td>
                    <td><span className="xirr-badge">+{scheme.xirr}%</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>+{catAvg}%</td>
                    <td>
                      <span className="badge badge-success">+{alpha}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
