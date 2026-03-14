// ─── Workflow Editor Store (Zustand) ────────────────────────────────────────
// Central state management for the visual workflow canvas editor.
// Manages: nodes, edges, selected step, sidebar state, undo history.

import { create } from 'zustand';
import type {
  WorkflowDefinition,
  StepConfig,
  TriggerConfig,
  StepType,
  WorkflowStatus,
  NodePosition,
} from '@/types';
import { generateId } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CanvasNode {
  id: string;
  type: 'trigger' | 'step';
  data: TriggerConfig | StepConfig;
  position: NodePosition;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
}

export type SidebarPanel =
  | 'none'
  | 'step-config'
  | 'step-picker'
  | 'notes'
  | 'history'
  | 'settings'
  | 'runs'
  | 'variables';

interface WorkflowEditorState {
  // Workflow data
  workflow: WorkflowDefinition | null;
  isDirty: boolean;
  isSaving: boolean;

  // Canvas state
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  zoom: number;

  // Sidebar
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;

  // Step picker
  stepPickerOpen: boolean;
  stepPickerInsertAfter: string | null;

  // Undo/redo
  undoStack: WorkflowDefinition[];
  redoStack: WorkflowDefinition[];

  // Actions
  loadWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflow: (partial: Partial<WorkflowDefinition>) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;

  // Node actions
  selectNode: (nodeId: string | null) => void;
  addStep: (type: StepType, afterStepId: string | null) => void;
  removeStep: (stepId: string) => void;
  updateStep: (stepId: string, updates: Partial<StepConfig>) => void;
  updateTrigger: (updates: Partial<TriggerConfig>) => void;
  moveNode: (nodeId: string, position: NodePosition) => void;

  // Sidebar
  setSidebarPanel: (panel: SidebarPanel) => void;

  // Step picker
  openStepPicker: (insertAfterId: string | null) => void;
  closeStepPicker: () => void;

  // Canvas
  setZoom: (zoom: number) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Build nodes/edges from workflow
  rebuildCanvas: () => void;
}

// ─── Default Step Configs ───────────────────────────────────────────────────

function createDefaultStepConfig(type: StepType): StepConfig {
  const id = generateId('step');
  const base: StepConfig = {
    id,
    type,
    name: getStepTypeName(type),
    description: '',
    connectorId: null,
    actionKey: '',
    config: { type } as StepConfig['config'],
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
    position: { x: 250, y: 0 },
    conditions: [],
    nextStepIds: [],
  };
  return base;
}

function getStepTypeName(type: StepType): string {
  const names: Record<StepType, string> = {
    trigger: 'Trigger',
    action: 'Action',
    filter: 'Filter',
    path: 'Path',
    delay: 'Delay',
    loop: 'Loop',
    formatter: 'Formatter',
    code: 'Code',
    http: 'HTTP Request',
    ai: 'AI',
    'human-in-the-loop': 'Approval',
    'sub-workflow': 'Sub-Workflow',
    digest: 'Digest',
    storage: 'Storage',
    'error-handler': 'Error Handler',
  };
  return names[type] ?? type;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useWorkflowStore = create<WorkflowEditorState>((set, get) => ({
  // Initial state
  workflow: null,
  isDirty: false,
  isSaving: false,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  zoom: 1,
  sidebarPanel: 'none',
  sidebarWidth: 380,
  stepPickerOpen: false,
  stepPickerInsertAfter: null,
  undoStack: [],
  redoStack: [],

  // ── Load Workflow ──────────────────────────────────────────────────────
  loadWorkflow: (workflow) => {
    set({ workflow, isDirty: false, undoStack: [], redoStack: [] });
    get().rebuildCanvas();
  },

  // ── Update Workflow ────────────────────────────────────────────────────
  updateWorkflow: (partial) => {
    const current = get().workflow;
    if (!current) return;

    // Push current to undo stack
    set((state) => ({
      undoStack: [...state.undoStack.slice(-20), current],
      redoStack: [],
      workflow: { ...current, ...partial, updatedAt: new Date().toISOString() },
      isDirty: true,
    }));
    get().rebuildCanvas();
  },

  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),

  // ── Node Selection ─────────────────────────────────────────────────────
  selectNode: (nodeId) => {
    set({
      selectedNodeId: nodeId,
      sidebarPanel: nodeId ? 'step-config' : 'none',
    });
  },

  // ── Add Step ───────────────────────────────────────────────────────────
  addStep: (type, afterStepId) => {
    const workflow = get().workflow;
    if (!workflow) return;

    const newStep = createDefaultStepConfig(type);
    const steps = [...workflow.steps];

    if (afterStepId) {
      const insertIndex = steps.findIndex((s) => s.id === afterStepId);
      if (insertIndex >= 0) {
        steps.splice(insertIndex + 1, 0, newStep);
      } else {
        steps.push(newStep);
      }
    } else {
      steps.push(newStep);
    }

    // Update Y positions (immutable)
    const repositioned = steps.map((step, i) => ({ ...step, position: { x: 250, y: 200 + i * 150 } }));

    get().updateWorkflow({ steps: repositioned });
    set({ selectedNodeId: newStep.id, sidebarPanel: 'step-config', stepPickerOpen: false });
  },

  // ── Remove Step ────────────────────────────────────────────────────────
  removeStep: (stepId) => {
    const workflow = get().workflow;
    if (!workflow) return;

    const filtered = workflow.steps.filter((s) => s.id !== stepId);
    const repositioned = filtered.map((step, i) => ({ ...step, position: { x: 250, y: 200 + i * 150 } }));

    get().updateWorkflow({ steps: repositioned });
    set({ selectedNodeId: null, sidebarPanel: 'none' });
  },

  // ── Update Step ────────────────────────────────────────────────────────
  updateStep: (stepId, updates) => {
    const workflow = get().workflow;
    if (!workflow) return;

    const steps = workflow.steps.map((s) =>
      s.id === stepId ? { ...s, ...updates } : s
    );
    get().updateWorkflow({ steps });
  },

  // ── Update Trigger ─────────────────────────────────────────────────────
  updateTrigger: (updates) => {
    const workflow = get().workflow;
    if (!workflow) return;

    get().updateWorkflow({
      trigger: { ...workflow.trigger, ...updates },
    });
  },

  // ── Move Node ──────────────────────────────────────────────────────────
  moveNode: (nodeId, position) => {
    const workflow = get().workflow;
    if (!workflow) return;

    if (nodeId === workflow.trigger.id) {
      get().updateTrigger({ position });
    } else {
      get().updateStep(nodeId, { position });
    }
  },

  // ── Sidebar ────────────────────────────────────────────────────────────
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),

  // ── Step Picker ────────────────────────────────────────────────────────
  openStepPicker: (insertAfterId) => {
    set({ stepPickerOpen: true, stepPickerInsertAfter: insertAfterId });
  },
  closeStepPicker: () => {
    set({ stepPickerOpen: false, stepPickerInsertAfter: null });
  },

  // ── Zoom ───────────────────────────────────────────────────────────────
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

  // ── Undo / Redo ────────────────────────────────────────────────────────
  undo: () => {
    const { undoStack, workflow } = get();
    if (undoStack.length === 0 || !workflow) return;

    const prev = undoStack[undoStack.length - 1];
    set((state) => ({
      workflow: prev,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, workflow],
      isDirty: true,
    }));
    get().rebuildCanvas();
  },

  redo: () => {
    const { redoStack, workflow } = get();
    if (redoStack.length === 0 || !workflow) return;

    const next = redoStack[redoStack.length - 1];
    set((state) => ({
      workflow: next,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, workflow!],
      isDirty: true,
    }));
    get().rebuildCanvas();
  },

  // ── Rebuild Canvas ─────────────────────────────────────────────────────
  rebuildCanvas: () => {
    const workflow = get().workflow;
    if (!workflow) {
      set({ nodes: [], edges: [] });
      return;
    }

    // Build nodes
    const nodes: CanvasNode[] = [
      {
        id: workflow.trigger.id,
        type: 'trigger',
        data: workflow.trigger,
        position: workflow.trigger.position,
      },
      ...workflow.steps.map((step) => ({
        id: step.id,
        type: 'step' as const,
        data: step,
        position: step.position,
      })),
    ];

    // Build edges using step.nextStepIds for DAG support
    const edges: CanvasEdge[] = [];
    const firstStep = workflow.steps[0];
    if (firstStep) {
      edges.push({ id: `edge-${workflow.trigger.id}-${firstStep.id}`, source: workflow.trigger.id, target: firstStep.id, animated: false });
    }
    workflow.steps.forEach((step, i) => {
      if (step.nextStepIds && step.nextStepIds.length > 0) {
        step.nextStepIds.forEach(targetId => {
          edges.push({ id: `edge-${step.id}-${targetId}`, source: step.id, target: targetId, animated: false });
        });
      } else if (i < workflow.steps.length - 1) {
        const nextStep = workflow.steps[i + 1];
        edges.push({ id: `edge-${step.id}-${nextStep.id}`, source: step.id, target: nextStep.id, animated: false });
      }
    });

    set({ nodes, edges });
  },
}));
