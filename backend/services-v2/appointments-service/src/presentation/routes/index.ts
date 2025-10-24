/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';
import { DIContainer } from '@shared/infrastructure/di/container';
import { createAvailabilityRoutes } from './availability.routes';

export function setupRoutes(app: Express, container: DIContainer): void {
  // Setup API routes
  app.get('/api/sample', (req, res) => {
    res.json({
      message: 'Scheduling Service API',
      features: ["Appointments","Slots","Availability","Queue Management"],
      patterns: ["Command","Event-Driven","Workflow"]
    });
  });

  // Availability routes
  app.use('/api/appointments', createAvailabilityRoutes());
}
