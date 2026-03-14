'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWorkflowStore } from '@/hooks/use-workflow-store';
import EditorToolbar from '@/components/canvas/editor-toolbar';
import StepPicker from '@/components/canvas/step-picker';
import type { WorkflowDefinition, TriggerConfig, WorkflowSettings } from '@/types';
import { generateId } from '@/lib/utils';

// Dynamic import React Flow (client-only)
const WorkflowCanvas = dynamic(() => import('@/components/canvas/workflow-canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-canvas-bg">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading editor...</p>
      </div>
    </div>
  ),
});

// Demo workflow for initial load
function createDemoWorkflow(): WorkflowDefinition {
  const triggerId = generateId('trg');
  return {
    id: 'demo_workflow',
    workspaceId: 'demo_workspace',
    name: 'My First Workflow',
    description: 'A demo workflow to explore FlowForge',
    status: 'draft',
    version: 1,
    trigger: {
      id: triggerId,
      type: 'manual',
      connectorId: null,
      eventKey: 'manual_trigger',
      config: {},
      outputSchema: { type: 'object', properties: {} },
      position: { x: 250, y: 50 },
    } satisfies TriggerConfig,
    steps: [
      {
        id: generateId('step'),
        type: 'filter',
        name: 'Check Lead Source',
        description: 'Only proceed if lead source is "website"',
        connectorId: null,
        actionKey: '',
        config: {
          type: 'filter' as const,
          conditions: [{ field: 'source', operator: 'equals' as const, value: 'website' }],
          logic: 'and' as const,
        },
        inputMapping: {},
        outputSchema: { type: 'object', properties: {} },
        errorHandling: {
          onError: 'halt',
          maxRetries: 0,
          retryDelayMs: 1000,
          retryBackoff: 'fixed',
          routeToStepId: null,
          notifyOnError: true,
        },
        position: { x: 250, y: 220 },
        conditions: [],
        nextStepIds: [],
      },
      {
        id: generateId('step'),
        type: 'http',
        name: 'Send to CRM',
        description: 'POST lead data to HubSpot API',
        connectorId: null,
        actionKey: '',
        config: {
          type: 'http' as const,
          method: 'POST' as const,
          url: 'https://api.hubspot.com/contacts/v1/contact',
          headers: { 'Content-Type': 'application/json' },
          body: null,
          bodyType: 'json' as const,
          auth: null,
          timeout: 30000,
          followRedirects: true,
        },
        inputMapping: {},
        outputSchema: { type: 'object', properties: {} },
        errorHandling: {
          onError: 'retry',
          maxRetries: 3,
          retryDelayMs: 2000,
          retryBackoff: 'exponential',
          routeToStepId: null,
          notifyOnError: true,
        },
        position: { x: 250, y: 390 },
        conditions: [],
        nextStepIds: [],
      },
      {
        id: generateId('step'),
        type: 'formatter',
        name: 'Format Notification',
        description: 'Build Slack message from lead data',
        connectorId: null,
        actionKey: '',
        config: {
          type: 'formatter' as const,
          operation: 'text_replace' as const,
          inputField: 'message_template',
          options: {},
        },
        inputMapping: {},
        outputSchema: { type: 'object', properties: {} },
        errorHandling: {
          onError: 'halt',
          maxRetries: 0,
          retryDelayMs: 1000,
          retryBackoff: 'fixed',
          routeToStepId: null,
          notifyOnError: true,
        },
        position: { x: 250, y: 560 },
        conditions: [],
        nextStepIds: [],
      },
    ],
    variables: {},
    settings: {
      errorNotificationEmail: null,
      autoReplay: 'never',
      errorRatioThreshold: 80,
      maxConcurrentRuns: 5,
      timeout: 300000,
      retentionDays: 30,
      floodProtection: {
        enabled: true,
        maxTasksPerWindow: 100,
        windowMinutes: 10,
      },
    } satisfies WorkflowSettings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'demo_user',
    folderId: null,
    tags: ['demo'],
  };
}

export default function WorkflowEditorPage() {
  const { workflow, loadWorkflow } = useWorkflowStore();

  useEffect(() => {
    // In production, fetch workflow by ID from API
    // For now, load demo workflow
    if (!workflow) {
      loadWorkflow(createDemoWorkflow());
    }
  }, [workflow, loadWorkflow]);

  return (
    <div className="h-screen w-full relative bg-canvas-bg">
      <EditorToolbar />
      <div className="pt-14 h-full">
        <WorkflowCanvas />
      </div>
      <StepPicker />
    </div>
  );
}
