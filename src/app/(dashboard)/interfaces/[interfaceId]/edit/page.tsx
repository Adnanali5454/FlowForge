'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  config: Record<string, unknown>;
  position: number;
}

interface FormConfig {
  title: string;
  description: string;
  submitButtonText: string;
  redirectUrl: string;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'textarea', label: 'Long Text', icon: '📄' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'email', label: 'Email', icon: '📧' },
  { type: 'phone', label: 'Phone', icon: '📞' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'select', label: 'Dropdown', icon: '🔽' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'radio', label: 'Radio', icon: '🔘' },
  { type: 'rating', label: 'Rating', icon: '⭐' },
  { type: 'divider', label: 'Divider', icon: '─' },
  { type: 'header', label: 'Heading', icon: 'H1' },
];

export default function InterfaceEditPage() {
  const params = useParams();
  const interfaceId = params?.interfaceId as string;

  const [formConfig, setFormConfig] = useState<FormConfig>({ title: '', description: '', submitButtonText: 'Submit', redirectUrl: '' });
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [interfaceName, setInterfaceName] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/interfaces/${interfaceId}`);
    const data = await res.json();
    if (data.interface) {
      setInterfaceName(data.interface.name);
      setIsPublished(data.interface.isPublished);
      const config = data.interface.config as FormConfig;
      setFormConfig({ title: config?.title || data.interface.name, description: config?.description || '', submitButtonText: config?.submitButtonText || 'Submit', redirectUrl: config?.redirectUrl || '' });
    }
    if (data.fields) {
      setFields(data.fields.map((f: FormField, i: number) => ({ ...f, id: f.id || String(i) })));
    }
  }, [interfaceId]);

  useEffect(() => { load(); }, [load]);

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: FIELD_TYPES.find(t => t.type === type)?.label || 'Field',
      placeholder: '',
      helpText: '',
      isRequired: false,
      config: {},
      position: fields.length,
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/interfaces/${interfaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: formConfig, fields }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    await fetch(`/api/interfaces/${interfaceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    setIsPublished(!isPublished);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/forms/${interfaceId}` : `/forms/${interfaceId}`;

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-4">
        <h1 className="text-white font-semibold">{interfaceName}</h1>
        {isPublished && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A227] hover:underline">
            View form ↗
          </a>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button onClick={publish} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${isPublished ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {isPublished ? 'Published ✓' : 'Publish'}
          </button>
          <button onClick={save} disabled={isSaving} className="px-4 py-1.5 bg-[#C9A227] text-[#0C2340] font-semibold text-sm rounded-lg disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Field palette */}
        <div className="w-48 border-r border-gray-800 p-3 overflow-y-auto">
          <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">Add Field</p>
          <div className="space-y-1">
            {FIELD_TYPES.map(ft => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-xs">{ft.icon}</span>
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Form preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-950">
          <div className="max-w-xl mx-auto">
            <input
              value={formConfig.title}
              onChange={e => setFormConfig(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full mb-2"
              placeholder="Form title"
            />
            <textarea
              value={formConfig.description}
              onChange={e => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
              className="text-gray-400 text-sm bg-transparent border-none outline-none w-full resize-none mb-6"
              placeholder="Form description (optional)"
              rows={2}
            />

            {fields.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl text-gray-600">
                Click fields on the left to add them here
              </div>
            )}

            {fields.map(field => (
              <div
                key={field.id}
                onClick={() => setSelectedFieldId(field.id)}
                className={`mb-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedFieldId === field.id ? 'border-[#C9A227]' : 'border-gray-800 hover:border-gray-700'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-300">
                    {field.label} {field.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <button
                    onClick={e => { e.stopPropagation(); removeField(field.id); }}
                    className="text-gray-600 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
                {field.type === 'textarea' ? (
                  <textarea disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm resize-none" rows={3} placeholder={field.placeholder || 'Your answer'} />
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2"><input type="checkbox" disabled /><span className="text-gray-500 text-sm">{field.label}</span></div>
                ) : field.type === 'select' ? (
                  <select disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm">
                    <option>Select an option</option>
                  </select>
                ) : field.type === 'rating' ? (
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => <span key={n} className="text-2xl text-gray-600">☆</span>)}</div>
                ) : field.type === 'divider' ? (
                  <hr className="border-gray-700" />
                ) : field.type === 'header' ? (
                  <h2 className="text-lg font-bold text-white">{field.label}</h2>
                ) : (
                  <input type={field.type} disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm" placeholder={field.placeholder || 'Your answer'} />
                )}
                {field.helpText && <p className="text-gray-600 text-xs mt-1">{field.helpText}</p>}
              </div>
            ))}

            {fields.length > 0 && (
              <button className="w-full py-3 bg-[#C9A227] text-[#0C2340] font-semibold rounded-xl">
                {formConfig.submitButtonText}
              </button>
            )}
          </div>
        </div>

        {/* Right: Field config */}
        {selectedField && (
          <div className="w-72 border-l border-gray-800 p-4 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Field Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input
                  value={selectedField.label}
                  onChange={e => updateField(selectedField.id, { label: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Placeholder</label>
                <input
                  value={selectedField.placeholder}
                  onChange={e => updateField(selectedField.id, { placeholder: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Help Text</label>
                <input
                  value={selectedField.helpText}
                  onChange={e => updateField(selectedField.id, { helpText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedField.isRequired}
                  onChange={e => updateField(selectedField.id, { isRequired: e.target.checked })}
                  id="required"
                />
                <label htmlFor="required" className="text-sm text-gray-300">Required</label>
              </div>
              {selectedField.type === 'select' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Options (one per line)</label>
                  <textarea
                    value={((selectedField.config.options as string[]) || []).join('\n')}
                    onChange={e => updateField(selectedField.id, { config: { options: e.target.value.split('\n').filter(Boolean) } })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] resize-none"
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
