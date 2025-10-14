export interface LogMetadata {
  [key: string]: unknown;
}

export interface ILogger {
  info(message: string, metadata?: LogMetadata): void;
  
  warn(message: string, metadata?: LogMetadata): void;
  
  error(message: string, metadata?: LogMetadata): void;
  
  debug(message: string, metadata?: LogMetadata): void;
}

