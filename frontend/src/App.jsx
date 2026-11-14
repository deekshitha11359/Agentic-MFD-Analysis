import { useEffect, useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/Login/LoginPage';
import { LandingPage } from './pages/Landing/LandingPage';
import { UploadPage } from './pages/Dashboard/Upload/UploadPage';
import { Overview } from './pages/Dashboard/Overview';
import { BrokeragePage } from './pages/Dashboard/Brokerage/BrokeragePage';
import { AssetsPage } from './pages/Dashboard/Assests/AssetsPage';
import { InsightsPage } from './pages/Dashboard/Insights/InsightsPage';
import { ReportsPage } from './pages/Dashboard/Reports/ReportsPage';
import { ChatbotPage } from './pages/Dashboard/Chatbot/ChatbotPage';
import { SettingsPage } from './pages/Dashboard/Settings/SettingsPage';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { agentPipeline } from './services/agentPipeline';
import { AnalysisSectionPage } from './pages/Dashboard/AnalysisSectionPage';
import { EmailImportPage } from './pages/Dashboard/EmailImportPage';
import { SourceComparisonPage } from './pages/Dashboard/Comparison/SourceComparisonPage';
import { HistoryPage } from './pages/Dashboard/History/HistoryPage';
import { clearAuthToken, getAuthToken, getCurrentProfile, getDocumentReport, getLatestDocument, saveAnalysisReport } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(() => Boolean(getAuthToken()));
  const [activeTab, setActiveTab] = useState(() =>
    new URLSearchParams(window.location.search).has('emailConnection') ? 'email' : 'dashboard'
  );
  const [currentProfile, setCurrentProfile] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReports, setDemoReports] = useState([]);
  const [appError, setAppError] = useState('');

  useEffect(() => {
    if (!getAuthToken()) {
      return undefined;
    }

    let mounted = true;
    getCurrentProfile()
      .then((profile) => {
        if (!mounted) return;
        setCurrentProfile(profile);
        setIsAuthenticated(true);
        return getLatestDocument()
          .then((report) => {
            if (mounted) setActiveReport(report);
          })
          .catch((error) => {
            if (mounted) setAppError(`Your account is signed in, but its latest report could not be loaded: ${error.message}`);
          });
      })
      .catch((error) => {
        if (!mounted) return;
        clearAuthToken();
        setAppError(`Your saved sign-in could not be restored: ${error.message}`);
      })
      .finally(() => {
        if (mounted) setIsSessionLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthSuccess = (authResponse) => {
    setCurrentProfile(authResponse.profile);
    setActiveReport(null);
    setIsDemoMode(false);
    setDemoReports([]);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    setAppError('');
    getLatestDocument()
      .then(setActiveReport)
      .catch((error) => setAppError(`Signed in, but the latest report could not be loaded: ${error.message}`));
  };

  const handleLoginSuccess = handleAuthSuccess;
  const handleRegisterSuccess = handleAuthSuccess;

  const handleAnalysisComplete = (report) => {
    setActiveReport(report);
    if (isDemoMode) {
      setDemoReports((current) => [
        report,
        ...current.filter((item) => item.docId !== report.docId),
      ]);
    }
    setActiveTab('dashboard');
    setAppError('');
  };

  const handleOpenHistoricalReport = async (documentId) => {
    if (isDemoMode) {
      const report = demoReports.find((item) => String(item.docId) === String(documentId));
      if (report) {
        setActiveReport(report);
        setActiveTab('dashboard');
        setAppError('');
      } else {
        setAppError('The selected demo report is no longer available.');
      }
      return;
    }
    try {
      const report = await getDocumentReport(documentId);
      setActiveReport(report);
      setActiveTab('dashboard');
      setAppError('');
    } catch (error) {
      setAppError(`The selected report could not be loaded: ${error.message}`);
    }
  };

  const handleDemoLogin = async () => {
    const reports = await Promise.all(
      SAMPLE_DOCUMENTS.map((document) => agentPipeline.processDocument(document))
    );
    const analyzedReports = reports.map((result) => {
      if (!result.success) throw new Error('A sample document could not be analyzed.');
      return result.report;
    });
    const profile = {
      name: 'Demo Distributor',
      arn: 'DEMO-ARN',
      euin: 'DEMO',
      firmName: 'FundLens-AI Demo Workspace',
      email: '',
      tier: 'Demo account',
    };
    setCurrentProfile(profile);
    setActiveReport(analyzedReports[0]);
    setDemoReports(analyzedReports);
    setIsDemoMode(true);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    setAppError('');
  };

  const handleSampleClick = async (docId) => {
    const doc = SAMPLE_DOCUMENTS.find(d => d.id === docId) || SAMPLE_DOCUMENTS[0];
    try {
      const res = await agentPipeline.processDocument(doc);
      if (res.success) {
        const savedReport = isDemoMode
          ? res.report
          : await saveAnalysisReport(res.report.docName, res.report);
        setActiveReport(savedReport);
        if (isDemoMode) {
          setDemoReports((current) => [
            savedReport,
            ...current.filter((item) => item.docId !== savedReport.docId),
          ]);
        }
        setActiveTab('dashboard');
      }
    } catch (error) {
      setAppError(`Sample document analysis could not be saved: ${error.message}`);
    }
  };

  // If not signed in, show the Login / Registration Page
  if (!isAuthenticated) {
    if (isSessionLoading) {
      return <div className="login-container" role="status">Restoring secure sign-in...</div>;
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        onDemoLogin={handleDemoLogin}
        initialError={appError}
      />
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage onGetStarted={() => setActiveTab('upload')} onSampleClick={handleSampleClick} />;
      case 'upload':
        return <UploadPage onAnalysisComplete={handleAnalysisComplete} onNavigate={setActiveTab} isDemoMode={isDemoMode} />;
      case 'dashboard':
        return <Overview report={activeReport} onNavigate={setActiveTab} />;
      case 'trends':
        return <AnalysisSectionPage section="trends" report={activeReport} onNavigate={setActiveTab} />;
      case 'amc':
        return <AnalysisSectionPage section="amc" report={activeReport} onNavigate={setActiveTab} />;
      case 'comparison':
        return <SourceComparisonPage onNavigate={setActiveTab} isDemoMode={isDemoMode} demoReports={demoReports} />;
      case 'history':
        return <HistoryPage onNavigate={setActiveTab} onOpenReport={handleOpenHistoricalReport} isDemoMode={isDemoMode} demoReports={demoReports} />;
      case 'brokerage':
        return <BrokeragePage report={activeReport} onNavigate={setActiveTab} />;
      case 'assets':
        return <AssetsPage report={activeReport} onNavigate={setActiveTab} />;
      case 'gst':
        return <AnalysisSectionPage section="gst" report={activeReport} onNavigate={setActiveTab} />;
      case 'audit':
        return <AnalysisSectionPage section="audit" report={activeReport} onNavigate={setActiveTab} />;
      case 'accrual':
        return <AnalysisSectionPage section="accrual" report={activeReport} onNavigate={setActiveTab} />;
      case 'percentage':
        return <AnalysisSectionPage section="percentage" report={activeReport} onNavigate={setActiveTab} />;
      case 'insights':
        return <InsightsPage report={activeReport} onNavigate={setActiveTab} />;
      case 'reports':
        return <ReportsPage report={activeReport} onNavigate={setActiveTab} />;
      case 'chatbot':
        return <ChatbotPage report={activeReport} onNavigate={setActiveTab} />;
      case 'email':
        return <EmailImportPage onNavigate={setActiveTab} onAnalysisComplete={handleAnalysisComplete} isDemoMode={isDemoMode} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Overview report={activeReport} onNavigate={setActiveTab} />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => {
        clearAuthToken();
        setIsAuthenticated(false);
        setCurrentProfile(null);
        setActiveReport(null);
        setIsDemoMode(false);
        setDemoReports([]);
        setAppError('');
      }}
      profile={currentProfile}
      report={activeReport}
      isDemoMode={isDemoMode}
    >
      {appError && (
        <div className="badge badge-danger" role="alert" style={{ margin: '12px 20px', padding: '10px 14px' }}>
          {appError}
        </div>
      )}
      {renderView()}
    </DashboardLayout>
  );
}

export default App;
