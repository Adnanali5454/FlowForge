import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowExecutor } from '@/lib/engine/executor/workflow-executor';
import type { WorkflowDefinition, StepConfig, FilterConfig } from '@/types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock modules that reach into DB or external systems
vi.mock('@/lib/connectors/base', () => ({
  getConnector: vi.fn(() => null),
}));

vi.mock('@/lib/engine/steps/http', () => ({
  executeHttp: vi.fn(async () => ({ statusCode: 200, headers: {}, body: {}, durationMs: 10 })),
}));

vi.mock('@/lib/engine/steps/ai', () => ({
  executeAi: vi.fn(async () => ({
    model: 'claude-sonnet-4-5-20250514',
    output: 'mock AI output',
    tokensUsed: 50,
    durationMs: 100,
  })),
}));

vi.mock('@/lib/engine/steps/delay', () => ({
  executeDelay: vi.fn(async () => ({ delayedMs: 0, resumeAt: null, type: 'duration' })),
}));

vi.mock('@/lib/engine/steps/storage', () => ({
  executeStorage: vi.fn(async () => ({
    action: 'get', key: 'test', namespace: 'default', value: null, previousValue: null,
  })),
}));

vi.mock('@/lib/engine/steps/digest', () => ({
  executeDigest: vi.fn(async () => ({
    action: 'append', digestKey: 'test', entryCount: 1, entries: [],
  })),
}));

vi.mock('@/lib/engine/steps/sub-workflow', () => ({
  executeSubWorkflow: vi.fn(async () => ({
    targetWorkflowId: 'wf_sub', executionId: 'exec_sub', status: 'success',
    stepsExecuted: 0, error: null, output: {}, durationMs: 10,
  })),
}));

vi.mock('@/lib/engine/steps/hitl', () => ({
  executeHitl: vi.fn(async () => ({
    status: 'pending', approvalId: 'apr_1', assigneeEmail: 'user@test.com',
    instructions: '', deadline: null, deadlineAction: 'approve', escalateTo: null, fields: [],
  })),
}));

vi.mock('@/lib/engine/steps/code', () => ({
  executeCode: vi.fn(async () => ({ output: { result: 'ok' }, logs: [] })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWorkflow(steps: StepConfig[]): WorkflowDefinition {
  return {
    id: 'wf_test_001',
    workspaceId: 'ws_test_001',
    name: 'Test Workflow',
    description: '',
    status: 'active',
    version: 1,
    trigger: {
      id: 'trigger_1',
      type: 'manual',
      connectorId: null,
      eventKey: 'manual',
      config: {},
      outputSchema: { type: 'object', properties: {} },
      position: { x: 0, y: 0 },
    },
    steps,
    variables: {},
    settings: {
      errorNotificationEmail: null,
      autoReplay: 'never',
      errorRatioThreshold: 100,
      maxConcurrentRuns: 1,
      timeout: 30000,
      retentionDays: 30,
      floodProtection: { enabled: false, maxTasksPerWindow: 100, windowMinutes: 60 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user_test',
    folderId: null,
    tags: [],
  };
}

function makeStep(overrides: Partial<StepConfig> & { type: StepConfig['type']; config: StepConfig['config'] }): StepConfig {
  return {
    id: 'step_1',
    name: 'Test Step',
    description: '',
    connectorId: null,
    actionKey: '',
    inputMapping: {},
    outputSchema: { type: 'object', properties: {} },
    errorHandling: {
      onError: 'halt',
      maxRetries: 0,
      retryDelayMs: 1000,
      retryBackoff: 'fixed',
      routeToStepId: null,
      notifyOnError: false,
    },
    position: { x: 100, y: 100 },
    conditions: [],
    nextStepIds: [],
    ...overrides,
  };
}

function makeFilterStep(
  id: string,
  pass: boolean
): StepConfig {
  const filterConfig: FilterConfig = {
    type: 'filter',
    conditions: [
      {
        field: 'value',
        operator: 'equals',
        value: pass ? 'match' : 'no-match',
      },
    ],
    logic: 'and',
  };
  // Map the trigger.value into the step's inputData so filter can evaluate it
  const inputMapping: Record<string, import('@/types').DataMapping> = {
    value: {
      type: 'reference',
      value: 'trigger.value',
      sourceStepId: null,
      sourceField: null,
    },
  };
  return makeStep({ id, type: 'filter', config: filterConfig, inputMapping });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkflowExecutor — basic execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks execution as success for a passing filter', async () => {
    const filterStep = makeFilterStep('filter_pass', true);
    const workflow = makeWorkflow([filterStep]);
    const executor = new WorkflowExecutor(workflow, { value: 'match' });
    const state = await executor.execute();

    expect(state.status).toBe('success');
    expect(state.stepsExecuted).toBe(1);
    const record = state.stepResults.get('filter_pass');
    expect(record).toBeDefined();
    expect(record!.status).toBe('success');
    expect(record!.outputData).toMatchObject({ passed: true });
  });

  it('halts at filter step when filter does not pass (skipped status)', async () => {
    // filter_fail expects 'no-match' but trigger has 'match' → filter fails → skipped
    const filterStep = makeFilterStep('filter_fail', false);
    // Add a second step that should NOT run
    const secondStep = makeStep({
      id: 'step_after',
      type: 'filter',
      config: {
        type: 'filter',
        conditions: [{ field: 'value', operator: 'equals', value: 'match' }],
        logic: 'and',
      } as FilterConfig,
    });
    const workflow = makeWorkflow([filterStep, secondStep]);
    // trigger.value = 'match', but filter expects 'no-match' → condition fails
    const executor = new WorkflowExecutor(workflow, { value: 'match' });
    const state = await executor.execute();

    // Execution completes successfully (filter break is normal control flow)
    expect(state.status).toBe('success');
    // The filter step was executed but skipped
    const record = state.stepResults.get('filter_fail');
    expect(record).toBeDefined();
    expect(record!.status).toBe('skipped');
    // The second step should NOT have been executed
    expect(state.stepResults.has('step_after')).toBe(false);
  });

  it('marks execution as error when a filter step throws', async () => {
    // Use a formatter step and make it throw by providing bad config
    const badStep: StepConfig = makeStep({
      id: 'bad_step',
      type: 'formatter',
      config: {
        type: 'formatter',
        operation: 'text_trim',
        inputField: 'value',
        options: {},
      },
      errorHandling: {
        onError: 'halt',
        maxRetries: 0,
        retryDelayMs: 0,
        retryBackoff: 'fixed',
        routeToStepId: null,
        notifyOnError: false,
      },
    });

    // Simulate an error by overriding — we'll use a code step with mocked error
    const codeStep: StepConfig = makeStep({
      id: 'code_error',
      type: 'code',
      config: {
        type: 'code',
        language: 'javascript',
        source: 'throw new Error("deliberate")',
        timeout: 5000,
      },
      errorHandling: {
        onError: 'halt',
        maxRetries: 0,
        retryDelayMs: 0,
        retryBackoff: 'fixed',
        routeToStepId: null,
        notifyOnError: false,
      },
    });

    // Make executeCode throw
    const { executeCode } = await import('@/lib/engine/steps/code');
    vi.mocked(executeCode).mockRejectedValueOnce(new Error('deliberate error'));

    const workflow = makeWorkflow([codeStep]);
    const executor = new WorkflowExecutor(workflow, {});
    const state = await executor.execute();

    expect(state.status).toBe('error');
    expect(state.error).toBe('deliberate error');
    const record = state.stepResults.get('code_error');
    expect(record).toBeDefined();
    expect(record!.status).toBe('error');
    expect(record!.error).toBe('deliberate error');
  });

  it('continues to next step when error handling is set to continue', async () => {
    const { executeCode } = await import('@/lib/engine/steps/code');
    vi.mocked(executeCode).mockRejectedValueOnce(new Error('transient error'));

    const errorStep: StepConfig = makeStep({
      id: 'failing_step',
      type: 'code',
      config: {
        type: 'code',
        language: 'javascript',
        source: 'throw new Error("transient")',
        timeout: 5000,
      },
      errorHandling: {
        onError: 'continue',
        maxRetries: 0,
        retryDelayMs: 0,
        retryBackoff: 'fixed',
        routeToStepId: null,
        notifyOnError: false,
      },
    });

    const passingFilter = makeFilterStep('filter_after_error', true);
    const workflow = makeWorkflow([errorStep, passingFilter]);
    const executor = new WorkflowExecutor(workflow, { value: 'match' }); // value='match' → passes
    const state = await executor.execute();

    // Should still succeed overall and run the second step
    expect(state.status).toBe('success');
    expect(state.stepResults.has('filter_after_error')).toBe(true);
  });

  it('executes zero steps for a workflow with no steps', async () => {
    const workflow = makeWorkflow([]);
    const executor = new WorkflowExecutor(workflow, {});
    const state = await executor.execute();

    expect(state.status).toBe('success');
    expect(state.stepsExecuted).toBe(0);
    expect(state.stepResults.size).toBe(0);
  });

  it('calls onStepStart and onStepComplete callbacks', async () => {
    const onStepStart = vi.fn(async () => {});
    const onStepComplete = vi.fn(async () => {});

    const filterStep = makeFilterStep('filter_cb', true);
    const workflow = makeWorkflow([filterStep]);
    const executor = new WorkflowExecutor(
      workflow,
      { value: 'match' },
      { onStepStart, onStepComplete }
    );
    await executor.execute();

    expect(onStepStart).toHaveBeenCalledOnce();
    expect(onStepComplete).toHaveBeenCalledOnce();
  });

  it('calls onExecutionComplete callback when done', async () => {
    const onExecutionComplete = vi.fn(async () => {});
    const workflow = makeWorkflow([makeFilterStep('f', true)]);
    const executor = new WorkflowExecutor(
      workflow,
      { value: 'match' },
      { onExecutionComplete }
    );
    await executor.execute();

    expect(onExecutionComplete).toHaveBeenCalledOnce();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = (onExecutionComplete.mock.calls as any)[0][0];
    expect(state.status).toBe('success');
  });

  it('toJSON returns a serializable execution record', async () => {
    const workflow = makeWorkflow([makeFilterStep('f', true)]);
    const executor = new WorkflowExecutor(workflow, { value: 'match' });
    await executor.execute();

    const json = executor.toJSON();
    expect(json.workflowId).toBe('wf_test_001');
    expect(json.status).toBe('success');
    expect(typeof json.startedAt).toBe('string');
    expect(json.steps).toBeDefined();
  });
});
