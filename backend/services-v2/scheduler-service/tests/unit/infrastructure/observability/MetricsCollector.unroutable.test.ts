/**
 * Unit Tests for Unroutable Messages Metrics
 * Tests the new Prometheus metrics for tracking unroutable RabbitMQ messages
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { MetricsCollector } from '../../../../src/infrastructure/observability/MetricsCollector';

describe('MetricsCollector - Unroutable Messages Metrics', () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    // Get singleton instance
    metricsCollector = MetricsCollector.getInstance();
    // Reset metrics before each test
    metricsCollector.reset();
  });

  describe('unroutableMessagesTotal', () => {
    it('should increment counter with routing_key and exchange labels', async () => {
      // Arrange
      const routingKey = 'Command.Appointment.SendReminder';
      const exchange = 'hospital.commands';

      // Act
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey,
        exchange: exchange
      });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain('scheduler_unroutable_messages_total');
      expect(metrics).toContain(`routing_key="${routingKey}"`);
      expect(metrics).toContain(`exchange="${exchange}"`);
      expect(metrics).toContain('scheduler_unroutable_messages_total{');
      expect(metrics).toMatch(/scheduler_unroutable_messages_total\{.*\} 1/);
    });

    it('should increment counter multiple times', async () => {
      // Arrange
      const routingKey = 'Command.Notification.SendEmail';
      const exchange = 'hospital.commands';

      // Act
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey,
        exchange: exchange
      });
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey,
        exchange: exchange
      });
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey,
        exchange: exchange
      });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain('scheduler_unroutable_messages_total');
      expect(metrics).toMatch(/scheduler_unroutable_messages_total\{.*\} 3/);
    });

    it('should track different routing keys separately', async () => {
      // Arrange
      const routingKey1 = 'Command.Appointment.SendReminder';
      const routingKey2 = 'Command.Notification.SendEmail';
      const exchange = 'hospital.commands';

      // Act
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey1,
        exchange: exchange
      });
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey2,
        exchange: exchange
      });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain(`routing_key="${routingKey1}"`);
      expect(metrics).toContain(`routing_key="${routingKey2}"`);
    });

    it('should track different exchanges separately', async () => {
      // Arrange
      const routingKey = 'Command.Appointment.SendReminder';
      const exchange1 = 'hospital.commands';
      const exchange2 = 'hospital.events';

      // Act
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey,
        exchange: exchange1
      });
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: routingKey,
        exchange: exchange2
      });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain(`exchange="${exchange1}"`);
      expect(metrics).toContain(`exchange="${exchange2}"`);
    });
  });

  describe('unroutableMessagesByExchange', () => {
    it('should increment counter with exchange label only', async () => {
      // Arrange
      const exchange = 'hospital.commands';

      // Act
      metricsCollector.unroutableMessagesByExchange.inc({
        exchange: exchange
      });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain('scheduler_unroutable_messages_by_exchange_total');
      expect(metrics).toContain(`exchange="${exchange}"`);
      expect(metrics).toMatch(/scheduler_unroutable_messages_by_exchange_total\{.*\} 1/);
    });

    it('should aggregate multiple routing keys for same exchange', async () => {
      // Arrange
      const exchange = 'hospital.commands';

      // Act
      metricsCollector.unroutableMessagesByExchange.inc({ exchange });
      metricsCollector.unroutableMessagesByExchange.inc({ exchange });
      metricsCollector.unroutableMessagesByExchange.inc({ exchange });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain('scheduler_unroutable_messages_by_exchange_total');
      expect(metrics).toMatch(/scheduler_unroutable_messages_by_exchange_total\{.*\} 3/);
    });

    it('should track different exchanges separately', async () => {
      // Arrange
      const exchange1 = 'hospital.commands';
      const exchange2 = 'hospital.events';

      // Act
      metricsCollector.unroutableMessagesByExchange.inc({ exchange: exchange1 });
      metricsCollector.unroutableMessagesByExchange.inc({ exchange: exchange1 });
      metricsCollector.unroutableMessagesByExchange.inc({ exchange: exchange2 });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain(`exchange="${exchange1}"`);
      expect(metrics).toContain(`exchange="${exchange2}"`);
    });
  });

  describe('Metrics Integration', () => {
    it('should include unroutable metrics in registry', async () => {
      // Act
      const metrics = await metricsCollector.getMetrics();

      // Assert - Check metric definitions exist
      expect(metrics).toContain('# HELP scheduler_unroutable_messages_total');
      expect(metrics).toContain('# TYPE scheduler_unroutable_messages_total counter');
      expect(metrics).toContain('# HELP scheduler_unroutable_messages_by_exchange_total');
      expect(metrics).toContain('# TYPE scheduler_unroutable_messages_by_exchange_total counter');
    });

    it('should include app and version labels', async () => {
      // Arrange
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: 'test.key',
        exchange: 'test.exchange'
      });

      // Act
      const metrics = await metricsCollector.getMetrics();

      // Assert
      expect(metrics).toContain('app="scheduler-service"');
      expect(metrics).toContain('version="1.0.0"');
    });

    it('should reset unroutable metrics when reset is called', async () => {
      // Arrange
      metricsCollector.unroutableMessagesTotal.inc({
        routing_key: 'test.key',
        exchange: 'test.exchange'
      });
      metricsCollector.unroutableMessagesByExchange.inc({
        exchange: 'test.exchange'
      });

      // Act
      metricsCollector.reset();
      const metrics = await metricsCollector.getMetrics();

      // Assert - Metrics should be reset to 0 or not present
      const lines = metrics.split('\n');
      const unroutableLines = lines.filter(line => 
        line.includes('scheduler_unroutable_messages') && 
        !line.startsWith('#')
      );
      
      // After reset, counters should be 0 or not present
      unroutableLines.forEach(line => {
        if (line.trim()) {
          expect(line).toMatch(/\} 0$/);
        }
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should track unroutable messages from multiple sources', async () => {
      // Arrange - Simulate unroutable messages from different services
      const scenarios = [
        { routing_key: 'Command.Appointment.SendReminder', exchange: 'hospital.commands' },
        { routing_key: 'Command.Notification.SendEmail', exchange: 'hospital.commands' },
        { routing_key: 'Event.Patient.Registered', exchange: 'hospital.events' },
        { routing_key: 'Command.Billing.ProcessPayment', exchange: 'hospital.commands' }
      ];

      // Act
      scenarios.forEach(scenario => {
        metricsCollector.unroutableMessagesTotal.inc({
          routing_key: scenario.routing_key,
          exchange: scenario.exchange
        });
        metricsCollector.unroutableMessagesByExchange.inc({
          exchange: scenario.exchange
        });
      });

      // Assert
      const metrics = await metricsCollector.getMetrics();
      
      // Check all routing keys are tracked
      scenarios.forEach(scenario => {
        expect(metrics).toContain(`routing_key="${scenario.routing_key}"`);
      });

      // Check exchange aggregation
      expect(metrics).toContain('exchange="hospital.commands"');
      expect(metrics).toContain('exchange="hospital.events"');
    });

    it('should handle high volume of unroutable messages', async () => {
      // Arrange
      const routingKey = 'Command.Test.HighVolume';
      const exchange = 'hospital.commands';
      const count = 1000;

      // Act
      for (let i = 0; i < count; i++) {
        metricsCollector.unroutableMessagesTotal.inc({
          routing_key: routingKey,
          exchange: exchange
        });
        metricsCollector.unroutableMessagesByExchange.inc({
          exchange: exchange
        });
      }

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toMatch(/scheduler_unroutable_messages_total\{.*\} 1000/);
      expect(metrics).toMatch(/scheduler_unroutable_messages_by_exchange_total\{.*\} 1000/);
    });
  });
});

