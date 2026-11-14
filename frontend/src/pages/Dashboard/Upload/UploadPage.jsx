import { useState } from 'react';
import { Icon } from '../../../components/common/Icons';
import { SAMPLE_DOCUMENTS } from '../../../data/sampleDocuments';
import { agentPipeline } from '../../../services/agentPipeline';
import { parseTabularDocument } from '../../../services/documentParser';
import { saveAnalysisReport } from '../../../services/api';

export const UploadPage = ({ onAnalysisComplete, onNavigate, isDemoMode = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [completedReport, setCompletedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const startAnalysis = async (docToProcess) => {
    if (!docToProcess) return;
    setProcessing(true);
    setCompletedReport(null);
    setAgentLogs([]);
    setErrorMessage('');

    try {
      const result = await agentPipeline.processDocument(docToProcess, (stepEntry, allLogs) => {
        setAgentLogs([...allLogs]);
      });
      if (result.success) {
        const savedReport = isDemoMode
          ? result.report
          : await saveAnalysisReport(result.report.docName, result.report);
        setProcessing(false);
        setCompletedReport(savedReport);
        if (onAnalysisComplete) {
          onAnalysisComplete(savedReport);
        }
      } else {
        throw new Error('Document analysis did not complete.');
      }
    } catch (error) {
      setProcessing(false);
      setErrorMessage(error.message || 'Document analysis failed. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const extension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'tsv', 'txt'].includes(extension)) {
      setErrorMessage('This build can analyze CSV, TSV, and delimited TXT files in the browser. PDF, image, and Excel extraction require a configured document-processing backend.');
      e.target.value = '';
      return;
    }
    if (file.size === 0 || file.size > 50 * 1024 * 1024) {
      setErrorMessage(file.size === 0 ? 'The selected file is empty.' : 'The selected file exceeds the 50 MB upload limit.');
      e.target.value = '';
      return;
    }

    try {
      const document = parseTabularDocument(file.name, await file.text());
      setSelectedSample(null);
      e.target.value = '';
      startAnalysis(document);
    } catch (error) {
      setErrorMessage(error.message || 'The file could not be parsed.');
      e.target.value = '';
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!completedReport) return;
    const csvRows = [
      ["Scheme Name", "AMC Code", "Invested Amount", "Units", "Current Value", "Brokerage Amount"],
      ...completedReport.schemeList.map(s => [s.schemeName, s.amcCode, s.totalInvestment, s.totalUnits, s.currentValue, s.brokerageAmount])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${completedReport.docName.replace(/\.[^/.]+$/, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Upload & Analyze Brokerage PDF Documents</h1>
          <p className="overview-subtitle">
            Analyze the records in a CSV, TSV, or delimited TXT statement. Unsupported document extraction is reported explicitly.
          </p>
        </div>
      </div>

      {isDemoMode && (
        <div className="badge badge-warning" role="status" style={{ padding: '12px 16px', width: '100%', justifyContent: 'flex-start' }}>
          Demo mode: uploaded files are analyzed locally in this browser and are not saved to an account or backend.
        </div>
      )}

      {errorMessage && (
        <div className="badge badge-danger" role="alert" style={{ padding: '12px 16px', width: '100%', justifyContent: 'flex-start' }}>
          <Icon name="alert" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ANALYSIS COMPLETE & DOWNLOAD REPORT PANEL */}
      {completedReport && !processing && (
        <div className="mfd-card" style={{ border: '2px solid var(--success)', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="metric-icon-wrap icon-emerald" style={{ width: '42px', height: '42px' }}>
                <Icon name="check" size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {completedReport.docName} Analyzed Successfully!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  10 Agents completed execution • {completedReport.summary.totalRecords} Records • {completedReport.summary.schemesCount} Schemes • {completedReport.summary.totalBrokerage == null ? 'Brokerage not available' : `₹${completedReport.summary.totalBrokerage.toLocaleString('en-IN')} Brokerage`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleDownloadCSV}>
                <Icon name="fileSpreadsheet" size={15} />
                <span>Download CSV</span>
              </button>

              <button className="btn-login-submit" style={{ padding: '9px 16px', fontSize: '13px' }} onClick={handleDownloadPDF}>
                <Icon name="download" size={15} color="#fff" />
                <span>Download / Print PDF Report</span>
              </button>

              <button className="btn-secondary" onClick={() => onNavigate('reports')}>
                <Icon name="reports" size={15} />
                <span>View 10-Section Report</span>
              </button>

              <button className="header-action-btn" onClick={() => onNavigate('dashboard')}>
                <Icon name="dashboard" size={15} color="#fff" />
                <span>Open Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESSING TELEMETRY STREAM */}
      {processing ? (
        <div className="mfd-card" style={{ padding: '36px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="metric-icon-wrap icon-purple" style={{ width: '56px', height: '56px', margin: '0 auto 16px' }}>
              <Icon name="bot" size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>
              Analyzing Uploaded Document...
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Analysis steps are using the extracted rows and source fields from this document.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '20px', maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border-subtle)' }}>
            {agentLogs.map((log, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', fontSize: '13px' }}>
                <span className={`badge ${log.status === 'COMPLETED' ? 'badge-success' : log.status === 'WARNING' ? 'badge-warning' : 'badge-primary'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                  {log.status}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{log.agent}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{log.detail}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main Dropzone */}
          <div
            className="mfd-card"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) {
                handleFileUpload({ target: { files: e.dataTransfer.files } });
              }
            }}
            style={{
              border: dragOver ? '2px dashed var(--primary)' : '2px dashed var(--border-subtle)',
              background: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
              textAlign: 'center',
              padding: '48px 24px',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('file-input-browser').click()}
          >
            <input
              id="file-input-browser"
              type="file"
              style={{ display: 'none' }}
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
            />

            <div style={{ maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div className="metric-icon-wrap icon-blue" style={{ width: '60px', height: '60px' }}>
                <Icon name="upload" size={28} />
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Upload a CSV, TSV, or Delimited TXT Statement
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Drag & drop or browse a tabular brokerage or transaction statement
                </p>
              </div>

              <button className="btn-login-submit" style={{ padding: '10px 20px', fontSize: '13px' }}>
                <Icon name="fileSpreadsheet" size={16} color="#fff" />
                <span>Browse File from Computer</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Document Loaders */}
          <div className="mfd-card">
            <div className="chart-card-header">
              <div>
                <h2 className="chart-card-title">
                  <Icon name="shield" size={18} color="var(--primary-light)" />
                  Demo Sample Documents
                </h2>
                <p className="overview-subtitle">These clearly labeled demo datasets are examples only and are not used for uploaded-file analysis.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {SAMPLE_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: selectedSample?.id === doc.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                    border: selectedSample?.id === doc.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className="badge badge-primary">{doc.source}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{doc.fileSize}</span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {doc.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {doc.docType} • {doc.summary.totalRecords} records • {doc.hasValuationData ? 'NAV Included' : 'Purchase Only'}
                    </p>
                  </div>

                  <button
                    className="header-action-btn"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                    onClick={() => {
                      setSelectedSample(doc);
                      startAnalysis(doc);
                    }}
                  >
                    <Icon name="zap" size={14} color="#fff" />
                    <span>Analyze & Generate Report</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
