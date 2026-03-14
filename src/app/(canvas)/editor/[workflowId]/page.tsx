'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWorkflowStore } from '@/hooks/use-workflow-store';
import EditorToolbar from '@/components/canvas/editor-toolbar';
import StepPicker from '@/components/canvas/step-picker';
import AICopilotSidebar from '@/components/canvas/ai-copilot-sidebar';
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

// Demo workflow as fallback
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

// Create a new blank workflow
function createNewWorkflow(): WorkflowDefinition {
  const triggerId = generateId('trg');
  return {
    id: generateId('wf'),
    workspaceId: '',
    name: 'Untitled Workflow',
    description: '',
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
    steps: [],
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
    createdBy: '',
    folderId: null,
    tags: [],
  };
}

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { workflow, loadWorkflow } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    const workflowId = params?.workflowId as string;

    if (!workflowId) {
      setIsLoading(false);
      return;
    }

    const initializeWorkflow = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If "new", create a new workflow via API
        if (workflowId === 'new') {
          const response = await fetch('/api/workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Untitled Workflow',
              description: '',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create new workflow');
          }

          const data = await response.json();
          const newWorkflowId = data.workflow.id;
          hasInitialized.current = true;
          router.push(`/editor/${newWorkflowId}`);
          return;
        }

        // Otherwise, fetch the workflow by ID
        const response = await fetch(`/api/workflows/${workflowId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Workflow not found');
          }
          throw new Error('Failed to load workflow');
        }

        const data = await response.json();
        loadWorkflow(data.workflow);
        hasInitialized.current = true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        console.error('Error loading workflow:', err);
        // Use demo workflow as fallback
        loadWorkflow(createDemoWorkflow());
        hasInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    if (!workflow) {
      initializeWorkflow();
    } else {
      hasInitialized.current = true;
      setIsLoading(false);
    }
  }, [params?.workflowId, loadWorkflow, router]);

  return (
    <div className="h-screen w-full relative bg-canvas-bg">
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      <EditorToolbar />
      <div className="pt-14 h-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-canvas-bg">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading workflow...</p>
            </div>
          </div>
        ) : (
          <WorkflowCanvas />
        )}
      </div>
      <StepPicker />
      <AICopilotSidebar />
    </div>
  );
}
