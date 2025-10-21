import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  correlationId?: string;
  tenantId?: string;
  scheduleId?: string;
  runId?: string;
  workerId?: string;
  userId?: string;
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private defaultContext: LogContext = {};

  private constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const nodeEnv = process.env.NODE_ENV || 'development';

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'scheduler-service',
        environment: nodeEnv,
        version: '1.0.0'
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: nodeEnv === 'development'
            ? winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              )
            : winston.format.json()
        })
      ]
    });

    // Add file transport in production
    if (nodeEnv === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        })
      );

      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10
        })
      );
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  public generateCorrelationId(): string {
    return uuidv4();
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        }
      : context;

    this.log(LogLevel.ERROR, message, errorContext);
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const mergedContext = {
      ...this.defaultContext,
      ...context,
      timestamp: new Date().toISOString()
    };

    this.logger.log(level, message, mergedContext);
  }

  // Structured logging helpers
  public logWorkerPoll(workerId: string, duration: number, runsAcquired: number, context?: LogContext): void {
    this.info('Worker poll completed', {
      ...context,
      workerId,
      duration,
      runsAcquired,
      event: 'worker.poll.completed'
    });
  }

  public logWorkerRunStart(workerId: string, runId: string, scheduleId: string, context?: LogContext): void {
    this.info('Worker run started', {
      ...context,
      workerId,
      runId,
      scheduleId,
      event: 'worker.run.started'
    });
  }

  public logWorkerRunComplete(
    workerId: string,
    runId: string,
    scheduleId: string,
    duration: number,
    status: string,
    context?: LogContext
  ): void {
    this.info('Worker run completed', {
      ...context,
      workerId,
      runId,
      scheduleId,
      duration,
      status,
      event: 'worker.run.completed'
    });
  }

  public logWorkerRunFailed(
    workerId: string,
    runId: string,
    scheduleId: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error('Worker run failed', error, {
      ...context,
      workerId,
      runId,
      scheduleId,
      event: 'worker.run.failed'
    });
  }

  public logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info('API request completed', {
      ...context,
      method,
      path,
      statusCode,
      duration,
      event: 'api.request.completed'
    });
  }

  public logApiError(
    method: string,
    path: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error('API request failed', error, {
      ...context,
      method,
      path,
      event: 'api.request.failed'
    });
  }

  public logDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext
  ): void {
    this.debug('Database query executed', {
      ...context,
      operation,
      table,
      duration,
      event: 'database.query.executed'
    });
  }

  public logDatabaseError(
    operation: string,
    table: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error('Database query failed', error, {
      ...context,
      operation,
      table,
      event: 'database.query.failed'
    });
  }

  public logCleanupOperation(
    operationType: string,
    deletedCount: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info('Cleanup operation completed', {
      ...context,
      operationType,
      deletedCount,
      duration,
      event: 'cleanup.operation.completed'
    });
  }

  public logMaterialization(
    schedulesProcessed: number,
    runsCreated: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info('Materialization cycle completed', {
      ...context,
      schedulesProcessed,
      runsCreated,
      duration,
      event: 'materialization.cycle.completed'
    });
  }
}

