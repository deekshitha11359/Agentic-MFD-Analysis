import { lazy, Suspense, useState } from 'react';
import { Icon } from '../../../components/common/Icons';

const SchemeAnalysisCharts = lazy(() => import('../../../components/common/dashboard/charts/SchemeAnalysisCharts')
  .then((module) => ({ default: module.SchemeAnalysisCharts })));

const parseTransactionDate = (value) => {
  const text = String(value || '').trim();
  const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  const localDate = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  const parts = isoDate
    ? [Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3])]
    : localDate
      ? [Number(localDate[3]), Number(localDate[2]), Number(localDate[1])]
      : null;
  if (!parts) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
};

const aggregateSchemeRows = (records) => {
  const groups = new Map();
  const numericFields = {
    investmentAmount: 'totalInvestment',
    units: 'totalUnits',
    currentValue: 'currentValue',
    investedTotal: 'totalInvested',
    brokerageAmount: 'brokerageAmount',
  };

  records.forEach((record) => {
    const name = record.schemeName || 'Scheme not identified';
    if (!groups.has(name)) {
      groups.set(name, {
        schemeName: name,
        amcCode: record.amcCode || null,
        category: record.category || null,
        recordsCount: 0,
        totals: Object.fromEntries(Object.values(numericFields).map((field) => [field, 0])),
        complete: Object.fromEntries(Object.values(numericFields).map((field) => [field, true])),
        returnPercentages: new Set(),
        returnPercentageComplete: true,
      });
    }
    const group = groups.get(name);
    group.recordsCount += 1;
    if (!group.amcCode && record.amcCode) group.amcCode = record.amcCode;
    if (!group.category && record.category) group.category = record.category;
    Object.entries(numericFields).forEach(([sourceField, outputField]) => {
      const value = record[sourceField];
      if (value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value))) {
        group.totals[outputField] += Number(value);
      } else {
        group.complete[outputField] = false;
      }
    });
    if (record.returnPercentage !== null && record.returnPercentage !== undefined &&
      String(record.returnPercentage).trim() !== '' && Number.isFinite(Number(record.returnPercentage))) {
      group.returnPercentages.add(Number(record.returnPercentage));
    } else {
      group.returnPercentageComplete = false;
    }
  });

  return [...groups.values()].map((group) => ({
    schemeName: group.schemeName,
    amcCode: group.amcCode,
    category: group.category,
    recordsCount: group.recordsCount,
    ...Object.fromEntries(Object.keys(group.totals).map((field) => [
      field,
      group.complete[field] ? group.totals[field] : null,
    ])),
    returnPercentage: group.returnPercentageComplete && group.returnPercentages.size === 1
      ? [...group.returnPercentages][0]
      : null,
  }));
};

const attachSourceReturnPercentages = (schemes, records) => {
  const sourceReturns = new Map();
  records.forEach((record) => {
    const name = record.schemeName || 'Scheme not identified';
    const entry = sourceReturns.get(name) || { values: new Set(), complete: true };
    if (record.returnPercentage !== null && record.returnPercentage !== undefined &&
      String(record.returnPercentage).trim() !== '' && Number.isFinite(Number(record.returnPercentage))) {
      entry.values.add(Number(record.returnPercentage));
    } else {
      entry.complete = false;
    }
    sourceReturns.set(name, entry);
  });
  return schemes.map((scheme) => {
    const entry = sourceReturns.get(scheme.schemeName);
    return {
      ...scheme,
      returnPercentage: entry?.complete && entry.values.size === 1 ? [...entry.values][0] : null,
    };
  });
};

export const AssetsPage = ({ report, onNavigate }) => {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchemes, setSelectedSchemes] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!report) {
    return (
      <div className="overview-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Please Upload a Brokerage Document First</h2>
        <button className="btn-login-submit" style={{ marginTop: '16px' }} onClick={() => onNavigate('upload')}>
          Upload Statement
        </button>
      </div>
    );
  }

  const records = report.normalizedRecords || [];
  const datedRecords = records
    .map((record) => ({ record, date: parseTransactionDate(record.transactionDate) }))
    .filter(({ date }) => date !== null);
  const dateRangeAvailable = datedRecords.length > 0;
  const hasDateFilter = Boolean(startDate || endDate);
  const dateFilteredRecords = hasDateFilter
    ? datedRecords
      .filter(({ date }) => (!startDate || date >= startDate) && (!endDate || date <= endDate))
      .map(({ record }) => record)
    : records;
  const baseSchemes = hasDateFilter
    ? aggregateSchemeRows(dateFilteredRecords)
    : attachSourceReturnPercentages(report.schemeList, records);
  const searchedSchemes = baseSchemes.filter((scheme) =>
    (scheme.schemeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scheme.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSchemes = searchedSchemes.filter((scheme) =>
    selectedSchemes.length === 0 || selectedSchemes.includes(scheme.schemeName)
  );
  const formatCurrency = (value) => value === null || value === undefined
    ? 'Not available'
    : `₹${Number(value).toLocaleString('en-IN')}`;
  const formatNumber = (value) => value === null || value === undefined
    ? 'Not available'
    : Number(value).toLocaleString('en-IN');

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Asset & Mutual Fund Scheme Analysis</h1>
          <p className="overview-subtitle">
            Scheme-level holdings, units, valuation, deterministic profit/loss, and brokerage
          </p>
        </div>

        <div style={{ width: '280px' }} className="global-search-box">
          <Icon name="search" size={14} color="var(--text-muted)" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search schemes or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {dateRangeAvailable && (
        <div className="asset-date-filter" aria-label="Filter scheme analysis by transaction date">
          <label>
            <span>From</span>
            <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          {hasDateFilter && (
            <button className="btn-secondary" type="button" onClick={() => {
              setStartDate('');
              setEndDate('');
            }}>
              Clear date range
            </button>
          )}
        </div>
      )}

      <Suspense fallback={<div className="chart-empty-state" role="status">Loading scheme analysis charts...</div>}>
        <SchemeAnalysisCharts
          schemeList={searchedSchemes}
          selectedSchemes={selectedSchemes}
          onSelectedSchemesChange={setSelectedSchemes}
          onSchemeSelect={(schemeName) => setSelectedSchemes((current) =>
            current.length === 1 && current[0] === schemeName ? [] : [schemeName]
          )}
          hasReliableReturns={report.returnAnalysis?.hasSufficientData === true}
        />
      </Suspense>

      <div className="mfd-card">
        <div className="table-responsive">
          <table className="mfd-table">
            <thead>
              <tr>
                <th>Scheme Name & AMC</th>
                <th>Category</th>
                <th>Invested Amount</th>
                <th>Units Allotted</th>
                <th>Current Value</th>
                <th>Profit / Loss</th>
                <th>Return %</th>
                <th>Brokerage Generated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No schemes match the selected filters.
                  </td>
                </tr>
              )}
              {filteredSchemes.map((s) => {
                const hasVal = s.currentValue !== null && s.currentValue !== undefined;
                const selectedReturnValuesAvailable = s.totalInvested !== null && s.totalInvested !== undefined && s.totalInvested > 0;
                const profit = hasVal && selectedReturnValuesAvailable ? s.currentValue - s.totalInvested : null;
                const calculatedReturn = profit !== null ? (profit / s.totalInvested) * 100 : null;
                const retPct = s.returnPercentage !== null && s.returnPercentage !== undefined
                  ? Number(s.returnPercentage).toFixed(2)
                  : report.returnAnalysis.hasSufficientData && calculatedReturn !== null
                    ? calculatedReturn.toFixed(2)
                    : null;

                return (
                  <tr key={s.schemeName}>
                    <td>
                      <div className="scheme-name-cell">
                        <span className="scheme-title">{s.schemeName}</span>
                        <span className="scheme-category-tag">{s.amcCode || 'AMC not identified'}</span>
                      </div>
                    </td>
                    <td>{s.category ? <span className="badge badge-primary">{s.category}</span> : <span style={{ color: 'var(--text-muted)' }}>Not available</span>}</td>
                    <td><strong>{formatCurrency(s.totalInvestment)}</strong></td>
                    <td>{formatNumber(s.totalUnits)}</td>
                    <td>{hasVal ? formatCurrency(s.currentValue) : <span style={{ color: 'var(--text-muted)' }}>Not available</span>}</td>
                    <td>
                      {hasVal && report.returnAnalysis.hasSufficientData && selectedReturnValuesAvailable ? (
                        <span style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not available</span>
                      )}
                    </td>
                    <td>
                      {retPct !== null ? (
                        <span className="badge badge-success">{retPct}%</span>
                      ) : (
                        <span className="badge badge-warning" title="Invested-total and current-value data are required for a reliable calculation">Not available</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: '700' }}>
                      {formatCurrency(s.brokerageAmount)}
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => setSelectedScheme(s)}
                      >
                        Deep Dive
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Deep Dive Modal */}
      {selectedScheme && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="mfd-card" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                {selectedScheme.category && <span className="badge badge-primary">{selectedScheme.category}</span>}
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>{selectedScheme.schemeName}</h3>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedScheme(null)}>✕ Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Invested</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatCurrency(selectedScheme.totalInvestment)}</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Units Held</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{formatNumber(selectedScheme.totalUnits)}</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Brokerage Accrued</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(selectedScheme.brokerageAmount)}</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction Count</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{selectedScheme.recordsCount} Records</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Source:</strong> Values shown here come from {report.docName}. Additional classification or payment details are shown only when included in the source.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
