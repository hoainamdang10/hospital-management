import { Router, Request, Response } from 'express';
import { IServiceRegistry } from '@application/services/IServiceRegistry';
import { ILogger } from '@application/services/ILogger';

/**
 * Dashboard Routes
 * Provides visual HTML dashboard for monitoring services
 */
export function createDashboardRoutes(
  serviceRegistry: IServiceRegistry,
  logger: ILogger
): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const routes = serviceRegistry.getAllRoutes();
      const healthChecks = await Promise.all(
        routes.map(async (route) => ({
          service: route.serviceName,
          healthy: await serviceRegistry.isHealthy(route.serviceName),
          url: route.baseUrl,
          pathPrefix: route.pathPrefix
        }))
      );

      const allHealthy = healthChecks.every(check => check.healthy);
      const healthyCount = healthChecks.filter(check => check.healthy).length;
      const totalCount = healthChecks.length;

      const html = generateDashboardHTML(healthChecks, allHealthy, healthyCount, totalCount);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);

    } catch (error) {
      logger.error('Dashboard error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).send('<h1>Dashboard Error</h1><p>Unable to load dashboard</p>');
    }
  });

  return router;
}

function generateDashboardHTML(
  healthChecks: Array<{ service: string; healthy: boolean; url: string; pathPrefix: string }>,
  allHealthy: boolean,
  healthyCount: number,
  totalCount: number
): string {
  const statusColor = allHealthy ? '#10b981' : '#ef4444';
  const statusText = allHealthy ? 'Tất cả dịch vụ hoạt động bình thường' : 'Một số dịch vụ gặp sự cố';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hospital Management System - Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      color: white;
      background: ${statusColor};
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }
    .service-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    .service-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .service-name {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .service-status {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .service-status.healthy { background: #10b981; }
    .service-status.unhealthy { background: #ef4444; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .service-info {
      font-size: 13px;
      color: #6b7280;
      margin-top: 8px;
    }
    .last-updated {
      text-align: center;
      color: white;
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1> Hospital Management System</h1>
      <span class="status-badge">${statusText}</span>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${healthyCount}/${totalCount}</div>
          <div class="stat-label">Dịch vụ hoạt động</div>
        </div>
      </div>
    </div>
    
    <div class="services-grid">
      ${healthChecks.map(check => `
        <div class="service-card">
          <div class="service-header">
            <div class="service-name">${formatServiceName(check.service)}</div>
            <div class="service-status ${check.healthy ? 'healthy' : 'unhealthy'}"></div>
          </div>
          <div class="service-info">
            <div><strong>Endpoint:</strong> ${check.pathPrefix}</div>
            <div><strong>URL:</strong> ${check.url}</div>
            <div><strong>Trạng thái:</strong> ${check.healthy ? ' Hoạt động' : ' Lỗi'}</div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="last-updated">
      Cập nhật lần cuối: ${new Date().toLocaleString('vi-VN')}
      <br>
      <small>Tự động làm mới sau 5 giây</small>
    </div>
  </div>
  
  <script>
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>
  `;
}

function formatServiceName(serviceName: string): string {
  const names: Record<string, string> = {
    'identity-service': '🔐 Identity Service',
    'patient-registry-service': ' Patient Registry',
    'provider-staff-service': '👨‍⚕ Provider/Staff',
    'appointments-service': '📅 Appointments',
    'clinical-emr-service': ' Clinical EMR',
    'billing-service': '💰 Billing',
    'notifications-service': ' Notifications',
    'scheduler-service': '⏰ Scheduler'
  };
  return names[serviceName] || serviceName;
}

