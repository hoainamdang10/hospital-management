/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';
import { DIContainer } from '@shared/infrastructure/di/container';

export function setupRoutes(app: Express, _container: DIContainer): void {
  // Setup API routes
  app.get('/api/sample', (_req, res) => {
    res.json({
      message: 'Notifications Service API',
      features: ["Email","SMS","Push Notifications","Templates"],
      patterns: ["Observer","Template Method","Circuit Breaker"]
    });
  });
}
