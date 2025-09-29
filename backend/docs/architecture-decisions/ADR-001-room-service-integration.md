# ADR-001: Room Service Integration with Department Service

## Status
**ACCEPTED** - Implemented on 2025-01-03

## Context
We needed to decide whether Room Management should be:
1. A separate microservice (room-service)
2. Integrated into the existing department-service

## Decision
**Room Management is integrated into Department Service**

## Rationale

### ✅ Advantages of Integration:
1. **High Cohesion**: Rooms belong to departments - natural business relationship
2. **Data Consistency**: Room-Department relationship maintained within single service
3. **Reduced Complexity**: Fewer services to deploy, monitor, and maintain
4. **No Network Overhead**: No inter-service calls for room-department operations
5. **Already Implemented**: Full room management already exists in department-service
6. **Port Management**: Fewer port conflicts and service registry complexity

### ❌ Disadvantages of Separation:
1. **Code Duplication**: Would require rewriting existing room logic
2. **Network Calls**: Additional latency for room-department operations
3. **Data Consistency**: Harder to maintain referential integrity across services
4. **Deployment Complexity**: More services to manage and monitor
5. **Port Conflicts**: Additional port management overhead

## Implementation Details

### Service Ports (Fixed):
- **Department Service**: 3005 (includes room management)
- **Prescription Service**: 3007 (fixed from 3009)
- **Room Service**: REMOVED (functionality in department-service)

### API Endpoints:
- Departments: `GET /api/departments`
- Rooms: `GET /api/rooms` (handled by department-service)
- Specialties: `GET /api/specialties` (handled by department-service)

### Service Registry Updates:
- Removed room-service registration
- Updated department-service to port 3005
- Updated prescription-service to port 3007

## Consequences

### Positive:
- ✅ Simplified architecture
- ✅ Better data consistency
- ✅ Reduced deployment complexity
- ✅ Fixed port conflicts

### Negative:
- ⚠️ Department service has more responsibilities
- ⚠️ Potential for larger service size

## Monitoring
- Monitor department-service performance for room operations
- Track room-related API response times
- Ensure room management doesn't impact department operations

## Future Considerations
If room management becomes complex enough to warrant separation:
1. Evaluate service size and performance
2. Consider domain complexity growth
3. Re-assess based on team structure and ownership

---
**Author**: Hospital Management System Team  
**Date**: 2025-01-03  
**Reviewers**: Architecture Team
