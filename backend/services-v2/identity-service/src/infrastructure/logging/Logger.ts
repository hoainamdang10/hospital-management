/**
 * Logger Module
 * Centralized logging for the Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger, LogMetadata } from '../../application/services/ILogger';

export const logger: ILogger = {
  debug: (message: string, meta?: LogMetadata) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  info: (message: string, meta?: LogMetadata) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  warn: (message: string, meta?: LogMetadata) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, meta?: LogMetadata) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  fatal: (message: string, meta?: LogMetadata) => {
    console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, meta || '');
  }
};

