import { useState } from 'react';
import './InteractiveCharts.css';
import { Icon } from '../../Icons';

export const SchemeBarChart = ({ schemeList, onSchemeSelect, activeScheme }) => {
  const [metric, setMetric] = useState('investment'); // 'investment' | 'brokerage' | 'units'

  const schemes = schemeList || [];
  const metricFields = {
    investment: 'totalInvestment',
    brokerage: 'brokerageAmount',
    units: 'totalUnits',
    'current value': 'currentValue',
  };
  const field = metricFields[metric];
  const values = schemes.filter((scheme) => scheme[field] !== null && scheme[field] !== undefined && Number.isFinite(Number(scheme[field])));
  const maxVal = Math.max(...values.map((scheme) => Number(scheme[field])), 1);

  const formatValue = (val) => {
    if (metric === 'investment') return `₹${val.toLocaleString('en-IN')}`;
    if (metric === 'brokerage') return `₹${val.toLocaleString('en-IN')}`;
    if (metric === 'current value') return `₹${val.toLocaleString('en-IN')}`;
    return `${val.toLocaleString('en-IN')} units`;
  };

  return (
    <div className="chart-box">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-main-title">
            <Icon name="returns" size={16} color="var(--primary)" />
            Scheme Performance & Distribution
          </h3>
          <p className="chart-sub-title">Visualizing scheme metrics extracted from uploaded records</p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['investment', 'brokerage', 'units', 'current value'].map((m) => (
            <button
              key={m}
              className="btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                textTransform: 'capitalize',
                background: metric === m ? 'var(--primary)' : 'var(--bg-input)',
                color: metric === m ? '#fff' : 'var(--text-secondary)',
                borderColor: metric === m ? 'var(--primary)' : 'var(--border-subtle)'
              }}
              onClick={() => setMetric(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {values.length === 0 ? (
        <div className="chart-empty-state">No {metric} values were found in the uploaded document.</div>
      ) : (
        <div className="bar-chart-flex" role="list" aria-label={`${metric} by scheme`}>
        {values.slice(0, 10).map((s, idx) => {
          const val = Number(s[field]);
          const heightPct = Math.max((val / maxVal) * 140, 8);

          return (
            <button
              type="button"
              key={`${s.schemeName}-${idx}`}
              className={`bar-col-item ${activeScheme === s.schemeName ? 'bar-col-item-active' : ''}`}
              onClick={() => onSchemeSelect?.(activeScheme === s.schemeName ? null : s.schemeName)}
              aria-label={`Filter table by ${s.schemeName}, ${metric}: ${formatValue(val)}`}
              aria-pressed={activeScheme === s.schemeName}
            >
              <div className="bar-hover-badge">
                {s.schemeName}: {formatValue(val)}
              </div>
              <div
                className="bar-rect-visual"
                style={{
                  height: `${heightPct}px`,
                  background: metric === 'brokerage' 
                    ? 'linear-gradient(180deg, #a855f7, #6366f1)' 
                    : metric === 'units'
                    ? 'linear-gradient(180deg, #06b6d4, #0891b2)'
                    : 'linear-gradient(180deg, #6366f1, #4338ca)'
                }}
              ></div>
              <span className="bar-col-label" title={s.schemeName}>
                {s.schemeName.split(' ')[0]} {s.schemeName.split(' ')[1] || ''}
              </span>
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
};

export const MonthlyTrendLineChart = ({ records = [] }) => {
  const monthly = new Map();
  records.forEach((record) => {
    if (!record.transactionDate || record.brokerageAmount == null || !Number.isFinite(Number(record.brokerageAmount))) return;
    const date = new Date(record.transactionDate);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthly.get(key) || { key, date, value: 0 };
    entry.value += Number(record.brokerageAmount);
    monthly.set(key, entry);
  });
  const data = [...monthly.values()].sort((a, b) => a.date - b.date);
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => ({
    ...item,
    x: data.length === 1 ? 205 : 30 + (index * 350) / (data.length - 1),
    y: 170 - (item.value / maxValue) * 135,
    label: item.date.toLocaleDateString('en-IN', { year: '2-digit', month: 'short' }),
  }));
  const pathD = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaD = points.length ? `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z` : '';
  return (
    <div className="chart-box">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-main-title">
            <Icon name="trendUp" size={16} color="var(--success)" />
            Monthly Brokerage Trend
          </h3>
          <p className="chart-sub-title">Grouped by transaction month from the uploaded records</p>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="chart-empty-state">Monthly trend is unavailable because transaction dates or brokerage amounts are missing.</div>
      ) : (
      <div className="svg-chart-wrapper" role="img" aria-label="Monthly brokerage amounts for the uploaded document">
        <svg viewBox="0 0 410 200" className="svg-chart-element">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="40" x2="400" y2="40" className="grid-line" />
          <line x1="20" y1="90" x2="400" y2="90" className="grid-line" />
          <line x1="20" y1="140" x2="400" y2="140" className="grid-line" />
          <line x1="20" y1="180" x2="400" y2="180" stroke="var(--border-subtle)" strokeWidth="1" />

          <path d={areaD} className="chart-area-fill" />
          <path d={pathD} className="chart-stroke-line" />
          {points.map((point) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r="5" className="chart-data-dot">
                <title>{point.label}: ₹{point.value.toLocaleString('en-IN')}</title>
              </circle>
              <text x={point.x} y={Math.max(point.y - 10, 12)} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="700">
                ₹{point.value.toLocaleString('en-IN')}
              </text>
              <text x={point.x} y="196" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="600">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      )}
    </div>
  );
};

export const AssetDonutChart = ({ schemeList = [] }) => {
  const eligibleSchemes = schemeList.filter((scheme) =>
    scheme.totalInvestment !== null &&
    scheme.totalInvestment !== undefined &&
    Number.isFinite(Number(scheme.totalInvestment)) &&
    Number(scheme.totalInvestment) >= 0
  );
  const totalInvestment = eligibleSchemes.reduce((sum, scheme) => sum + Number(scheme.totalInvestment), 0);
  const colors = ['#6366f1', '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ec4899'];
  const slices = eligibleSchemes.filter((scheme) => Number(scheme.totalInvestment) > 0).reduce((acc, scheme, index) => {
    const percentage = totalInvestment ? (Number(scheme.totalInvestment) / totalInvestment) * 100 : 0;
    const startAngle = acc.lastAngle;
    const endAngle = startAngle + (percentage * 3.6);
    acc.slices.push({
      schemeName: scheme.schemeName,
      totalInvestment: Number(scheme.totalInvestment),
      percentage,
      color: colors[index % colors.length],
      startAngle,
      endAngle,
    });
    acc.lastAngle = endAngle;
    return acc;
  }, { lastAngle: 0, slices: [] }).slices;

  return (
    <div className="chart-box">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-main-title">
            <Icon name="assets" size={16} color="var(--secondary)" />
            Investment Allocation by Scheme
          </h3>
          <p className="chart-sub-title">Share of recorded investment values in the uploaded document</p>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="chart-empty-state">Investment allocation is unavailable because scheme investment amounts are missing.</div>
      ) : <div className="donut-container">
        {/* SVG Donut Ring */}
        <div className="donut-svg-wrap">
          <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {slices.map((slice) => {
              const r = 44;
              const c = 2 * Math.PI * r;
              const strokeDasharray = `${(slice.percentage / 100) * c} ${c}`;
              const strokeDashoffset = -((slice.startAngle / 360) * c);

              return (
                <circle
                  key={slice.schemeName}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="16"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'all 0.5s ease' }}
                />
              );
            })}
          </svg>

          <div className="donut-center-text">
            <div className="donut-center-label">Investment</div>
            <div className="donut-center-value">₹{totalInvestment.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="donut-legend-list">
          {slices.slice(0, 8).map((item) => (
            <div key={item.schemeName} className="donut-legend-item">
              <div className="donut-legend-left">
                <span className="legend-color-dot" style={{ background: item.color }}></span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{item.schemeName}</span>
              </div>
              <strong style={{ color: 'var(--text-secondary)' }}>{item.percentage.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
};

export const TransactionDistributionChart = ({ records = [] }) => {
  const distribution = new Map();
  records.forEach((record) => {
    const transactionType = record.transactionType?.trim();
    if (!transactionType) return;
    distribution.set(transactionType, (distribution.get(transactionType) || 0) + 1);
  });
  const types = [...distribution.entries()].sort((a, b) => b[1] - a[1]);
  const total = types.reduce((sum, [, count]) => sum + count, 0);
  const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent-purple)', 'var(--warning)'];
  return (
    <div className="chart-box">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-main-title">
            <Icon name="wallet" size={16} color="var(--primary-light)" />
            Transaction-Type Distribution
          </h3>
          <p className="chart-sub-title">Counts grouped by transaction type in the uploaded records</p>
        </div>
      </div>

      {types.length === 0 ? <div className="chart-empty-state">Transaction type values are not available in this document.</div> : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
        {types.map(([type, count], index) => (
          <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{type}</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>
                {count} records ({((count / total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="alloc-bar-bg" style={{ height: '7px' }}>
              <div className="alloc-bar-fill" style={{ width: `${(count / total) * 100}%`, background: colors[index % colors.length] }}></div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
