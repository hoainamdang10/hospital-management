import { ApolloServerPlugin } from "@apollo/server";
import logger from "@hospital/shared/dist/utils/logger";
import { GraphQLContext, UserRole } from "../context";

/**
 * Authentication middleware for GraphQL
 * Handles JWT token validation and role-based access control
 */
export const authMiddleware: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext) {
        const { request } = requestContext;
        const context = requestContext.contextValue;

        // Skip authentication for introspection queries
        if (request.operationName === "IntrospectionQuery") {
          return;
        }

        // Get operation info
        const operation = requestContext.document?.definitions[0];
        if (!operation || operation.kind !== "OperationDefinition") {
          return;
        }

        const operationType = operation.operation;
        const operationName = operation.name?.value || "Anonymous";

        // Log the operation
        logger.debug("GraphQL Operation:", {
          type: operationType,
          name: operationName,
          userId: context.user?.id,
          role: context.user?.role,
          requestId: context.requestId,
        });

        // Check if operation requires authentication
        if (requiresAuthentication(operationName, operationType)) {
          if (!context.user) {
            // Allow health and systemInfo queries without authentication for testing
            if (
              operationName === "health" ||
              operationName === "systemInfo" ||
              operationName.toLowerCase().includes("health") ||
              operationName.toLowerCase().includes("systeminfo")
            ) {
              logger.debug(
                "Allowing public health/systemInfo query without authentication"
              );
              return;
            }
            throw new Error("Yêu cầu xác thực để truy cập tài nguyên này");
          }
        }

        // Check role-based permissions
        const requiredRoles = getRequiredRoles(operationName, operationType);
        if (requiredRoles.length > 0) {
          if (!context.user) {
            throw new Error("Yêu cầu xác thực để truy cập tài nguyên này");
          }

          if (!requiredRoles.includes(context.user.role)) {
            throw new Error("Không có quyền thực hiện hành động này");
          }
        }
      },

      async willSendResponse(requestContext) {
        const context = requestContext.contextValue;
        const { response } = requestContext;

        // Add authentication headers to response
        if (context.user && response?.http) {
          response.http.headers.set("X-User-ID", context.user.id);
          response.http.headers.set("X-User-Role", context.user.role);
        }
      },
    };
  },
};

/**
 * Check if operation requires authentication
 */
function requiresAuthentication(
  operationName: string,
  operationType: string
): boolean {
  // Public operations that don't require authentication
  const publicOperations = [
    "health",
    "systemInfo",
    "departments", // Public department list
    "searchDoctors", // Public doctor search
    "doctorAvailability", // Public availability check
  ];

  // All mutations require authentication
  if (operationType === "mutation") {
    return true;
  }

  // All subscriptions require authentication
  if (operationType === "subscription") {
    return true;
  }

  // For anonymous queries, we need to check the actual query content
  // This is a temporary fix - ideally all queries should have proper names
  if (operationName === "Anonymous") {
    // Allow anonymous queries for now, let individual resolvers handle auth
    return false;
  }

  // Check if it's a public query
  return !publicOperations.some((op) =>
    operationName.toLowerCase().includes(op.toLowerCase())
  );
}

/**
 * Get required roles for operation
 */
function getRequiredRoles(
  operationName: string,
  operationType: string
): UserRole[] {
  // Admin-only operations
  const adminOperations = [
    "createDoctor",
    "updateDoctor",
    "deleteDoctor",
    "createDepartment",
    "updateDepartment",
    "deleteDepartment",
    "systemInfo",
  ];

  // Doctor-only operations
  const doctorOperations = [
    "doctorStats",
    "doctorSchedule",
    "updateDoctorSchedule",
    "startAppointment",
    "completeAppointment",
    "createMedicalRecord",
    "updateMedicalRecord",
  ];

  // Patient-only operations
  const patientOperations = [
    "createAppointment",
    "updatePatient",
    "patientMedicalRecords",
    "patientPrescriptions",
  ];

  // Receptionist-only operations
  const receptionistOperations = [
    "manageAppointments",
    "patientCheckIn",
    "manageQueue",
    "basicReports",
    "updatePatientInfo",
  ];

  // Doctor or Admin operations
  const doctorAdminOperations = [
    "doctorAppointments",
    "doctorPatients",
    "appointmentsByDoctor",
  ];

  // Patient or Doctor operations (for viewing patient data)
  const patientDoctorOperations = [
    "patient",
    "patientStats",
    "patientAppointmentHistory",
  ];

  // Check admin operations
  if (adminOperations.some((op) => operationName.includes(op))) {
    return [UserRole.ADMIN];
  }

  // Check doctor operations
  if (doctorOperations.some((op) => operationName.includes(op))) {
    return [UserRole.DOCTOR];
  }

  // Check patient operations
  if (patientOperations.some((op) => operationName.includes(op))) {
    return [UserRole.PATIENT];
  }

  // Check receptionist operations
  if (receptionistOperations.some((op) => operationName.includes(op))) {
    return [UserRole.RECEPTIONIST];
  }

  // Check doctor or admin operations
  if (doctorAdminOperations.some((op) => operationName.includes(op))) {
    return [UserRole.DOCTOR, UserRole.ADMIN];
  }

  // Check patient or doctor operations
  if (patientDoctorOperations.some((op) => operationName.includes(op))) {
    return [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN];
  }

  // No specific role required
  return [];
}

/**
 * Field-level authorization directive
 */
export function requireAuth(roles?: UserRole[]) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (
      parent: any,
      args: any,
      context: GraphQLContext,
      info: any
    ) {
      // Check authentication
      if (!context.user) {
        throw new Error("Yêu cầu xác thực để truy cập trường này");
      }

      // Check roles if specified
      if (roles && roles.length > 0) {
        if (!roles.includes(context.user.role)) {
          throw new Error("Không có quyền truy cập trường này");
        }
      }

      return originalMethod.call(this, parent, args, context, info);
    };

    return descriptor;
  };
}

/**
 * Resource ownership check
 */
export function requireOwnership(
  getResourceUserId: (parent: any, args: any) => string
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (
      parent: any,
      args: any,
      context: GraphQLContext,
      info: any
    ) {
      // Check authentication
      if (!context.user) {
        throw new Error("Yêu cầu xác thực để truy cập tài nguyên này");
      }

      // Admin can access everything
      if (context.user.role === UserRole.ADMIN) {
        return originalMethod.call(this, parent, args, context, info);
      }

      // Check ownership
      const resourceUserId = getResourceUserId(parent, args);
      if (context.user.id !== resourceUserId) {
        // For doctors, check if they can access patient data
        if (context.user.role === UserRole.DOCTOR) {
          // TODO: Implement doctor-patient relationship check
          // For now, allow doctors to access patient data
          return originalMethod.call(this, parent, args, context, info);
        }

        throw new Error("Không có quyền truy cập tài nguyên này");
      }

      return originalMethod.call(this, parent, args, context, info);
    };

    return descriptor;
  };
}

/**
 * Permission-based authorization
 */
export function requirePermission(permission: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (
      parent: any,
      args: any,
      context: GraphQLContext,
      info: any
    ) {
      // Check authentication
      if (!context.user) {
        throw new Error("Yêu cầu xác thực để truy cập tài nguyên này");
      }

      // Admin has all permissions
      if (context.user.role === UserRole.ADMIN) {
        return originalMethod.call(this, parent, args, context, info);
      }

      // Check permission
      if (!context.user.permissions.includes(permission)) {
        throw new Error(`Không có quyền: ${permission}`);
      }

      return originalMethod.call(this, parent, args, context, info);
    };

    return descriptor;
  };
}

export default authMiddleware;
