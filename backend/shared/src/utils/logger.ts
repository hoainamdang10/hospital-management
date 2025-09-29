import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different formats for different environments
const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  errors({ stack: true }),
  simple()
);

const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }) as any,
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    }) as any
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }) as any,
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }) as any,
  ],
});

// Create a stream object for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logWithContext = (level: string, message: string, context: any = {}) => {
  logger.log(level, message, {
    service: process.env.SERVICE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
    ...context,
  });
};

export const logError = (error: Error, context: any = {}) => {
  logger.error(error.message, {
    service: process.env.SERVICE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
    stack: error.stack,
    ...context,
  });
};

export const logRequest = (req: any, res: any, responseTime: number) => {
  logger.http('HTTP Request', {
    service: process.env.SERVICE_NAME || 'unknown',
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

export const logEvent = (eventType: string, data: any = {}) => {
  logger.info('Event', {
    service: process.env.SERVICE_NAME || 'unknown',
    eventType,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

export const logMetric = (metricName: string, value: number, tags: any = {}) => {
  logger.info('Metric', {
    service: process.env.SERVICE_NAME || 'unknown',
    metricName,
    value,
    timestamp: new Date().toISOString(),
    ...tags,
  });
};

export default logger;
