/**
 * WithMetrics Decorator - Use Case Instrumentation
 * Wraps use case execution to record Prometheus metrics
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability
 */

import { prometheusMetrics } from '../../infrastructure/monitoring/PrometheusMetrics';
import { ILogger } from '../services/ILogger';

/**
 * Decorator function to wrap use case execute method with metrics
 * 
 * Usage:
 * ```typescript
 * const useCaseWithMetrics = withMetrics(
 *   useCase,
 *   'CreateUserUseCase',
 *   logger
 * );
 * ```
 */
const METRICS_INSTRUMENTED = Symbol('metricsInstrumented');

export function withMetrics<TRequest, TResponse>(
  useCase: { execute(request: TRequest): Promise<TResponse> },
  useCaseName: string,
  logger: ILogger
): { execute(request: TRequest): Promise<TResponse> } {
  const wrapped = instrumentUseCaseWithMetrics(useCase, useCaseName, logger);
  return {
    execute: wrapped.execute.bind(wrapped)
  };
}

export function instrumentUseCaseWithMetrics<
  TRequest,
  TResponse,
  TUseCase extends { execute(request: TRequest): Promise<TResponse> }
>(
  useCase: TUseCase,
  useCaseName: string,
  logger: ILogger
): TUseCase {
  const anyUseCase = useCase as any;
  if (anyUseCase[METRICS_INSTRUMENTED]) {
    return useCase;
  }

  const originalExecute = useCase.execute.bind(useCase);

  anyUseCase.execute = async (request: TRequest): Promise<TResponse> => {
    const startTime = Date.now();
    let status: 'success' | 'failed' = 'failed';

    try {
      const result = await originalExecute(request);
      status = 'success';
      return result;
    } catch (error) {
      status = 'failed';
      throw error;
    } finally {
      try {
        const duration = Date.now() - startTime;
        const durationSeconds = duration / 1000;

        prometheusMetrics.recordUseCaseDuration(
          useCaseName,
          status,
          durationSeconds
        );

        if (durationSeconds > 2) {
          logger.warn('Slow use case execution detected', {
            useCase: useCaseName,
            status,
            duration: `${duration}ms`,
            durationSeconds
          });
        }
      } catch (metricsError) {
        logger.error('Failed to record use case metrics', {
          useCase: useCaseName,
          error: metricsError instanceof Error ? metricsError.message : 'Unknown error'
        });
      }
    }
  };

  anyUseCase[METRICS_INSTRUMENTED] = true;
  return useCase;
}

/**
 * Helper function to wrap multiple use cases with metrics
 * 
 * Usage:
 * ```typescript
 * const wrappedUseCases = wrapUseCasesWithMetrics({
 *   createUser: createUserUseCase,
 *   updateUser: updateUserUseCase
 * }, logger);
 * ```
 */
export function wrapUseCasesWithMetrics<T extends Record<string, any>>(
  useCases: T,
  logger: ILogger
): T {
  const wrapped: any = {};

  for (const [name, useCase] of Object.entries(useCases)) {
    if (useCase && typeof useCase.execute === 'function') {
      wrapped[name] = withMetrics(useCase, name, logger);
    } else {
      wrapped[name] = useCase;
    }
  }

  return wrapped as T;
}
