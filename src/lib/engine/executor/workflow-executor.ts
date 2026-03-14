// ─── FlowForge Workflow Executor ────────────────────────────────────────────
// The heart of FlowForge. Executes workflows step-by-step with:
// - Data mapping between steps
// - Error handling (retry, skip, halt, route)
// - Filter evaluation (skip downstream on false)
// - Path branching (evaluate conditions, pick branch)
// - Loop iteration
// - Delay execution
// - Full execution trace logging

import type {
  WorkflowDefinition,
  StepConfig,
  StepType,
  ExecutionStatus,
  StepExecutionStatus,
  FilterConfig,
  PathConfig,
  DelayConfig,
  LoopConfig,
  FormatterConfig,
  CodeConfig,
  HttpConfig,
  ActionConfig,
  AiConfig,
  StorageConfig,
  DigestConfig,
  SubWorkflowConfig,
  HitlConfig,
  ErrorHandlerConfig,
} from '@/types';
import {
  type ExecutionContext,
  type StepExecutionData,
  resolveInputMappings,
} from '../data-mapper';
import { executeFilter } from '../steps/filter';
import { executeFormatter } from '../steps/formatter';
import { executeDelay } from '../steps/delay';
import { executeHttp } from '../steps/http';
import { executeCode } from '../steps/code';
import { executeAi } from '../steps/ai';
import { executeStorage } from '../steps/storage';
import { executeDigest } from '../steps/digest';
import { executeSubWorkflow } from '../steps/sub-workflow';
import { executeHitl } from '../steps/hitl';
import { executeErrorHandler } from '../steps/error-handler';
import { generateId } from '@/lib/utils';
import { getConnector } from '@/lib/connectors/base';

// ─── Execution State ────────────────────────────────────────────────────────

export interface ExecutionState {
  id: string;
  workflowId: string;
  workspaceId: string;
  status: ExecutionStatus;
  triggerData: Record<string, unknown>;
  stepResults: Map<string, StepExecutionRecord>;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
  stepsExecuted: number;
}

export interface StepExecutionRecord {
  stepId: string;
  stepIndex: number;
  stepType: StepType;
  stepName: string;
  status: StepExecutionStatus;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  retryCount: number;
}

export interface ExecutionCallbacks {
  onStepStart?: (step: StepExecutionRecord) => Promise<void>;
  onStepComplete?: (step: StepExecutionRecord) => Promise<void>;
  onStepError?: (step: StepExecutionRecord, error: Error) => Promise<void>;
  onExecutionComplete?: (state: ExecutionState) => Promise<void>;
}

// ─── Workflow Executor ──────────────────────────────────────────────────────

export class WorkflowExecutor {
  private state: ExecutionState;
  private workflow: WorkflowDefinition;
  private context: ExecutionContext;
  private callbacks: ExecutionCallbacks;

  constructor(
    workflow: WorkflowDefinition,
    triggerData: Record<string, unknown>,
    callbacks: ExecutionCallbacks = {}
  ) {
    this.workflow = workflow;
    this.callbacks = callbacks;

    this.state = {
      id: generateId('exec'),
      workflowId: workflow.id,
      workspaceId: workflow.workspaceId,
      status: 'pending',
      triggerData,
      stepResults: new Map(),
      startedAt: new Date(),
      completedAt: null,
      error: null,
      stepsExecuted: 0,
    };

    this.context = {
      trigger: triggerData,
      steps: {},
      variables: Object.fromEntries(
        Object.entries(workflow.variables).map(([k, v]) => [k, v.value])
      ),
      system: {
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionId: this.state.id,
        stepIndex: 0,
        timestamp: new Date().toISOString(),
        workspaceId: workflow.workspaceId,
      },
    };
  }

  /**
   * Execute the entire workflow.
   */
  async execute(): Promise<ExecutionState> {
    this.state.status = 'running';

    try {
      // Execute steps in order (DAG traversal for branching)
      const steps = this.workflow.steps;
      await this.executeSteps(steps, 0);

      // If we got here without error, mark success
      if (this.state.status === 'running') {
        this.state.status = 'success';
      }
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.state.completedAt = new Date();
      await this.callbacks.onExecutionComplete?.(this.state);
    }

    return this.state;
  }

  /**
   * Execute a list of steps sequentially.
   */
  private async executeSteps(
    steps: StepConfig[],
    startIndex: number
  ): Promise<void> {
    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      this.context.system.stepIndex = i;

      const record = await this.executeStep(step, i);

      // Store result in context for downstream reference
      this.context.steps[step.id] = {
        input: record.inputData,
        output: record.outputData ?? {},
        status: record.status,
      };

      // Handle filter: if filter didn't pass, skip remaining steps
      if (step.type === 'filter' && record.status === 'skipped') {
        break;
      }

      // Handle path: branching already handled inside executeStep
      // The selected branch steps were executed, so we continue after the path step

      // Handle errors based on step error config
      if (record.status === 'error') {
        const errorAction = step.errorHandling?.onError ?? 'halt';
        switch (errorAction) {
          case 'halt':
            this.state.status = 'error';
            this.state.error = record.error ?? 'Step failed';
            return;
          case 'continue':
            // Continue to next step
            break;
          case 'retry':
            // Retry is handled inside executeStep
            break;
          case 'route': {
            // Route to error handler step
            const routeToStepId = step.errorHandling?.routeToStepId;
            if (routeToStepId) {
              const targetStep = this.workflow.steps.find((s) => s.id === routeToStepId);
              if (targetStep) {
                // Execute the error handler step
                const errorHandlerRecord = await this.executeStep(targetStep, i + 1);
                // Store in results
                this.context.steps[targetStep.id] = {
                  input: errorHandlerRecord.inputData,
                  output: errorHandlerRecord.outputData ?? {},
                  status: errorHandlerRecord.status,
                };
              }
            }
            break;
          }
        }
      }
    }
  }

  /**
   * Execute a single step with error handling and retry logic.
   */
  private async executeStep(
    step: StepConfig,
    index: number
  ): Promise<StepExecutionRecord> {
    const record: StepExecutionRecord = {
      stepId: step.id,
      stepIndex: index,
      stepType: step.type,
      stepName: step.name,
      status: 'running',
      inputData: {},
      outputData: null,
      error: null,
      startedAt: new Date(),
      completedAt: null,
      durationMs: null,
      retryCount: 0,
    };

    await this.callbacks.onStepStart?.(record);

    // Resolve input mappings
    try {
      record.inputData = resolveInputMappings(step.inputMapping, this.context);
    } catch (err) {
      record.inputData = {};
    }

    // Execute with retry logic
    const maxRetries = step.errorHandling?.maxRetries ?? 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      record.retryCount = attempt;

      try {
        const output = await this.executeStepByType(step, record.inputData);
        record.outputData = output;
        record.status = output.__skipped ? 'skipped' : 'success';
        record.completedAt = new Date();
        record.durationMs = record.completedAt.getTime() - record.startedAt.getTime();

        this.state.stepResults.set(step.id, record);
        this.state.stepsExecuted++;
        await this.callbacks.onStepComplete?.(record);

        return record;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If we have retries left, wait and retry
        if (attempt < maxRetries) {
          const delay = step.errorHandling?.retryDelayMs ?? 1000;
          const backoff = step.errorHandling?.retryBackoff ?? 'fixed';
          const waitMs = backoff === 'exponential'
            ? delay * Math.pow(2, attempt)
            : delay;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    // All retries exhausted
    record.status = 'error';
    record.error = lastError?.message ?? 'Unknown error';
    record.completedAt = new Date();
    record.durationMs = record.completedAt.getTime() - record.startedAt.getTime();

    this.state.stepResults.set(step.id, record);
    this.state.stepsExecuted++;
    await this.callbacks.onStepError?.(record, lastError!);

    return record;
  }

  /**
   * Dispatch step execution by type.
   */
  private async executeStepByType(
    step: StepConfig,
    inputData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const config = step.config;

    switch (step.type) {
      case 'filter': {
        const filterConfig = config as FilterConfig;
        const result = executeFilter(filterConfig, inputData);
        return {
          passed: result.passed,
          evaluations: result.evaluations,
          __skipped: !result.passed,
        };
      }

      case 'path': {
        const pathConfig = config as PathConfig;
        return this.executePath(pathConfig, inputData);
      }

      case 'delay': {
        const delayConfig = config as DelayConfig;
        const result = await executeDelay(delayConfig);
        return {
          delayedMs: result.delayedMs,
          resumeAt: result.resumeAt,
          type: result.type,
        };
      }

      case 'loop': {
        const loopConfig = config as LoopConfig;
        return this.executeLoop(loopConfig, inputData);
      }

      case 'formatter': {
        const fmtConfig = config as FormatterConfig;
        const result = executeFormatter(fmtConfig, inputData);
        return { output: result.output, operation: result.operation };
      }

      case 'code': {
        const codeConfig = config as CodeConfig;
        const result = await executeCode(codeConfig, inputData);
        if (result.output.error) {
          throw new Error(String(result.output.error));
        }
        return { ...result.output, __logs: result.logs };
      }

      case 'http': {
        const httpConfig = config as HttpConfig;
        const result = await executeHttp(httpConfig, inputData);
        if (result.statusCode >= 400) {
          throw new Error(`HTTP ${result.statusCode}: ${JSON.stringify(result.body)}`);
        }
        return {
          statusCode: result.statusCode,
          headers: result.headers,
          body: result.body,
          durationMs: result.durationMs,
        };
      }

      case 'action': {
        const actionConfig = config as ActionConfig;
        const { connectorId, actionKey, params } = actionConfig;

        // Look up the connector by ID (using slug)
        const connector = getConnector(connectorId);
        if (!connector) {
          throw new Error(`Connector '${connectorId}' not found`);
        }

        // Execute the action with empty credentials (normally would come from appConnections)
        const result = await connector.executeAction(actionKey, {}, params);

        if (!result.success) {
          throw new Error(result.error || 'Action failed');
        }

        return {
          connectorId,
          actionKey,
          success: result.success,
          data: result.data,
        };
      }

      case 'ai': {
        const aiConfig = config as AiConfig;
        const result = await executeAi(aiConfig, inputData);
        return {
          model: result.model,
          output: result.output,
          tokensUsed: result.tokensUsed,
          durationMs: result.durationMs,
        };
      }

      case 'human-in-the-loop': {
        const hitlConfig = config as HitlConfig;
        const result = await executeHitl(
          hitlConfig,
          this.workflow.workspaceId,
          this.state.id,
          step.id
        );
        // Set execution status to waiting for HITL approval
        this.state.status = 'waiting';
        return {
          status: result.status,
          approvalId: result.approvalId,
          assigneeEmail: result.assigneeEmail,
          instructions: result.instructions,
          deadline: result.deadline,
          deadlineAction: result.deadlineAction,
          escalateTo: result.escalateTo,
          fields: result.fields,
          __waiting: true,
        };
      }

      case 'sub-workflow': {
        const subConfig = config as SubWorkflowConfig;
        const result = await executeSubWorkflow(
          subConfig,
          this.context,
          this.workflow.id
        );
        return {
          targetWorkflowId: result.targetWorkflowId,
          executionId: result.executionId,
          status: result.status,
          stepsExecuted: result.stepsExecuted,
          error: result.error,
          output: result.output,
          durationMs: result.durationMs,
        };
      }

      case 'digest': {
        const digestConfig = config as DigestConfig;
        const result = await executeDigest(
          digestConfig,
          this.workflow.workspaceId,
          inputData
        );
        return {
          action: result.action,
          digestKey: result.digestKey,
          entryCount: result.entryCount,
          entries: result.entries,
        };
      }

      case 'storage': {
        const storageConfig = config as StorageConfig;
        const result = await executeStorage(
          storageConfig,
          this.workflow.workspaceId
        );
        return {
          action: result.action,
          key: result.key,
          namespace: result.namespace,
          value: result.value,
          previousValue: result.previousValue,
        };
      }

      case 'error-handler': {
        const errorConfig = config as ErrorHandlerConfig;
        const result = executeErrorHandler(errorConfig);
        return {
          action: result.action,
          maxRetries: result.maxRetries,
          retryDelayMs: result.retryDelayMs,
          retryBackoff: result.retryBackoff,
          routeToStepId: result.routeToStepId,
        };
      }

      default:
        return { __note: `Unknown step type: ${step.type}` };
    }
  }

  /**
   * Execute a Path (branching) step.
   */
  private async executePath(
    config: PathConfig,
    inputData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Evaluate each branch's conditions
    for (const branch of config.branches) {
      const filterResult = executeFilter(
        { type: 'filter', conditions: branch.conditions, logic: branch.logic },
        inputData
      );

      if (filterResult.passed) {
        // Find and execute the steps for this branch
        const branchSteps = this.workflow.steps.filter(
          (s) => branch.nextStepIds.includes(s.id)
        );

        if (branchSteps.length > 0) {
          await this.executeSteps(branchSteps, 0);
        }

        return {
          selectedBranch: branch.id,
          branchName: branch.name,
          evaluations: filterResult.evaluations,
        };
      }
    }

    // No branch matched — execute fallback if configured
    if (config.fallbackStepIds.length > 0) {
      const fallbackSteps = this.workflow.steps.filter(
        (s) => config.fallbackStepIds.includes(s.id)
      );
      await this.executeSteps(fallbackSteps, 0);

      return {
        selectedBranch: '__fallback',
        branchName: 'Fallback',
        evaluations: [],
      };
    }

    return {
      selectedBranch: null,
      branchName: 'No match — no fallback configured',
      evaluations: [],
    };
  }

  /**
   * Execute a Loop step.
   */
  private async executeLoop(
    config: LoopConfig,
    inputData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const sourceData = inputData[config.sourceField];
    if (!Array.isArray(sourceData)) {
      return { error: `Loop source '${config.sourceField}' is not an array`, iterations: 0 };
    }

    const items = sourceData.slice(0, config.maxIterations);
    const results: Record<string, unknown>[] = [];

    // Find loop body steps
    const loopSteps = this.workflow.steps.filter(
      (s) => config.loopStepIds.includes(s.id)
    );

    for (let i = 0; i < items.length; i++) {
      // Inject loop item into context
      this.context.variables.__loop_item = items[i] as string;
      this.context.variables.__loop_index = String(i);
      this.context.variables.__loop_count = String(items.length);

      // Execute loop body steps
      await this.executeSteps(loopSteps, 0);

      // Collect output from the last loop step
      const lastStep = loopSteps[loopSteps.length - 1];
      if (lastStep) {
        const lastResult = this.state.stepResults.get(lastStep.id);
        results.push(lastResult?.outputData ?? {});
      }
    }

    // Clean up loop variables
    delete this.context.variables.__loop_item;
    delete this.context.variables.__loop_index;
    delete this.context.variables.__loop_count;

    return {
      iterations: items.length,
      results,
    };
  }

  /**
   * Get the current execution state.
   */
  getState(): ExecutionState {
    return this.state;
  }

  /**
   * Get execution results as a serializable object.
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.state.id,
      workflowId: this.state.workflowId,
      workspaceId: this.state.workspaceId,
      status: this.state.status,
      triggerData: this.state.triggerData,
      stepsExecuted: this.state.stepsExecuted,
      startedAt: this.state.startedAt.toISOString(),
      completedAt: this.state.completedAt?.toISOString() ?? null,
      error: this.state.error,
      steps: Object.fromEntries(
        Array.from(this.state.stepResults.entries()).map(([id, rec]) => [
          id,
          {
            ...rec,
            startedAt: rec.startedAt.toISOString(),
            completedAt: rec.completedAt?.toISOString() ?? null,
          },
        ])
      ),
    };
  }
}
