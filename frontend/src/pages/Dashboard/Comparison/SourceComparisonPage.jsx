import { useEffect, useState } from 'react';
import { Icon } from '../../../components/common/Icons';
import { getDocuments, getDocumentReport } from '../../../services/api';

const isFiniteValue = (value) => value !== null && value !== undefined &&
  String(value).trim() !== '' && Number.isFinite(Number(value));

const formatCurrency = (value) => isFiniteValue(value)
  ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  : 'Not available';

const formatCount = (value) => isFiniteValue(value)
  ? Number(value).toLocaleString('en-IN')
  : 'Not available';

const getComparisonRows = () => [
  ['Source / company', (report) => report.source || 'Not identified'],
  ['Document', (report) => report.docName || 'Not available'],
  ['Transactions', (report) => formatCount(report.summary?.totalRecords)],
  ['Schemes', (report) => formatCount(report.summary?.schemesCount)],
  ['Investment', (report) => formatCurrency(report.summary?.totalInvestment)],
  ['Brokerage', (report) => formatCurrency(report.summary?.totalBrokerage)],
  ['Average brokerage rate', (report) => report.summary?.avgBrokerageRate || 'Not available'],
  ['Average assets analyzed', (report) => formatCurrency(report.summary?.totalAssetsAnalyzed)],
  ['Absolute return', (report) => report.returnAnalysis?.hasSufficientData === true &&
    isFiniteValue(report.returnAnalysis.absoluteReturn)
    ? `${Number(report.returnAnalysis.absoluteReturn).toFixed(2)}%`
    : 'Not available'],
];

export const SourceComparisonPage = ({ onNavigate, isDemoMode = false, demoReports = [] }) => {
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparedReports, setComparedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const documents = isDemoMode
    ? demoReports.map((report) => ({
      id: report.docId,
      fileName: report.docName,
      source: report.source,
      createdAt: report.processedAt,
    }))
    : savedDocuments;

  useEffect(() => {
    if (isDemoMode) return undefined;

    let active = true;
    getDocuments()
      .then((items) => {
        if (active) setSavedDocuments(items);
      })
      .catch((error) => {
        if (active) setErrorMessage(`Saved reports could not be loaded: ${error.message}`);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [demoReports, isDemoMode]);

  const toggleDocument = (documentId) => {
    setSelectedIds((current) => current.includes(documentId)
      ? current.filter((id) => id !== documentId)
      : [...current, documentId]);
    setComparedReports([]);
    setErrorMessage('');
  };

  const compareSelected = async () => {
    if (selectedIds.length < 2) return;
    setIsComparing(true);
    setComparedReports([]);
    setErrorMessage('');
    try {
      const reports = isDemoMode
        ? selectedIds.map((id) => demoReports.find((report) => String(report.docId) === id)).filter(Boolean)
        : await Promise.all(selectedIds.map((id) => getDocumentReport(id)));
      setComparedReports(reports);
    } catch (error) {
      setErrorMessage(`Selected reports could not be compared: ${error.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Source & Document Comparison</h1>
          <p className="overview-subtitle">
            {isDemoMode
              ? 'Compare illustrative sample reports. Sample rows are for interface preview only, not real portfolio data.'
              : 'Compare extracted metrics from reports saved to your account. Rates and returns are shown only as recorded or calculated from each report.'}
          </p>
        </div>
        <div className="overview-actions">
          <button className="btn-secondary" type="button" onClick={() => onNavigate('amc')}>
            Back to AMC Analysis
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="badge badge-danger" role="alert" style={{ padding: '12px 16px', width: '100%', justifyContent: 'flex-start' }}>
          <Icon name="alert" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="mfd-card" aria-labelledby="source-report-selection">
        <div className="chart-card-header">
          <div>
            <h2 className="chart-card-title" id="source-report-selection">Choose saved reports</h2>
            <p className="overview-subtitle">
              {isDemoMode
                ? 'Select at least two sample reports. These illustrative examples are not financial records.'
                : 'Select at least two reports. Only reports belonging to your signed-in account are listed.'}
            </p>
          </div>
          <button
            className="header-action-btn"
            type="button"
            onClick={compareSelected}
            disabled={selectedIds.length < 2 || isComparing}
          >
            {isComparing ? 'Comparing…' : 'Compare selected'}
          </button>
        </div>

        {!isDemoMode && isLoading ? (
          <p className="overview-subtitle" role="status">Loading your saved reports…</p>
        ) : documents.length === 0 ? (
          <div className="chart-empty-state">
            <p>No analyzed reports are saved to this account yet.</p>
            <button className="btn-secondary" type="button" onClick={() => onNavigate('upload')}>
              Upload a document
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="mfd-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Source</th>
                  <th>Document</th>
                  <th>Analyzed</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(String(document.id))}
                        onChange={() => toggleDocument(String(document.id))}
                        aria-label={`Select ${document.fileName} for comparison`}
                      />
                    </td>
                    <td>{document.source || 'Not identified'}</td>
                    <td>{document.fileName}</td>
                    <td>{document.createdAt ? new Date(document.createdAt).toLocaleString() : 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {comparedReports.length > 0 && (
        <section className="mfd-card" aria-labelledby="source-comparison-results">
          <h2 className="chart-card-title" id="source-comparison-results">Extracted metrics comparison</h2>
          <div className="table-responsive">
            <table className="mfd-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {comparedReports.map((report, index) => (
                    <th key={`${report.docId || report.docName}-${index}`}>
                      {report.source || 'Source not identified'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getComparisonRows().map(([label, valueFor]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {comparedReports.map((report, index) => (
                      <td key={`${label}-${report.docId || report.docName}-${index}`}>{valueFor(report)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="overview-subtitle" style={{ marginTop: '12px' }}>
            Return values are not compared when a report lacks reliable valuation data. This comparison does not imply that one source or investment performed better.
          </p>
        </section>
      )}
    </div>
  );
};
