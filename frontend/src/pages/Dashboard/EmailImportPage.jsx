import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/common/Icons';
import './EmailImportPage.css';
import { agentPipeline } from '../../services/agentPipeline';
import { parseTabularDocument } from '../../services/documentParser';
import {
  deleteEmailImport,
  disconnectEmailProvider,
  getEmailConnections,
  getEmailImports,
  importEmailAttachment,
  saveAnalysisReport,
  searchEmailMessages,
  startEmailConnection,
  updateEmailImportStatus,
} from '../../services/api';

const PROVIDERS = [
  { id: 'GMAIL', name: 'Gmail' },
  { id: 'MICROSOFT', name: 'Microsoft 365 / Outlook' },
];

const decodeTextAttachment = (base64) => {
  const binary = window.atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

export const EmailImportPage = ({ onNavigate, onAnalysisComplete, isDemoMode = false }) => {
  const [connections, setConnections] = useState([]);
  const [imports, setImports] = useState([]);
  const [provider, setProvider] = useState('GMAIL');
  const [query, setQuery] = useState('');
  const [after, setAfter] = useState('');
  const [before, setBefore] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const currentConnection = useMemo(
    () => connections.find((connection) => connection.provider === provider),
    [connections, provider]
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    if (isDemoMode) {
      setConnections(PROVIDERS.map((item) => ({
        provider: item.id,
        connected: false,
        configured: false,
        setupMessage: 'Email connection requires a configured backend and OAuth provider credentials.',
      })));
      setImports([]);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      const status = await getEmailConnections();
      setConnections(status);
      setProvider((currentProvider) => {
        if (status.some((item) => item.provider === currentProvider && item.connected)) return currentProvider;
        return status.find((item) => item.connected)?.provider || currentProvider;
      });
    } catch (error) {
      setErrorMessage(`Email connection status could not be loaded: ${error.message}`);
    }
    try {
      setImports(await getEmailImports());
    } catch (error) {
      setErrorMessage((current) => current
        ? `${current} Import history could not be loaded: ${error.message}`
        : `Import history could not be loaded: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    const callbackResult = new URLSearchParams(window.location.search).get('emailConnection');
    if (callbackResult) {
      setNotice(isDemoMode
        ? 'Email connections are unavailable in demo mode.'
        : callbackResult === 'connected'
          ? 'Email provider connected. Search your mailbox and select only the attachments you want to import.'
          : 'Email connection was not completed. Check the provider setup and try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    refreshData();
  }, [isDemoMode, refreshData]);

  const handleConnect = async (selectedProvider) => {
    setBusyAction(`connect:${selectedProvider}`);
    setErrorMessage('');
    try {
      const response = await startEmailConnection(selectedProvider);
      if (!response.authorizationUrl) throw new Error('The server did not return an authorization URL.');
      window.location.assign(response.authorizationUrl);
    } catch (error) {
      setErrorMessage(`Could not start provider authorization: ${error.message}`);
      setBusyAction('');
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!currentConnection?.connected) {
      setErrorMessage('Connect the selected email provider before searching.');
      return;
    }
    setIsSearching(true);
    setErrorMessage('');
    setNotice('');
    setMessages([]);
    try {
      const found = await searchEmailMessages({ provider, query: query.trim(), after, before });
      setMessages(found);
      if (found.length === 0) setNotice('No matching messages with attachments were found for these search filters.');
    } catch (error) {
      setErrorMessage(`Mailbox search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAttachmentImport = async (message, attachment) => {
    const actionId = `${message.id}:${attachment.id}`;
    setBusyAction(actionId);
    setErrorMessage('');
    setNotice('');
    let importRecord = null;
    try {
      importRecord = await importEmailAttachment({
        provider,
        messageId: message.id,
        attachmentId: attachment.id,
      });
      const document = parseTabularDocument(
        importRecord.fileName,
        decodeTextAttachment(importRecord.contentBase64)
      );
      document.sourceDocument = {
        sourceType: 'EMAIL_ATTACHMENT',
        provider: importRecord.provider,
        messageReference: importRecord.messageId,
        attachmentReference: importRecord.attachmentId,
        attachmentName: importRecord.fileName,
        importedAt: new Date().toISOString(),
      };
      const result = await agentPipeline.processDocument(document);
      if (!result.success) throw new Error('The analysis workflow did not complete.');
      const report = { ...result.report, sourceDocument: document.sourceDocument };
      const savedReport = await saveAnalysisReport(report.docName, report);
      await updateEmailImportStatus(importRecord.importId, 'COMPLETED', savedReport.docId);
      setImports(await getEmailImports());
      setNotice(`${importRecord.fileName} was analyzed and saved to your report history.`);
      onAnalysisComplete?.(savedReport);
    } catch (error) {
      if (importRecord?.importId) {
        try {
          await updateEmailImportStatus(importRecord.importId, 'FAILED');
        } catch (statusError) {
          setErrorMessage(`Attachment import failed: ${error.message} The failure status could not be saved: ${statusError.message}`);
          setBusyAction('');
          return;
        }
        try {
          setImports(await getEmailImports());
        } catch (historyError) {
          setErrorMessage(`Attachment import failed: ${error.message} Import history could not be refreshed: ${historyError.message}`);
          setBusyAction('');
          return;
        }
      }
      setErrorMessage(error.message.includes('already imported')
        ? error.message
        : `Attachment import failed: ${error.message}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleDisconnect = async (selectedProvider) => {
    if (!window.confirm('Disconnect this mailbox from FundLens-AI? Previously imported analysis reports will remain until you delete them.')) return;
    setBusyAction(`disconnect:${selectedProvider}`);
    setErrorMessage('');
    try {
      const result = await disconnectEmailProvider(selectedProvider);
      setMessages([]);
      setConnections(await getEmailConnections());
      setNotice(result.providerConsentRevoked
        ? 'Mailbox disconnected and Google OAuth consent revoked.'
        : 'Mailbox disconnected from this application. Provider consent was not revoked by this action; remove FundLens-AI in your Microsoft account permissions to revoke it.');
    } catch (error) {
      setErrorMessage(`Mailbox could not be disconnected: ${error.message}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteImport = async (importId) => {
    if (!window.confirm('Delete this email import and its saved analysis report?')) return;
    setBusyAction(`delete:${importId}`);
    setErrorMessage('');
    try {
      await deleteEmailImport(importId);
      setImports(await getEmailImports());
      setNotice('The imported attachment metadata and associated analysis report were deleted.');
    } catch (error) {
      setErrorMessage(`Email import could not be deleted: ${error.message}`);
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="overview-container">
      {isDemoMode && (
        <div className="badge badge-warning" role="status" style={{ padding: '12px 16px', width: '100%', justifyContent: 'flex-start' }}>
          Demo mode does not connect mailboxes. Configure the backend and OAuth credentials to test email import; manual upload remains available.
        </div>
      )}
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Import Brokerage Documents from Email</h1>
          <p className="overview-subtitle">
            Connect with provider OAuth, review matching message metadata, then choose individual supported attachments to analyze.
          </p>
        </div>
      </div>

      <div className="badge badge-primary email-privacy-note" role="note">
        <Icon name="shield" size={18} />
        <span>Read-only access. Email passwords are never requested. Message bodies are not displayed or imported; only attachments you select are downloaded. Email content is treated as untrusted input.</span>
      </div>

      {errorMessage && <div className="badge badge-danger email-notice" role="alert">{errorMessage}</div>}
      {notice && <div className="badge badge-success email-notice" role="status">{notice}</div>}

      <section className="mfd-card email-provider-card" aria-labelledby="email-provider-title">
        <div className="email-section-heading">
          <div>
            <h2 id="email-provider-title">Email connections</h2>
            <p className="overview-subtitle">Connect through the provider’s official sign-in and consent page.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={refreshData} disabled={isLoading}>
            Refresh status
          </button>
        </div>
        <div className="email-provider-grid">
          {PROVIDERS.map((item) => {
            const status = connections.find((connection) => connection.provider === item.id);
            return (
              <div className="email-provider-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p className="overview-subtitle">
                    {isLoading ? 'Checking provider setup…'
                      : status?.connected ? `Connected as ${status.emailAddress}`
                        : status?.configured ? 'OAuth ready — connect when you choose'
                          : status?.setupMessage || 'Email provider setup is unavailable.'}
                  </p>
                </div>
                {status?.connected ? (
                  <button className="btn-secondary" type="button" disabled={Boolean(busyAction)}
                    onClick={() => handleDisconnect(item.id)}>
                    {busyAction === `disconnect:${item.id}` ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : (
                  <button className="header-action-btn" type="button"
                    disabled={isLoading || !status?.configured || Boolean(busyAction)}
                    title={!status?.configured ? status?.setupMessage : undefined}
                    onClick={() => handleConnect(item.id)}>
                    {busyAction === `connect:${item.id}` ? 'Opening provider…' : `Connect ${item.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="email-revoke-note">
          Disconnecting removes this app’s stored tokens. To revoke OAuth consent at the provider, also remove the application from your Google or Microsoft account permissions.
        </p>
      </section>

      <section className="mfd-card email-search-card" aria-labelledby="email-search-title">
        <div className="email-section-heading">
          <div>
            <h2 id="email-search-title">Review matching emails</h2>
            <p className="overview-subtitle">Search common brokerage terms or enter your own terms. Only message headers and attachment details are listed.</p>
          </div>
        </div>
        <form className="email-search-form" onSubmit={handleSearch}>
          <label>
            <span>Mailbox</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              {PROVIDERS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="email-search-query">
            <span>Search terms</span>
            <input value={query} maxLength={200} onChange={(event) => setQuery(event.target.value)}
              placeholder="Default: brokerage, commission, AMC, folio, payout, GST…" />
          </label>
          <label>
            <span>Received after</span>
            <input type="date" value={after} max={before || undefined} onChange={(event) => setAfter(event.target.value)} />
          </label>
          <label>
            <span>Received before</span>
            <input type="date" value={before} min={after || undefined} onChange={(event) => setBefore(event.target.value)} />
          </label>
          <button className="header-action-btn" type="submit" disabled={isSearching || !currentConnection?.connected}>
            {isSearching ? 'Searching…' : 'Search mailbox'}
          </button>
        </form>
        {!currentConnection?.connected && (
          <p className="email-setup-hint" role="status">Connect {PROVIDERS.find((item) => item.id === provider)?.name} before searching. Manual document upload stays available.</p>
        )}
      </section>

      {messages.length > 0 && (
        <section className="email-message-list" aria-label="Matching mailbox messages">
          {messages.map((message) => (
            <article className="mfd-card email-message-card" key={message.id}>
              <div className="email-message-header">
                <div>
                  <h3>{message.subject || '(no subject)'}</h3>
                  <p className="overview-subtitle">From {message.sender || 'Unknown sender'} · {message.receivedAt || 'Date unavailable'}</p>
                </div>
                <span className="badge badge-primary">{message.attachments?.length || 0} attachments</span>
              </div>
              {message.attachments?.length ? (
                <ul className="email-attachment-list">
                  {message.attachments.map((attachment) => {
                    const supported = attachment.supported && Number(attachment.size || 0) <= 10 * 1024 * 1024;
                    const actionId = `${message.id}:${attachment.id}`;
                    return (
                      <li key={attachment.id}>
                        <div>
                          <strong>{attachment.name}</strong>
                          <span>{attachment.detectedDocumentType} · {Number(attachment.size || 0).toLocaleString('en-IN')} bytes · {supported ? 'Ready to review' : 'Unsupported or over 10 MB'}</span>
                        </div>
                        <button className="btn-secondary" type="button" disabled={!supported || Boolean(busyAction)}
                          title={!supported ? 'This build analyzes only CSV, TSV, or TXT attachments up to 10 MB.' : 'Import only this selected attachment'}
                          onClick={() => handleAttachmentImport(message, attachment)}>
                          {busyAction === actionId ? 'Importing…' : 'Import & Analyze'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="email-setup-hint">No file attachments in this message.</p>}
            </article>
          ))}
        </section>
      )}

      <section className="mfd-card email-import-history" aria-labelledby="email-import-history-title">
        <div className="email-section-heading">
          <div>
            <h2 id="email-import-history-title">Selected attachment imports</h2>
            <p className="overview-subtitle">Recent import status for this account. Deleting a completed import also deletes its saved analysis report.</p>
          </div>
        </div>
        {isLoading ? <p className="email-setup-hint" role="status">Loading import history…</p>
          : imports.length === 0 ? <p className="email-setup-hint">No email attachments have been imported.</p>
            : <ul className="email-import-list">
              {imports.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.fileName}</strong>
                    <span>{item.provider} · {item.status} · {new Date(item.importedAt).toLocaleString()}</span>
                  </div>
                  <button className="btn-secondary" type="button" disabled={Boolean(busyAction)}
                    onClick={() => handleDeleteImport(item.id)}>
                    {busyAction === `delete:${item.id}` ? 'Deleting…' : 'Delete import'}
                  </button>
                </li>
              ))}
            </ul>}
      </section>

      <div className="email-manual-upload">
        <span>Prefer not to connect a mailbox?</span>
        <button className="header-action-btn" type="button" onClick={() => onNavigate('upload')}>
          <Icon name="upload" size={15} color="#fff" />
          <span>Upload a document instead</span>
        </button>
      </div>
    </div>
  );
};
