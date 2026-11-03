import React, { useState } from 'react';
import { client } from '../api/client.js';

export function AiCopilot() {
  const [collapsed, setCollapsed] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: '👋 Hello Sarah! I am your S2P Intelligence Copilot. How can I assist you with procurement policies, contract clause reviews, or 3-way matching exceptions today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (promptText, mode = 'general') => {
    const text = promptText || input.trim();
    if (!text) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await client.askAi(text, mode);
      const ai = res.response;
      setMessages([
        ...newMsgs,
        {
          role: 'bot',
          agent: ai.agent,
          confidence: ai.confidence,
          content: ai.content,
          citations: ai.citations
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMsgs,
        { role: 'bot', content: `Error querying AI copilot: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-drawer ${collapsed ? 'collapsed' : ''}`}>
      <div className="ai-header" onClick={() => setCollapsed(!collapsed)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
          <span>🤖</span>
          <span>ProcureFlow AI Copilot</span>
        </div>
        <button className="btn btn-outline btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
          {collapsed ? 'Expand ▲' : 'Collapse ▼'}
        </button>
      </div>

      <div className="ai-body">
        {messages.map((m, i) => (
          <div key={i} className={`ai-message ${m.role === 'user' ? 'ai-message-user' : 'ai-message-bot'}`}>
            {m.agent && (
              <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>
                {m.agent} ({Math.round(m.confidence * 100)}% confidence)
              </div>
            )}
            <div style={{ whiteSpace: 'pre-line' }}>{m.content}</div>
            {m.citations?.length > 0 && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--slate-500)', borderTop: '1px solid var(--slate-300)', paddingTop: '4px' }}>
                <strong>Citations:</strong> {m.citations.join(', ')}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="ai-message ai-message-bot">
            <em>Thinking with enterprise S2P domain knowledge...</em>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          <button className="ai-chip" onClick={() => { setCollapsed(false); sendMessage('Analyze contract CTR-603 liability deviations', 'contract'); }}>
            CTR-603 Deviations
          </button>
          <button className="ai-chip" onClick={() => { setCollapsed(false); sendMessage('Explain exception on invoice INV-802', 'invoice'); }}>
            INV-802 Exception
          </button>
          <button className="ai-chip" onClick={() => { setCollapsed(false); sendMessage('Assess supplier risk on BioHealth Ltd', 'supplier'); }}>
            BioHealth Risk
          </button>
        </div>
      </div>

      <div className="ai-input-wrapper">
        <input
          type="text"
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Ask AI Copilot across all 7 workspaces..."
        />
        <button className="btn btn-primary btn-sm" onClick={() => sendMessage()}>Send</button>
      </div>
    </div>
  );
}

