'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Chatbot {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  brandingConfig: Record<string, unknown>;
  isPublished: boolean;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

const TABS = ['Config', 'Branding', 'Test', 'Embed'] as const;
type Tab = typeof TABS[number];

export default function ChatbotEditPage() {
  const params = useParams();
  const chatbotId = params?.chatbotId as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Config');
  const [isSaving, setIsSaving] = useState(false);
  const [testMessages, setTestMessages] = useState<ChatMsg[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chatbots/${chatbotId}`).then(r => r.json()).then(d => {
      if (d.chatbot) setChatbot(d.chatbot);
    });
  }, [chatbotId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const save = useCallback(async () => {
    if (!chatbot) return;
    setIsSaving(true);
    try {
      await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatbot),
      });
    } finally {
      setIsSaving(false);
    }
  }, [chatbot, chatbotId]);

  const sendTestMessage = async () => {
    if (!testInput.trim() || isChatting) return;
    const userMsg: ChatMsg = { role: 'user', content: testInput };
    const newMsgs = [...testMessages, userMsg];
    setTestMessages(newMsgs);
    setTestInput('');
    setIsChatting(true);

    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, sessionId: 'test_session' }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setTestMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                assistantContent += data.delta.text;
                setTestMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setTestMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (!chatbot) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const embedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/chatbot.js" data-chatbot-id="${chatbotId}"></script>`;

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-4">
        <h1 className="text-white font-semibold">{chatbot.name}</h1>
        <nav className="flex gap-1 ml-4">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-lg ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="ml-auto">
          <button onClick={save} disabled={isSaving} className="px-4 py-1.5 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'Config' && (
          <div className="max-w-xl space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input value={chatbot.name} onChange={e => setChatbot(prev => prev ? { ...prev, name: e.target.value } : prev)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Model</label>
              <select value={chatbot.model} onChange={e => setChatbot(prev => prev ? { ...prev, model: e.target.value } : prev)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]">
                {['claude-sonnet-4-6', 'claude-opus-4-6', 'gpt-4o', 'gpt-4o-mini'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">System Prompt</label>
              <textarea value={chatbot.systemPrompt} onChange={e => setChatbot(prev => prev ? { ...prev, systemPrompt: e.target.value } : prev)}
                rows={5} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Welcome Message</label>
              <input value={chatbot.welcomeMessage} onChange={e => setChatbot(prev => prev ? { ...prev, welcomeMessage: e.target.value } : prev)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
            </div>
          </div>
        )}

        {activeTab === 'Branding' && (
          <div className="max-w-xl space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Primary Color</label>
              <input type="color" value={(chatbot.brandingConfig?.primaryColor as string) || '#C9A227'}
                onChange={e => setChatbot(prev => prev ? { ...prev, brandingConfig: { ...prev.brandingConfig, primaryColor: e.target.value } } : prev)}
                className="w-12 h-10 rounded cursor-pointer border-0" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Logo URL</label>
              <input value={(chatbot.brandingConfig?.logoUrl as string) || ''} onChange={e => setChatbot(prev => prev ? { ...prev, brandingConfig: { ...prev.brandingConfig, logoUrl: e.target.value } } : prev)}
                placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
            </div>
          </div>
        )}

        {activeTab === 'Test' && (
          <div className="max-w-lg flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white rounded-xl px-4 py-2 text-sm max-w-xs">{chatbot.welcomeMessage}</div>
              </div>
              {testMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-xl px-4 py-2 text-sm max-w-xs ${msg.role === 'user' ? 'bg-[#C9A227] text-[#0C2340]' : 'bg-gray-800 text-white'}`}>
                    {msg.content || <span className="animate-pulse">▌</span>}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input value={testInput} onChange={e => setTestInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendTestMessage()}
                placeholder="Type a message..." className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]" />
              <button onClick={sendTestMessage} disabled={isChatting || !testInput.trim()}
                className="px-4 py-2.5 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">Send</button>
            </div>
          </div>
        )}

        {activeTab === 'Embed' && (
          <div className="max-w-xl space-y-5">
            <div className="glass rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Embed Code</h3>
              <p className="text-gray-400 text-sm mb-3">Add this script tag to your website to embed the chatbot:</p>
              <pre className="bg-gray-900 rounded-lg p-3 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
              <button onClick={() => navigator.clipboard.writeText(embedCode)} className="mt-2 text-xs text-[#C9A227] hover:underline">Copy to clipboard</button>
            </div>
            <div className="glass rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Public Link</h3>
              <p className="text-gray-400 text-sm mb-3">Share this link to open the chatbot in a full page:</p>
              <code className="text-[#C9A227] text-sm">{typeof window !== 'undefined' ? `${window.location.origin}/chat/${chatbotId}` : `/chat/${chatbotId}`}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
