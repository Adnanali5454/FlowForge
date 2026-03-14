'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Sparkles, X, Send, Plus, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/hooks/use-workflow-store';
import { cn } from '@/lib/utils';
import type { StepConfig, TriggerConfig } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CopilotMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  suggestion?: WorkflowSuggestion;
  timestamp: Date;
}

interface WorkflowSuggestion {
  trigger: TriggerConfig;
  steps: StepConfig[];
}

const WELCOME_MESSAGE: CopilotMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! Describe a workflow and I'll help you build it. For example: 'When a new Stripe payment arrives, add a row to my FlowForge table and send a Slack notification.'",
  timestamp: new Date(),
};

const QUICK_PROMPTS: string[] = [
  'Sync CRM on form submit',
  'Alert on error',
  'Daily digest email',
  'Backup to spreadsheet',
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function getTriggerLabel(trigger: TriggerConfig): string {
  const labels: Record<string, string> = {
    gmail: 'Gmail → New Email',
    stripe: 'Stripe → New Payment',
    flowforge_tables: 'FlowForge Table → New Row',
    hubspot: 'HubSpot → New Contact',
  };
  if (trigger.connectorId && labels[trigger.connectorId]) {
    return labels[trigger.connectorId];
  }
  const typeLabels: Record<string, string> = {
    webhook: 'Webhook Received',
    schedule: 'Schedule / Cron',
    manual: 'Manual Trigger',
    'app-event': 'App Event',
    'sub-workflow': 'Sub-Workflow',
    polling: 'Polling',
  };
  return typeLabels[trigger.type] ?? trigger.type;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: WorkflowSuggestion;
  onAddToCanvas: (suggestion: WorkflowSuggestion) => void;
  added: boolean;
}

function SuggestionCard({ suggestion, onAddToCanvas, added }: SuggestionCardProps) {
  return (
    <div className="mt-3 rounded-xl border border-[#C9A227]/30 bg-[#1a1a2e] overflow-hidden">
      <div className="px-3 py-2 border-b border-[#C9A227]/20 text-xs font-semibold text-[#C9A227] uppercase tracking-wider">
        Suggested Workflow
      </div>
      <div className="p-3 space-y-2">
        {/* Trigger */}
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#C9A227]/20 flex items-center justify-center">
            <span className="text-[10px] text-[#C9A227] font-bold">T</span>
          </span>
          <span className="text-sm text-gray-300">
            <span className="text-gray-500 mr-1">Trigger:</span>
            {getTriggerLabel(suggestion.trigger)}
          </span>
        </div>

        {/* Steps */}
        {suggestion.steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-[10px] text-blue-400 font-bold">{index + 1}</span>
            </span>
            <span className="text-sm text-gray-300">
              <span className="text-gray-500 mr-1">Step {index + 1}:</span>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={() => onAddToCanvas(suggestion)}
          disabled={added}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            added
              ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
              : 'bg-[#C9A227] hover:bg-[#C9A227]/90 text-black cursor-pointer'
          )}
        >
          <Plus size={14} />
          {added ? 'Added to Canvas' : 'Add to Canvas'}
        </button>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: CopilotMessage;
  onAddToCanvas: (suggestion: WorkflowSuggestion) => void;
  addedSuggestionIds: Set<string>;
}

function MessageBubble({ message, onAddToCanvas, addedSuggestionIds }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[#C9A227]/20 text-white rounded-br-sm'
            : 'bg-[#1a1a2e] text-gray-300 border border-[#2d2d4d] rounded-bl-sm'
        )}
      >
        <p>{message.content}</p>
        {message.suggestion && (
          <SuggestionCard
            suggestion={message.suggestion}
            onAddToCanvas={onAddToCanvas}
            added={addedSuggestionIds.has(message.id)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AICopilotSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { updateTrigger, updateWorkflow, workflow } = useWorkflowStore();

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!res.ok) throw new Error('API error');

      const data = (await res.json()) as { trigger: TriggerConfig; steps: StepConfig[] };
      const assistantMsgId = `asst_${Date.now()}`;

      const assistantMsg: CopilotMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `Here's a suggested workflow for: "${trimmed}"`,
        suggestion: { trigger: data.trigger, steps: data.steps },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: CopilotMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the workflow. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCanvas = (suggestion: WorkflowSuggestion, messageId: string) => {
    if (!workflow) return;

    // Update trigger
    updateTrigger({
      type: suggestion.trigger.type,
      connectorId: suggestion.trigger.connectorId,
      eventKey: suggestion.trigger.eventKey,
      config: suggestion.trigger.config,
      outputSchema: suggestion.trigger.outputSchema,
    });

    // Append steps (re-position)
    const existingSteps = workflow.steps ?? [];
    const startY = existingSteps.length > 0
      ? Math.max(...existingSteps.map((s) => s.position.y)) + 170
      : 220;

    const positionedSteps = suggestion.steps.map((step, i) => ({
      ...step,
      position: { x: 250, y: startY + i * 170 },
    }));

    updateWorkflow({ steps: [...existingSteps, ...positionedSteps] });

    setAddedSuggestionIds((prev) => new Set([...prev, messageId]));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Toggle button — fixed to the right edge of the editor */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle AI Copilot"
        className={cn(
          'fixed right-4 top-1/2 -translate-y-1/2 z-30',
          'w-11 h-11 rounded-full flex items-center justify-center',
          'bg-[#0f0f1a] border border-[#C9A227]/50',
          'shadow-[0_0_16px_rgba(201,162,39,0.35)]',
          'hover:shadow-[0_0_24px_rgba(201,162,39,0.55)] hover:border-[#C9A227]',
          'transition-all duration-200',
          isOpen && 'border-[#C9A227] shadow-[0_0_24px_rgba(201,162,39,0.55)]'
        )}
      >
        <Sparkles size={18} className="text-[#C9A227]" />
      </button>

      {/* Sidebar panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full z-20',
          'w-[360px] bg-[#0f0f1a] border-l border-[#2d2d4d]',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2d2d4d] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A227]" />
            <span className="text-white font-semibold text-sm">AI Copilot</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-white transition-colors rounded-md p-1 hover:bg-white/10"
            aria-label="Close AI Copilot"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onAddToCanvas={(suggestion) => handleAddToCanvas(suggestion, msg.id)}
              addedSuggestionIds={addedSuggestionIds}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a2e] border border-[#2d2d4d] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#C9A227]" />
                <span className="text-sm text-gray-400">Generating workflow...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 pt-3 pb-2 border-t border-[#2d2d4d] flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2">Quick prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => void sendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-xs border border-[#2d2d4d] text-gray-400 hover:text-white hover:border-[#C9A227]/50 hover:bg-[#C9A227]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-[#2d2d4d] flex-shrink-0">
          <div className="flex items-end gap-2 bg-[#1a1a2e] border border-[#2d2d4d] rounded-xl p-2 focus-within:border-[#C9A227]/50 transition-colors">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your workflow..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] leading-6 disabled:opacity-50"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={() => void sendMessage(inputValue)}
              disabled={isLoading || inputValue.trim() === ''}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                inputValue.trim() && !isLoading
                  ? 'bg-[#C9A227] text-black hover:bg-[#C9A227]/90'
                  : 'bg-[#2d2d4d] text-gray-500 cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Backdrop on mobile / narrow screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export { AICopilotSidebar };
