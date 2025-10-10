export type ServiceKey =
  | "identity"
  | "patient"
  | "provider"
  | "scheduling"
  | "clinical"
  | "billing"
  | "notifications";

export type ServiceEndpoint = {
  key: ServiceKey;
  basePath: string;
};

export const serviceEndpoints: Record<ServiceKey, ServiceEndpoint> = {
  identity: { key: "identity", basePath: "/api/v1/identity" },
  patient: { key: "patient", basePath: "/api/v1/patient" },
  provider: { key: "provider", basePath: "/api/v1/provider" },
  scheduling: { key: "scheduling", basePath: "/api/v1/scheduling" },
  clinical: { key: "clinical", basePath: "/api/v1/clinical" },
  billing: { key: "billing", basePath: "/api/v1/billing" },
  notifications: { key: "notifications", basePath: "/api/v1/notifications" },
};

export const getServiceEndpoint = (service: ServiceKey) => serviceEndpoints[service];
