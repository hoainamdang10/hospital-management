/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express } from 'express';

export function setupRoutes(app: Express): void {
  // Setup API routes
  app.get('/api/sample', (_req, res) => {
    res.json({
      message: 'Patient Registry Service API',
      features: ['Patient Registration','Demographics','Contact Management','Insurance Info'],
      patterns: ['Repository','Domain Events','CQRS']
    });
  });
}
