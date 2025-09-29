/**
 * Command Handler Interface - Application Layer
 * V2 Clean Architecture + CQRS Implementation
 * Contract for command handling in CQRS pattern
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Command Pattern
 */

/**
 * Command Handler Interface
 * Defines contract for handling commands in CQRS pattern
 */
export interface ICommandHandler<TCommand, TResult> {
  /**
   * Handle the command and return result
   */
  handle(command: TCommand): Promise<TResult>;

  /**
   * Get handler name for logging/debugging
   */
  getHandlerName(): string;

  /**
   * Check if handler can handle the command
   */
  canHandle(command: any): boolean;
}

/**
 * Command Bus Interface
 * Manages command routing and execution
 */
export interface ICommandBus {
  /**
   * Send command for processing
   */
  send<TCommand, TResult>(command: TCommand): Promise<TResult>;

  /**
   * Register command handler
   */
  registerHandler<TCommand, TResult>(
    commandType: string,
    handler: ICommandHandler<TCommand, TResult>
  ): void;

  /**
   * Unregister command handler
   */
  unregisterHandler(commandType: string): void;

  /**
   * Check if handler is registered for command type
   */
  hasHandler(commandType: string): boolean;

  /**
   * Get all registered command types
   */
  getRegisteredCommandTypes(): string[];
}

/**
 * Command Processing Options
 */
export interface CommandProcessingOptions {
  /**
   * Timeout for command processing (in milliseconds)
   */
  timeout?: number;

  /**
   * Retry count for failed commands
   */
  retryCount?: number;

  /**
   * Delay between retries (in milliseconds)
   */
  retryDelay?: number;

  /**
   * Whether to process command asynchronously
   */
  async?: boolean;

  /**
   * Command priority (higher numbers = higher priority)
   */
  priority?: number;

  /**
   * Additional metadata
   */
  metadata?: { [key: string]: any };
}

/**
 * Command Processing Result
 */
export interface CommandProcessingResult<TResult> {
  /**
   * Whether the command was processed successfully
   */
  success: boolean;

  /**
   * Command processing result
   */
  result?: TResult;

  /**
   * Processing error if any
   */
  error?: Error;

  /**
   * Processing duration in milliseconds
   */
  duration: number;

  /**
   * Handler that processed the command
   */
  handlerName: string;

  /**
   * Retry count
   */
  retryCount: number;

  /**
   * Processing timestamp
   */
  processedAt: Date;

  /**
   * Command metadata
   */
  metadata?: { [key: string]: any };
}

/**
 * Command Validation Result
 */
export interface CommandValidationResult {
  /**
   * Whether the command is valid
   */
  isValid: boolean;

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings
   */
  warnings?: string[];
}

/**
 * Command Middleware Interface
 */
export interface ICommandMiddleware {
  /**
   * Execute middleware before command processing
   */
  execute<TCommand, TResult>(
    command: TCommand,
    next: (command: TCommand) => Promise<TResult>
  ): Promise<TResult>;

  /**
   * Get middleware name
   */
  getName(): string;

  /**
   * Get middleware priority (higher numbers = higher priority)
   */
  getPriority(): number;
}

/**
 * Command Bus Configuration
 */
export interface CommandBusConfiguration {
  /**
   * Default command timeout
   */
  defaultTimeout: number;

  /**
   * Default retry count
   */
  defaultRetryCount: number;

  /**
   * Default retry delay
   */
  defaultRetryDelay: number;

  /**
   * Maximum concurrent commands
   */
  maxConcurrentCommands: number;

  /**
   * Command queue size
   */
  commandQueueSize: number;

  /**
   * Enable command logging
   */
  enableLogging: boolean;

  /**
   * Enable command metrics
   */
  enableMetrics: boolean;

  /**
   * Dead letter queue configuration
   */
  deadLetterQueue: {
    enabled: boolean;
    maxSize: number;
    retentionPeriod: number; // in milliseconds
  };
}

/**
 * Command Bus Statistics
 */
export interface CommandBusStatistics {
  /**
   * Total commands processed
   */
  totalCommandsProcessed: number;

  /**
   * Total failed commands
   */
  totalFailedCommands: number;

  /**
   * Average processing time
   */
  averageProcessingTime: number;

  /**
   * Commands by type
   */
  commandsByType: { [commandType: string]: number };

  /**
   * Handlers by command type
   */
  handlersByCommandType: { [commandType: string]: string };

  /**
   * Dead letter queue size
   */
  deadLetterQueueSize: number;

  /**
   * Active commands count
   */
  activeCommandsCount: number;

  /**
   * Queue size
   */
  queueSize: number;
}
