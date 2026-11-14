import { useState } from 'react';
import './AgenticBrainVisualizer.css';
import { Icon } from './Icons';

export const AgenticBrainVisualizer = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const agents = [
    {
      id: "cls",
      name: "1. Classification Agent",
      role: "Source & Layout Detection",
      prompt: "Identify MIME type, provider signature (CAMS, Zerodha, Groww, ICICI) and table schema layout.",
      algorithm: "Pattern matching + heuristic header signature hashing",
      latency: "42ms",
      status: "Active (Listening)"
    },
    {
      id: "ext",
      name: "2. Extraction Agent",
      role: "Tabular Stream Parser",
      prompt: "Extract row-level records, transaction dates, folios, ISIN, NAV and units with zero data truncation.",
      algorithm: "Streamed cell matrix reconstruction + fallback OCR tokenizer",
      latency: "86ms",
      status: "Active (Extracted 142 rows)"
    },
    {
      id: "norm",
      name: "3. Normalization Agent",
      role: "Field Schema Translation",
      prompt: "Map technical headers (BRKAGE_RATE, AVG_ASSETS, CAM_RATE) to unified MFD ontology.",
      algorithm: "Ontology dictionary mapping + natural language translation",
      latency: "34ms",
      status: "Active (Mapped 18 keys)"
    },
    {
      id: "brk",
      name: "4. Brokerage Agent",
      role: "Fee & Commission Core",
      prompt: "Calculate gross/net trail commissions, B-30 city incentives, TDS deduction @ 5% under Sec 194H.",
      algorithm: "Trail = (AVG_ASSETS × BRKAGE_RATE) / 12; Net = Gross - TDS(5%)",
      latency: "18ms",
      status: "Active (Computed ₹94,820)"
    },
    {
      id: "mf",
      name: "5. Mutual Fund Agent",
      role: "Asset Allocation Engine",
      prompt: "Segment scheme holdings by AMC code, category (Equity, Debt, Hybrid, Liquid), and risk tier.",
      algorithm: "AMFI Master Scheme Taxonomy Matching",
      latency: "28ms",
      status: "Active (18 Schemes Classified)"
    },
    {
      id: "ret",
      name: "6. Return Agent",
      role: "Deterministic Math Core",
      prompt: "Calculate Profit/Loss, Absolute Return % and XIRR strictly from verified dates & NAV points.",
      algorithm: "Zero-Hallucination Guardrail: If NAV is missing, return hasSufficientData: false",
      latency: "52ms",
      status: "Active (+18.4% Absolute)"
    },
    {
      id: "bi",
      name: "7. BI Agent",
      role: "Pattern & Outlier Detector",
      prompt: "Detect asset concentration, fee anomalies, high expense ratio drag, and revenue drivers.",
      algorithm: "Anomaly thresholding + Portfolio Gini coefficient calculation",
      latency: "38ms",
      status: "Active (3 Patterns Detected)"
    },
    {
      id: "rec",
      name: "8. Recommendation Agent",
      role: "Objective Action Advisor",
      prompt: "Synthesize actionable observations without financial speculation or ungrounded claims.",
      algorithm: "Rule-based fiduciary compliance synthesis",
      latency: "29ms",
      status: "Active (3 Actions Prepared)"
    },
    {
      id: "rep",
      name: "9. Report Agent",
      role: "Executive Document Synthesizer",
      prompt: "Compile structured 10-section formal report with client-side PDF and CSV export hooks.",
      algorithm: "JSON-LD to Printable Document Tree Compiler",
      latency: "44ms",
      status: "Active (10 Sections Ready)"
    },
    {
      id: "qa",
      name: "10. QA Copilot Agent",
      role: "Context-Grounding Copilot",
      prompt: "Answer user natural language queries strictly using document facts and field definitions.",
      algorithm: "Retrieval-Augmented Context Verification (Zero Hallucination)",
      latency: "65ms",
      status: "Active (Dynamic Questions Live)"
    }
  ];

  return (
    <div className="brain-visualizer-container">
      <div className="brain-header">
        <div>
          <h3 className="brain-title">
            <span className="node-pulse-indicator"></span>
            <span>Live Multi-Agent Autonomous Neural Topology</span>
            <span className="badge badge-primary" style={{ fontSize: '10px' }}>10 Coordinated Agents</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Click any agent node below to inspect its internal prompt, math formula, latency, and telemetry status
          </p>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="agent-nodes-grid">
        {agents.map((ag) => (
          <div
            key={ag.id}
            className={`agent-node-card ${selectedAgent?.id === ag.id ? 'selected' : ''}`}
            onClick={() => setSelectedAgent(selectedAgent?.id === ag.id ? null : ag)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="node-pulse-indicator"></span>
              <span style={{ fontSize: '9px', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                {ag.latency}
              </span>
            </div>
            <div className="node-name">{ag.name}</div>
            <div className="node-role">{ag.role}</div>
          </div>
        ))}
      </div>

      {/* Node Inspector Drawer */}
      {selectedAgent && (
        <div className="agent-inspection-modal">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="bot" size={18} color="var(--primary-light)" />
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedAgent.name} Inspector</strong>
            </div>
            <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => setSelectedAgent(null)}>
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>System Prompt & Mandate:</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{selectedAgent.prompt}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Deterministic Algorithm / Formula:</span>
              <div className="telemetry-tag" style={{ marginTop: '2px' }}>{selectedAgent.algorithm}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--success)' }}>
              ● Current Status: <strong>{selectedAgent.status}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Processing Pipeline Latency: <strong>{selectedAgent.latency}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
