import { ValueObject } from '@shared/domain/base/value-object';
import { Request } from 'express';

/**
 * Path rewrite configuration
 * Supports both static rules and dynamic function
 */
export interface PathRewriteRules {
  /**
   * Static rewrite rules: pattern -> replacement
   * Example: { '^/api/v2': '/api/v1' }
   */
  rules?: Record<string, string>;
  
  /**
   * Custom rewrite function for complex logic
   * Return undefined to skip rewriting
   */
  rewriteFn?: (path: string, req: Request) => string | undefined;
  
  /**
   * Strip the pathPrefix from the request before forwarding
   * Example: /api/v1/appointments/123 -> /123 (if pathPrefix is /api/v1/appointments)
   */
  stripPrefix?: boolean;
}

export interface ServiceRouteProps {
  serviceName: string;
  baseUrl: string;
  pathPrefix: string;
  requiresAuth: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  pathRewrite?: PathRewriteRules;
}

export class ServiceRoute extends ValueObject<ServiceRouteProps> {
  private constructor(props: ServiceRouteProps) {
    super(props);
  }

  protected validateFormat(): void {
    if (!this.props.serviceName || this.props.serviceName.trim().length === 0) {
      throw new Error('Service name cannot be empty');
    }

    if (!this.props.baseUrl || this.props.baseUrl.trim().length === 0) {
      throw new Error('Base URL cannot be empty');
    }

    if (!this.props.pathPrefix || this.props.pathPrefix.trim().length === 0) {
      throw new Error('Path prefix cannot be empty');
    }

    if (!this.props.pathPrefix.startsWith('/')) {
      throw new Error('Path prefix must start with /');
    }

    try {
      new URL(this.props.baseUrl);
    } catch {
      throw new Error('Invalid base URL format');
    }
  }

  public static create(props: ServiceRouteProps): ServiceRoute {
    return new ServiceRoute({
      serviceName: props.serviceName.trim(),
      baseUrl: props.baseUrl.trim(),
      pathPrefix: props.pathPrefix.trim(),
      requiresAuth: props.requiresAuth,
      requiredPermissions: props.requiredPermissions,
      requiredRoles: props.requiredRoles
    });
  }

  public get serviceName(): string {
    return this.props.serviceName;
  }

  public get baseUrl(): string {
    return this.props.baseUrl;
  }

  public get pathPrefix(): string {
    return this.props.pathPrefix;
  }

  public get requiresAuth(): boolean {
    return this.props.requiresAuth;
  }

  public get requiredPermissions(): string[] | undefined {
    return this.props.requiredPermissions;
  }

  public get requiredRoles(): string[] | undefined {
    return this.props.requiredRoles;
  }

  public get pathRewrite(): PathRewriteRules | undefined {
    return this.props.pathRewrite;
  }

  /**
   * Check if this route matches the given path
   * More specific routes (longer prefixes) should be checked first
   */
  public matchesPath(path: string): boolean {
    return path.startsWith(this.props.pathPrefix);
  }

  /**
   * Get the specificity score for route sorting
   * Higher score = more specific route (should match first)
   */
  public getSpecificity(): number {
    // Longer prefix = more specific
    let score = this.props.pathPrefix.length;
    
    // Count path segments for additional specificity
    const segments = this.props.pathPrefix.split('/').filter(s => s.length > 0);
    score += segments.length * 10;
    
    // Routes with params are less specific
    if (this.props.pathPrefix.includes(':')) {
      score -= 5;
    }
    
    return score;
  }

  /**
   * Rewrite the request path according to configured rules
   */
  public rewritePath(originalPath: string, req?: Request): string {
    let path = originalPath;
    
    if (!this.props.pathRewrite) {
      return path;
    }
    
    // Apply static rewrite rules
    if (this.props.pathRewrite.rules) {
      for (const [pattern, replacement] of Object.entries(this.props.pathRewrite.rules)) {
        const regex = new RegExp(pattern);
        path = path.replace(regex, replacement);
      }
    }
    
    // Apply custom rewrite function
    if (this.props.pathRewrite.rewriteFn && req) {
      const rewritten = this.props.pathRewrite.rewriteFn(path, req);
      if (rewritten !== undefined) {
        path = rewritten;
      }
    }
    
    // Strip prefix if configured
    if (this.props.pathRewrite.stripPrefix && path.startsWith(this.props.pathPrefix)) {
      path = path.substring(this.props.pathPrefix.length) || '/';
    }
    
    return path;
  }

  /**
   * Get the full target URL for proxying
   */
  public getTargetUrl(originalPath: string, req?: Request): string {
    const rewrittenPath = this.rewritePath(originalPath, req);
    
    // Ensure path starts with /
    const normalizedPath = rewrittenPath.startsWith('/') ? rewrittenPath : `/${rewrittenPath}`;
    
    // Combine base URL with rewritten path
    return `${this.props.baseUrl}${normalizedPath}`;
  }

  /**
   * Convert to plain object for debugging
   */
  public toJSON() {
    return {
      serviceName: this.props.serviceName,
      baseUrl: this.props.baseUrl,
      pathPrefix: this.props.pathPrefix,
      requiresAuth: this.props.requiresAuth,
      requiredPermissions: this.props.requiredPermissions,
      requiredRoles: this.props.requiredRoles,
      hasPathRewrite: !!this.props.pathRewrite,
      specificity: this.getSpecificity()
    };
  }
}

