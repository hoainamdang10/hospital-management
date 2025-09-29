/**
 * Command Base Classes - CQRS Pattern
 * Base classes for implementing command side of CQRS
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, DDD, HIPAA
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Base interface for all commands
 */
export interface ICommand {
  readonly commandId: string;
  readonly commandType: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Abstract base class for all commands
 */
export abstract class Command implements ICommand {
  public readonly commandId: string;
  public readonly commandType: string;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly correlationId?: string;
  public readonly metadata?: Record<string, any>;

  protected constructor(
    commandType: string,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ) {
    this.commandId = uuidv4();
    this.commandType = commandType;
    this.timestamp = new Date();
    this.userId = userId;
    this.correlationId = correlationId;
    this.metadata = metadata;
  }

  /**
   * Validate command data
   */
  public abstract validate(): Promise<ValidationResult>;

  /**
   * Get command payload for serialization
   */
  public abstract getPayload(): any;

  /**
   * Check if command contains PHI (Protected Health Information)
   */
  public abstract containsPHI(): boolean;

  /**
   * Get patient ID if command is related to patient data
   */
  public abstract getPatientId(): string | null;

  /**
   * Get command description for audit logs
   */
  public abstract getDescription(): string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Command handler interface
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

/**
 * Command result interface
 */
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for command handlers
 */
export abstract class CommandHandler<TCommand extends ICommand, TResult = void> 
  implements ICommandHandler<TCommand, TResult> {
  
  /**
   * Handle the command
   */
  public async handle(command: TCommand): Promise<TResult> {
    // Validate command
    const validationResult = await command.validate();
    if (!validationResult.isValid) {
      throw new CommandValidationError(
        `Command validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
        validationResult.errors
      );
    }

    // Log command execution for audit
    await this.logCommandExecution(command);

    // Execute command
    try {
      const result = await this.executeCommand(command);
      
      // Log successful execution
      await this.logCommandSuccess(command, result);
      
      return result;
    } catch (error) {
      // Log command failure
      await this.logCommandFailure(command, error);
      throw error;
    }
  }

  /**
   * Execute the actual command logic
   */
  protected abstract executeCommand(command: TCommand): Promise<TResult>;

  /**
   * Log command execution for audit trail
   */
  protected async logCommandExecution(command: TCommand): Promise<void> {
    // Implementation would log to audit system
    console.log(`Executing command: ${command.commandType}`, {
      commandId: command.commandId,
      userId: command.userId,
      timestamp: command.timestamp,
      containsPHI: command.containsPHI(),
      patientId: command.getPatientId(),
    });
  }

  /**
   * Log successful command execution
   */
  protected async logCommandSuccess(command: TCommand, result: TResult): Promise<void> {
    console.log(`Command executed successfully: ${command.commandType}`, {
      commandId: command.commandId,
      userId: command.userId,
    });
  }

  /**
   * Log command execution failure
   */
  protected async logCommandFailure(command: TCommand, error: any): Promise<void> {
    console.error(`Command execution failed: ${command.commandType}`, {
      commandId: command.commandId,
      userId: command.userId,
      error: error.message,
    });
  }
}

/**
 * Command validation error
 */
export class CommandValidationError extends Error {
  public readonly validationErrors: ValidationError[];

  constructor(message: string, validationErrors: ValidationError[]) {
    super(message);
    this.name = 'CommandValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Command execution error
 */
export class CommandExecutionError extends Error {
  public readonly commandId: string;
  public readonly commandType: string;

  constructor(message: string, commandId: string, commandType: string) {
    super(message);
    this.name = 'CommandExecutionError';
    this.commandId = commandId;
    this.commandType = commandType;
  }
}

/**
 * Command bus interface
 */
export interface ICommandBus {
  send<TResult = void>(command: ICommand): Promise<TResult>;
  register<TCommand extends ICommand, TResult = void>(
    commandType: string,
    handler: ICommandHandler<TCommand, TResult>
  ): void;
}

/**
 * Simple in-memory command bus implementation
 */
export class CommandBus implements ICommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>();

  /**
   * Send command to appropriate handler
   */
  public async send<TResult = void>(command: ICommand): Promise<TResult> {
    const handler = this.handlers.get(command.commandType);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${command.commandType}`);
    }

    return await handler.handle(command);
  }

  /**
   * Register command handler
   */
  public register<TCommand extends ICommand, TResult = void>(
    commandType: string,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler already registered for command type: ${commandType}`);
    }

    this.handlers.set(commandType, handler);
  }

  /**
   * Get registered handler types
   */
  public getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if handler is registered
   */
  public hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }
}
