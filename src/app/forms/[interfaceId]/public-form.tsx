'use client';

import { useState } from 'react';

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  config: Record<string, unknown>;
}

interface PublicFormProps {
  interfaceId: string;
  config: Record<string, unknown>;
  fields: Field[];
  branding: Record<string, unknown>;
}

export default function PublicForm({ interfaceId, config, fields, branding }: PublicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const primaryColor = (branding?.primaryColor as string) || '#C9A227';

  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.isRequired && !values[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-gray-500">Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {(branding?.logoUrl as string) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl as string} alt="Logo" className="h-10 mb-6" />
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{config?.title as string || 'Form'}</h1>
        {(config?.description as string) && <p className="text-gray-500 mb-6">{config.description as string}</p>}

        <div className="space-y-5">
          {fields.map(field => (
            <div key={field.id}>
              {field.type !== 'divider' && field.type !== 'header' && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
              )}

              {field.type === 'textarea' ? (
                <textarea
                  value={String(values[field.id] ?? '')}
                  onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(values[field.id] ?? '')}
                  onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {((field.config.options as string[]) || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values[field.id]}
                    onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </div>
              ) : field.type === 'rating' ? (
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValues(prev => ({ ...prev, [field.id]: n }))}
                      className="text-2xl"
                    >
                      {(values[field.id] as number || 0) >= n ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              ) : field.type === 'divider' ? (
                <hr className="border-gray-200" />
              ) : field.type === 'header' ? (
                <h2 className="text-lg font-bold text-gray-900">{field.label}</h2>
              ) : (
                <input
                  type={field.type === 'phone' ? 'tel' : field.type}
                  value={String(values[field.id] ?? '')}
                  onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {errors[field.id] && <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>}
              {field.helpText && <p className="text-gray-400 text-xs mt-1">{field.helpText}</p>}
            </div>
          ))}
        </div>

        <button
          onClick={submit}
          disabled={isSubmitting}
          style={{ backgroundColor: primaryColor }}
          className="mt-8 w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : (config?.submitButtonText as string) || 'Submit'}
        </button>
      </div>
    </div>
  );
}
