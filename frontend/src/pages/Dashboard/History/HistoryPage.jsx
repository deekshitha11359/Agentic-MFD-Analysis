import { useEffect, useState } from 'react';
import { Icon } from '../../../components/common/Icons';
import { getDocuments } from '../../../services/api';

export const HistoryPage = ({ onNavigate, onOpenReport, isDemoMode = false, demoReports = [] }) => {
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        if (active) setErrorMessage(`Analysis history could not be loaded: ${error.message}`);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [demoReports, isDemoMode]);

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Analysis History</h1>
          <p className="overview-subtitle">
            {isDemoMode
              ? 'Illustrative sample reports for this browser-only demo. They are not saved to an account.'
              : 'Saved reports for your account. Open a report to review its extracted analysis.'}
          </p>
        </div>
        <button className="header-action-btn" type="button" onClick={() => onNavigate('upload')}>
          <Icon name="upload" size={15} color="#fff" />
          <span>Upload Document</span>
        </button>
      </div>

      {errorMessage && (
        <div className="badge badge-danger" role="alert" style={{ padding: '12px 16px', width: '100%', justifyContent: 'flex-start' }}>
          <Icon name="alert" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="mfd-card" aria-label="Saved analysis reports">
        {!isDemoMode && isLoading ? (
          <p className="overview-subtitle" role="status">Loading saved reports…</p>
        ) : documents.length === 0 ? (
          <div className="chart-empty-state">
            <p>No analyzed documents are saved to this account yet.</p>
            <button className="btn-secondary" type="button" onClick={() => onNavigate('upload')}>
              Analyze a document
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="mfd-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Detected source</th>
                  <th>Saved</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.fileName}</td>
                    <td>{document.source || 'Not identified'}</td>
                    <td>{document.createdAt ? new Date(document.createdAt).toLocaleString() : 'Not available'}</td>
                    <td>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => onOpenReport(document.id)}
                      >
                        Open report
                      </button>
                    </td>
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
