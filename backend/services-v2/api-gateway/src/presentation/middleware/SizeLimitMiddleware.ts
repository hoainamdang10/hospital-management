import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@application/services/ILogger';

export interface SizeLimitConfig {
  defaultLimit: number;
  endpointLimits: Map<string, number>;
  enableResponseSizeMonitoring: boolean;
  maxResponseSize?: number;
}

export class SizeLimitMiddleware {
  private config: SizeLimitConfig;

  constructor(
    config: Partial<SizeLimitConfig>,
    private logger: ILogger
  ) {
    this.config = {
      defaultLimit: config.defaultLimit || 1024 * 1024,
      endpointLimits: config.endpointLimits || new Map(),
      enableResponseSizeMonitoring: config.enableResponseSizeMonitoring !== false,
      maxResponseSize: config.maxResponseSize || 10 * 1024 * 1024
    };

    this.logger.info('SizeLimitMiddleware initialized', {
      defaultLimit: this.formatBytes(this.config.defaultLimit),
      endpointCount: this.config.endpointLimits.size,
      responseMonitoring: this.config.enableResponseSizeMonitoring
    });
  }

  requestSizeLimit() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.get('content-length') || '0', 10);
      const limit = this.getLimit(req.path);

      if (contentLength > limit) {
        this.logger.warn('Request size limit exceeded', {
          path: req.path,
          method: req.method,
          contentLength: this.formatBytes(contentLength),
          limit: this.formatBytes(limit),
          ip: req.ip
        });

        res.status(413).json({
          success: false,
          error: 'Request payload too large',
          errorCode: 'PAYLOAD_TOO_LARGE',
          details: {
            receivedSize: this.formatBytes(contentLength),
            maxSize: this.formatBytes(limit)
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();
    };
  }

  responseSizeMonitor() {
    if (!this.config.enableResponseSizeMonitoring) {
      return (_req: Request, _res: Response, next: NextFunction): void => {
        next();
      };
    }

    return (req: Request, res: Response, next: NextFunction): void => {
      const originalSend = res.send;
      const originalJson = res.json;

      res.send = (body: any): Response => {
        const size = Buffer.byteLength(body);
        this.monitorResponseSize(req, size);
        return originalSend.call(res, body);
      };

      res.json = (body: any): Response => {
        const size = Buffer.byteLength(JSON.stringify(body));
        this.monitorResponseSize(req, size);
        return originalJson.call(res, body);
      };

      next();
    };
  }

  private monitorResponseSize(req: Request, size: number): void {
    if (size > this.config.maxResponseSize!) {
      this.logger.warn('Large response size detected', {
        path: req.path,
        method: req.method,
        size: this.formatBytes(size),
        maxSize: this.formatBytes(this.config.maxResponseSize!),
        recommendation: 'Consider pagination or response optimization'
      });
    }

    if (size > 1024 * 1024) {
      this.logger.debug('Response size', {
        path: req.path,
        size: this.formatBytes(size)
      });
    }
  }

  private getLimit(path: string): number {
    for (const [pattern, limit] of this.config.endpointLimits.entries()) {
      if (this.matchPath(path, pattern)) {
        return limit;
      }
    }
    return this.config.defaultLimit;
  }

  private matchPath(path: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(path);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStats(): {
    defaultLimit: string;
    endpointLimits: Array<{ pattern: string; limit: string }>;
    maxResponseSize: string;
  } {
    return {
      defaultLimit: this.formatBytes(this.config.defaultLimit),
      endpointLimits: Array.from(this.config.endpointLimits.entries()).map(
        ([pattern, limit]) => ({
          pattern,
          limit: this.formatBytes(limit)
        })
      ),
      maxResponseSize: this.formatBytes(this.config.maxResponseSize!)
    };
  }
}

