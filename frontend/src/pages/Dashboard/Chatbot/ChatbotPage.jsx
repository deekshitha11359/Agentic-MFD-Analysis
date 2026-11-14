import { useRef, useState } from 'react';
import { Icon } from '../../../components/common/Icons';
import { agentPipeline } from '../../../services/agentPipeline';

export const ChatbotPage = ({ report }) => {
  const nextMessageId = useRef(1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: report 
        ? `Hello! I am your **Agentic QA Copilot** for **${report.docName}** (${report.source}). I have indexed all ${report.summary.totalRecords} records, ${report.summary.schemesCount} schemes, and technical commission codes. What would you like to investigate?`
        : "Hello! Please upload a document to enable document-specific querying.",
      time: 'Just now',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = report?.suggestedQuestions || [
    "What is my total investment?",
    "What is the meaning of BRKAGE_RATE?",
    "Which scheme has the highest investment?",
    "How much brokerage was generated?"
  ];

  const handleSend = (queryText) => {
    const query = queryText || input;
    if (!query.trim()) return;

    const makeMessageId = () => {
      nextMessageId.current += 1;
      return nextMessageId.current;
    };

    const userMsg = { id: makeMessageId(), sender: 'user', text: query, time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = agentPipeline.answerQuery(query, report);
      setMessages((prev) => [...prev, { id: makeMessageId(), sender: 'ai', text: response, time: 'Just now' }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="overview-container" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="overview-header" style={{ marginBottom: '12px' }}>
        <div className="overview-title-group">
          <h1>Agentic AI Question Answering Copilot</h1>
          <p className="overview-subtitle">
            Document Context: <strong>{report?.docName || "None loaded"}</strong> • Strict Zero Hallucination Mode
          </p>
        </div>

        <div className="overview-actions">
          <span className="badge badge-primary">
            <span className="status-dot"></span> Context-Grounding Active
          </span>
        </div>
      </div>

      {/* Chat Card */}
      <div className="mfd-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
              }}
            >
              {msg.sender === 'ai' && (
                <div className="metric-icon-wrap icon-purple" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                  <Icon name="bot" size={18} />
                </div>
              )}
              <div
                style={{
                  background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card-hover)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
                <div style={{ fontSize: '10px', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div className="metric-icon-wrap icon-purple" style={{ width: '36px', height: '36px' }}>
                <Icon name="bot" size={18} />
              </div>
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px 18px', borderRadius: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Consulting document records and brokerage normalization schema...
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Suggested Questions */}
        <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px', whiteSpace: 'nowrap' }}
              onClick={() => handleSend(q)}
            >
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="global-search-input"
            placeholder="Ask anything about this document (e.g. 'What is BRKAGE_RATE?', 'Show total investment')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="header-action-btn" onClick={() => handleSend()}>
            <Icon name="send" size={16} color="#fff" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
