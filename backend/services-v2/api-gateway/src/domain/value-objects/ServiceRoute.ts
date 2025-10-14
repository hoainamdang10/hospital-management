import { ValueObject } from '@shared/domain/base/value-object';

export interface ServiceRouteProps {
  serviceName: string;
  baseUrl: string;
  pathPrefix: string;
  requiresAuth: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
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

  public matchesPath(path: string): boolean {
    return path.startsWith(this.props.pathPrefix);
  }

  public getTargetUrl(originalPath: string): string {
    const relativePath = originalPath.substring(this.props.pathPrefix.length);
    return `${this.props.baseUrl}${relativePath}`;
  }
}

