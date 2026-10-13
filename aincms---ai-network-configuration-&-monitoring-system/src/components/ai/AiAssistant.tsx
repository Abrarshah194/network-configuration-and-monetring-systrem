import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Bot,
  Send,
  Sparkles,
  Server,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { askGeminiAssistant } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  provider?: string;
}

export const AiAssistant: React.FC = () => {
  const { state, geminiConfigured } = useNetwork();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: `Hello! I am your AI Network Engineering Assistant. I am connected to the live telemetry and configuration state of this network.

I can help you:
- **Diagnose Faults & Latency**: Analyze active anomalies and packet drops.
- **Review Device Configurations**: Check Cisco / FRR syntax for syntax errors and security gaps.
- **Explain Networking Theory**: Clarify OSPF Areas, VLAN 802.1Q tags, Spanning-Tree BPDUs, and ACL masks.
- **Draft Remediation Plans**: Propose safe, atomic configuration changes with verification commands.

How can I assist your network operations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: geminiConfigured ? 'gemini-3.8-flash' : 'rule-based-fallback',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!state) return null;

  const quickPrompts = [
    'Analyze current network health and identify any active bottlenecks.',
    'Explain the root cause of any degraded or down links in the topology.',
    'Review the running configuration of HQ-Core-Router-01 for OSPF best practices.',
    'Draft an Access Control List (ACL) template to protect database server SRV1.',
    'Explain the difference between Spanning Tree Protocol (STP) and OSPF link convergence.',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await askGeminiAssistant(query, selectedDeviceId || undefined);
      if (res.success) {
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: res.provider,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Error connecting to AI service: ${err.message}. Please verify server connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Gemini AI Network Copilot</h2>
              <span className="text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded on real-time simulated telemetry, topology graph, and device running configs.
            </p>
          </div>
        </div>

        {/* Device Context Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-400">Context Node:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">Entire Network Fleet</option>
            {state.devices.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900">
                {d.name} ({d.managementIp})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5 pr-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm relative group ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                    <span className="font-mono font-medium text-purple-400">
                      {msg.provider ? `Provider: ${msg.provider}` : 'AI Intelligence'}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="hover:text-slate-200 transition p-1"
                      title="Copy response text"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                <div className={`mt-2 text-[10px] font-mono text-right ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <span>Analyzing network topology state and synthesizing response...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="pt-2 pb-3 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar shrink-0">
        <span className="text-slate-500 font-medium whitespace-nowrap">Suggested:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full transition text-left"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 shrink-0 shadow-lg">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask about active alerts, OSPF routing, VLANs, ACL rules, or troubleshooting steps..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputPrompt.trim() || loading}
          className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-lg transition disabled:opacity-40 shadow-md shadow-purple-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
