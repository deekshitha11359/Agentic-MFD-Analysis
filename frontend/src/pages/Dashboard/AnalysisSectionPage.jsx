import { useMemo } from 'react';
import { Icon } from '../../components/common/Icons';

const SECTIONS = {
  trends: {
    title: 'Brokerage Trends & Growth',
    description: 'Monthly brokerage totals grouped from dated records in the active document.',
    columns: ['Period', 'Records', 'Brokerage'],
  },
  amc: {
    title: 'AMC Performance Analysis',
    description: 'Investment and brokerage totals grouped by the AMC codes present in the document.',
    columns: ['AMC code', 'Schemes', 'Investment', 'Brokerage'],
  },
  gst: {
    title: 'GST & Tax Analysis',
    description: 'Tax values and labels exactly as reported in the uploaded records.',
    columns: ['Scheme', 'Folio', 'GST information', 'TDS information'],
  },
  audit: {
    title: 'Brokerage Audit & Data Quality',
    description: 'Presence checks for commonly used brokerage and transaction fields.',
    columns: ['Field', 'Records populated', 'Records missing'],
  },
  accrual: {
    title: 'Accrual & Payment Tracking',
    description: 'Recorded commission components. Payment status is shown only when present in the source.',
    columns: ['Scheme', 'AM commission', 'CAM commission', 'MAM commission', 'Payment status'],
  },
  percentage: {
    title: 'Percentage Comparison Reports',
    description: 'Brokerage rates captured in source records; no rate is inferred when units are unclear.',
    columns: ['Scheme', 'Brokerage rate', 'AM rate', 'CAM rate', 'MAM rate'],
  },
};

const currency = (value) => Number.isFinite(Number(value))
  ? `₹${Number(value).toLocaleString('en-IN')}`
  : 'Not available';

const available = (value) => value !== null && value !== undefined && String(value).trim() !== ''
  ? value
  : 'Not available';

function rowsForSection(section, report) {
  const records = report.normalizedRecords || [];

  if (section === 'trends') {
    const groups = new Map();
    records.forEach((record) => {
      const date = new Date(record.transactionDate);
      if (!record.transactionDate || Number.isNaN(date.getTime()) || record.brokerageAmount == null) return;
      const month = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
      const group = groups.get(month) || { label: month, count: 0, brokerage: 0 };
      group.count += 1;
      group.brokerage += Number(record.brokerageAmount) || 0;
      groups.set(month, group);
    });
    return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  if (section === 'amc') {
    const groups = new Map();
    records.forEach((record) => {
      if (!record.amcCode) return;
      const group = groups.get(record.amcCode) || { label: record.amcCode, schemes: new Set(), investment: 0, brokerage: 0 };
      if (record.schemeName) group.schemes.add(record.schemeName);
      if (record.investmentAmount != null) group.investment += Number(record.investmentAmount) || 0;
      if (record.brokerageAmount != null) group.brokerage += Number(record.brokerageAmount) || 0;
      groups.set(record.amcCode, group);
    });
    return [...groups.values()].map((group) => ({ ...group, schemes: group.schemes.size }));
  }

  if (section === 'gst') {
    return records
      .filter((record) => record.gstInformation != null || record.gstAmount != null || record.tdsAmount != null || record.tdsDeducted != null)
      .map((record) => ({
        scheme: record.schemeName,
        folio: record.folioNumber,
        gst: record.gstInformation ?? (record.gstAmount == null ? null : currency(record.gstAmount)),
        tds: record.tdsInformation ?? (record.tdsAmount ?? record.tdsDeducted),
      }));
  }

  if (section === 'audit') {
    const fields = [
      ['Investment amount', 'investmentAmount'],
      ['Units', 'units'],
      ['Transaction date', 'transactionDate'],
      ['Brokerage amount', 'brokerageAmount'],
      ['Brokerage rate', 'brokerageRate'],
      ['Average assets', 'averageAssets'],
      ['AMC code', 'amcCode'],
      ['Folio number', 'folioNumber'],
      ['Current value', 'currentValue'],
    ];
    return fields.map(([label, field]) => {
      const populated = records.filter((record) => record[field] !== null && record[field] !== undefined && record[field] !== '').length;
      return { label, populated, missing: records.length - populated };
    });
  }

  if (section === 'accrual') {
    return records.map((record) => ({
      scheme: record.schemeName,
      am: record.amComm,
      cam: record.camComm,
      mam: record.mamComm,
      paymentStatus: record.paymentStatus,
    }));
  }

  return records
    .filter((record) => record.brokerageRate != null || record.amRate != null || record.camRate != null || record.mamRate != null)
    .map((record) => ({
      scheme: record.schemeName,
      brokerageRate: record.brokerageRate,
      amRate: record.amRate,
      camRate: record.camRate,
      mamRate: record.mamRate,
    }));
}

export const AnalysisSectionPage = ({ section, report, onNavigate }) => {
  const config = SECTIONS[section];
  const rows = useMemo(() => (report && config ? rowsForSection(section, report) : []), [section, report, config]);

  if (!config) return null;

  if (!report) {
    return (
      <div className="overview-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1>{config.title}</h1>
        <p className="overview-subtitle">Upload a brokerage document to view analysis based on its records.</p>
        <button className="btn-login-submit" style={{ marginTop: '16px' }} onClick={() => onNavigate('upload')}>
          <Icon name="upload" size={16} color="#fff" />
          <span>Upload Document</span>
        </button>
        {section === 'amc' && (
          <button className="btn-secondary" style={{ margin: '16px 0 0 8px' }} onClick={() => onNavigate('comparison')}>
            Compare saved reports
          </button>
        )}
      </div>
    );
  }

  const emptyMessage = section === 'trends'
    ? 'Monthly trends require transaction dates and brokerage amounts in the uploaded document.'
    : section === 'amc'
      ? 'No AMC codes were found in the uploaded document.'
      : section === 'gst'
        ? 'No GST or TDS fields were found in the uploaded document.'
        : section === 'accrual'
          ? 'No commission component records are available.'
          : section === 'percentage'
            ? 'No brokerage or component rate fields were found.'
            : 'No records are available for quality checks.';

  const cellValue = (row, columnIndex) => {
    if (section === 'trends') {
      return [row.label, row.count, currency(row.brokerage)][columnIndex];
    }
    if (section === 'amc') {
      return [row.label, row.schemes, currency(row.investment), currency(row.brokerage)][columnIndex];
    }
    if (section === 'gst') {
      return [available(row.scheme), available(row.folio), available(row.gst), available(row.tds)][columnIndex];
    }
    if (section === 'audit') {
      return [row.label, row.populated, row.missing][columnIndex];
    }
    if (section === 'accrual') {
      return [available(row.scheme), currency(row.am), currency(row.cam), currency(row.mam), available(row.paymentStatus)][columnIndex];
    }
    return [available(row.scheme), available(row.brokerageRate), available(row.amRate), available(row.camRate), available(row.mamRate)][columnIndex];
  };

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>{config.title}</h1>
          <p className="overview-subtitle">{config.description} Source: {report.docName}</p>
        </div>
        {section === 'amc' && (
          <div className="overview-actions">
            <button className="btn-secondary" onClick={() => onNavigate('comparison')}>
              Compare saved reports
            </button>
          </div>
        )}
      </div>
      <section className="mfd-card" aria-label={config.title}>
        {rows.length === 0 ? (
          <p className="overview-subtitle">{emptyMessage}</p>
        ) : (
          <div className="table-responsive">
            <table className="mfd-table">
              <thead>
                <tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`${section}-${rowIndex}`}>
                    {config.columns.map((column, columnIndex) => (
                      <td key={column}>{cellValue(row, columnIndex)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
