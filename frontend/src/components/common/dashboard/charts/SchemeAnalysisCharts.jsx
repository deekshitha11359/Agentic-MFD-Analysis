import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import './InteractiveCharts.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const CHART_COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#14b8a6'];
const METRICS = [
  { id: 'investment', label: 'Investment by Scheme', field: 'totalInvestment', currency: true },
  { id: 'valueComparison', label: 'Current Value vs Investment', field: 'currentValue', comparison: true, currency: true },
  { id: 'profitLoss', label: 'Profit/Loss by Scheme', field: 'currentValue', currency: true },
  { id: 'returnPercentage', label: 'Return Percentage by Scheme', field: 'returnPercentage', percent: true },
  { id: 'units', label: 'Units Held by Scheme', field: 'totalUnits', unit: 'units' },
  { id: 'brokerage', label: 'Brokerage by Scheme', field: 'brokerageAmount', currency: true },
];

const isFiniteNumber = (value) => value !== null && value !== undefined && Number.isFinite(Number(value));

const formatValue = (value, metric) => {
  if (metric.currency) return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (metric.percent) return `${Number(value).toFixed(2)}%`;
  const formatted = Number(value).toLocaleString('en-IN', { maximumFractionDigits: 4 });
  return metric.unit ? `${formatted} ${metric.unit}` : formatted;
};

export const SchemeAnalysisCharts = ({
  schemeList,
  selectedSchemes,
  onSelectedSchemesChange,
  onSchemeSelect,
  hasReliableReturns,
}) => {
  const schemes = schemeList || [];
  const [metricId, setMetricId] = useState('investment');
  const [chartType, setChartType] = useState('bar');
  const metric = METRICS.find((item) => item.id === metricId) || METRICS[0];
  const canUseDoughnut = metricId === 'investment';
  const selected = selectedSchemes || [];
  const selectedSchemeRows = schemes.filter((scheme) =>
    selected.length === 0 || selected.includes(scheme.schemeName)
  );

  const dataRows = selectedSchemeRows.map((scheme) => {
    const returnValue = isFiniteNumber(scheme.returnPercentage)
      ? Number(scheme.returnPercentage)
      : hasReliableReturns && isFiniteNumber(scheme.currentValue) &&
        isFiniteNumber(scheme.totalInvested) && Number(scheme.totalInvested) > 0
        ? ((Number(scheme.currentValue) - Number(scheme.totalInvested)) / Number(scheme.totalInvested)) * 100
        : null;
    const value = metricId === 'returnPercentage' ? returnValue : scheme[metric.field];
    const eligible = isFiniteNumber(value) &&
      (metricId !== 'profitLoss' || (
        hasReliableReturns && isFiniteNumber(scheme.totalInvested) && Number(scheme.totalInvested) > 0
      ));
    return { ...scheme, chartValue: eligible ? Number(value) : null };
  }).filter((scheme) => scheme.chartValue !== null);

  const chartRows = metric.comparison
    ? dataRows.filter((scheme) => isFiniteNumber(scheme.totalInvestment) && isFiniteNumber(scheme.currentValue))
    : dataRows;
  const displayRows = chartType === 'doughnut'
    ? chartRows.filter((scheme) => scheme.chartValue > 0)
    : chartRows;
  const labels = displayRows.map((scheme) => scheme.schemeName);
  const datasets = metric.comparison
    ? [
      {
        label: 'Investment',
        data: displayRows.map((scheme) => Number(scheme.totalInvestment)),
        backgroundColor: '#6366f1',
        borderRadius: 5,
      },
      {
        label: 'Current Value',
        data: displayRows.map((scheme) => Number(scheme.currentValue)),
        backgroundColor: '#06b6d4',
        borderRadius: 5,
      },
    ]
    : [{
      label: metric.label,
      data: displayRows.map((scheme) => scheme.chartValue),
      backgroundColor: metricId === 'profitLoss'
        ? displayRows.map((scheme) => scheme.chartValue >= 0 ? '#10b981' : '#ef4444')
        : displayRows.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
      borderRadius: chartType === 'bar' ? 5 : 0,
    }];

  const chartData = { labels, datasets };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event, elements) => {
      if (elements.length > 0) onSchemeSelect?.(labels[elements[0].index]);
    },
    plugins: {
      legend: { display: metric.comparison || chartType === 'doughnut', position: 'bottom' },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (item) => `${item.dataset.label}: ${formatValue(item.raw, metric)}`,
        },
      },
    },
    scales: chartType === 'bar' ? {
      x: {
        ticks: { color: '#94a3b8', maxRotation: 40, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        beginAtZero: metricId !== 'profitLoss',
        ticks: {
          color: '#94a3b8',
          callback: (value) => metric.currency
            ? `₹${Number(value).toLocaleString('en-IN')}`
            : metric.percent ? `${value}%` : Number(value).toLocaleString('en-IN'),
        },
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
      },
    } : undefined,
  };

  const emptyMessage = metricId === 'returnPercentage'
    ? 'Not available: no source-provided return percentage or sufficient invested-cost and current-valuation data were found.'
    : metricId === 'profitLoss'
      ? 'Not available: reliable invested-cost and current-valuation data are required to show profit or loss.'
    : metric.comparison
      ? 'Not available: both investment and current-value amounts are required for this comparison.'
      : `Not available: no ${metric.label.toLowerCase()} values were found in the selected records.`;
  const noChartValues = chartType === 'doughnut' && chartRows.length > 0 && displayRows.length === 0
    ? 'Not available: portfolio allocation requires a positive total investment amount.'
    : emptyMessage;

  return (
    <section className="chart-box scheme-analysis-chart" aria-labelledby="scheme-chart-title">
      <div className="chart-header-row">
        <div>
          <h2 className="chart-main-title" id="scheme-chart-title">Scheme Analysis Graphs</h2>
          <p className="chart-sub-title">Interactive charts use the same date, search, and scheme filters as the table.</p>
        </div>
        <div className="scheme-chart-controls">
          <label>
            <span>Metric</span>
            <select value={metricId} onChange={(event) => {
              setMetricId(event.target.value);
              if (event.target.value !== 'investment') setChartType('bar');
            }}>
              {METRICS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Chart type</span>
            <select value={chartType} disabled={!canUseDoughnut} onChange={(event) => setChartType(event.target.value)}>
              <option value="bar">Bar</option>
              <option value="doughnut">Portfolio allocation</option>
            </select>
          </label>
          <label>
            <span>Compare schemes</span>
            <select
              multiple
              value={selected}
              onChange={(event) => onSelectedSchemesChange(
                Array.from(event.target.selectedOptions, (option) => option.value)
              )}
              aria-label="Filter chart and table by one or more schemes"
            >
              {schemes.map((scheme) => (
                <option key={scheme.schemeName} value={scheme.schemeName}>{scheme.schemeName}</option>
              ))}
            </select>
          </label>
          {selected.length > 0 && (
            <button className="btn-secondary" type="button" onClick={() => onSelectedSchemesChange([])}>
              All schemes
            </button>
          )}
        </div>
      </div>

      {displayRows.length === 0 ? (
        <div className="chart-empty-state" role="status">{noChartValues}</div>
      ) : (
        <>
          {displayRows.length < selectedSchemeRows.length && (
            <p className="chart-sub-title" role="status">
              Not available for {selectedSchemeRows.length - displayRows.length} scheme(s) because the required source values are missing or zero.
            </p>
          )}
          <div className="scheme-chart-canvas" role="img" aria-label={`${metric.label} chart for ${displayRows.length} schemes`}>
            {chartType === 'doughnut' && canUseDoughnut
              ? <Doughnut data={chartData} options={{ ...chartOptions, scales: undefined }} />
              : <Bar data={chartData} options={chartOptions} />}
          </div>
          <details className="scheme-chart-data">
            <summary>View chart values as text</summary>
            <ul>
              {displayRows.map((scheme) => (
                <li key={scheme.schemeName}>
                  {scheme.schemeName}: {metric.comparison
                    ? `Investment ${formatValue(scheme.totalInvestment, metric)}; Current Value ${formatValue(scheme.currentValue, metric)}`
                    : formatValue(scheme.chartValue, metric)}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
};
