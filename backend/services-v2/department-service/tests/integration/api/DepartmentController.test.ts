/**
 * Department Controller - Integration Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import express, { Express } from 'express';
import { DepartmentController } from '../../../src/presentation/controllers/DepartmentController';
import { SupabaseDepartmentRepository } from '../../../src/infrastructure/persistence/SupabaseDepartmentRepository';
import { RedisDepartmentCache } from '../../../src/infrastructure/cache/RedisDepartmentCache';
import { Department, DepartmentProps } from '../../../src/domain/entities/Department';

describe('DepartmentController - Integration Tests', () => {
  let app: Express;
  let repository: SupabaseDepartmentRepository;
  let cache: RedisDepartmentCache;
  let controller: DepartmentController;
  let testDepartment: Department;

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ciasxktujslgsdgylimv.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';

  beforeAll(async () => {
    if (!SUPABASE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for integration tests');
    }

    // Initialize infrastructure
    repository = new SupabaseDepartmentRepository(SUPABASE_URL, SUPABASE_KEY);
    cache = new RedisDepartmentCache(REDIS_URL);
    await cache.connect();

    // Initialize controller
    controller = new DepartmentController(repository, cache);

    // Setup Express app
    app = express();
    app.use(express.json());

    // Setup routes
    app.get('/api/departments', (req, res) => controller.list(req, res));
    app.get('/api/departments/stats', (req, res) => controller.getStats(req, res));
    app.get('/api/departments/code/:code', (req, res) => controller.getByCode(req, res));
    app.get('/api/departments/:id', (req, res) => controller.getById(req, res));
  });

  afterAll(async () => {
    await cache.disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cache.clear();

    // Create test department
    const props: DepartmentProps = {
      departmentCode: 'TEST',
      departmentNameEn: 'Test Department',
      departmentNameVi: 'Khoa Test',
      description: 'Test department for API testing',
      phone: '0123456789',
      email: 'test@hospital.com',
      location: 'Test Building',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user'
    };

    testDepartment = Department.create(props);
    await repository.save(testDepartment);
  });

  afterEach(async () => {
    // Cleanup test department
    if (testDepartment) {
      try {
        await repository.delete(testDepartment.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Clear cache after each test
    await cache.clear();
  });

  describe('GET /api/departments', () => {
    it('should return list of active departments', async () => {
      const response = await request(app)
        .get('/api/departments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.source).toBe('database');
    });

    it('should return cached data on second request', async () => {
      // First request - from database
      const firstResponse = await request(app)
        .get('/api/departments')
        .expect(200);

      expect(firstResponse.body.source).toBe('database');

      // Second request - from cache
      const secondResponse = await request(app)
        .get('/api/departments')
        .expect(200);

      expect(secondResponse.body.source).toBe('cache');
      expect(secondResponse.body.data).toEqual(firstResponse.body.data);
    });

    it('should filter by active status', async () => {
      const activeResponse = await request(app)
        .get('/api/departments?active=true')
        .expect(200);

      const allResponse = await request(app)
        .get('/api/departments?active=false')
        .expect(200);

      expect(allResponse.body.total).toBeGreaterThanOrEqual(activeResponse.body.total);
    });

    it('should return departments with correct structure', async () => {
      const response = await request(app)
        .get('/api/departments')
        .expect(200);

      const department = response.body.data[0];

      expect(department).toHaveProperty('id');
      expect(department).toHaveProperty('code');
      expect(department).toHaveProperty('nameEn');
      expect(department).toHaveProperty('nameVi');
      expect(department).toHaveProperty('isActive');
      expect(department).toHaveProperty('createdAt');
      expect(department).toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/departments/:id', () => {
    it('should return department by ID', async () => {
      const response = await request(app)
        .get(`/api/departments/${testDepartment.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testDepartment.id);
      expect(response.body.data.code).toBe('TEST');
      expect(response.body.data.nameEn).toBe('Test Department');
      expect(response.body.source).toBe('database');
    });

    it('should return cached data on second request', async () => {
      // First request
      await request(app)
        .get(`/api/departments/${testDepartment.id}`)
        .expect(200);

      // Second request - should be from cache
      const response = await request(app)
        .get(`/api/departments/${testDepartment.id}`)
        .expect(200);

      expect(response.body.source).toBe('cache');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/departments/non-existent-id-12345')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Department not found');
    });

    it('should return complete department data', async () => {
      const response = await request(app)
        .get(`/api/departments/${testDepartment.id}`)
        .expect(200);

      const data = response.body.data;

      expect(data.description).toBe('Test department for API testing');
      expect(data.phone).toBe('0123456789');
      expect(data.email).toBe('test@hospital.com');
      expect(data.location).toBe('Test Building');
      expect(data.isActive).toBe(true);
    });
  });

  describe('GET /api/departments/code/:code', () => {
    it('should return department by code', async () => {
      const response = await request(app)
        .get('/api/departments/code/TEST')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('TEST');
      expect(response.body.data.nameEn).toBe('Test Department');
    });

    it('should be case-insensitive', async () => {
      const response = await request(app)
        .get('/api/departments/code/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('TEST');
    });

    it('should return 404 for non-existent code', async () => {
      const response = await request(app)
        .get('/api/departments/code/NONEXIST')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should work with existing department codes', async () => {
      const codes = ['CARD', 'ORTH', 'PEDI', 'INTE', 'EMER', 'RADI', 'LABO', 'ADMI'];

      for (const code of codes) {
        const response = await request(app)
          .get(`/api/departments/code/${code}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toBe(code);
      }
    });
  });

  describe('GET /api/departments/stats', () => {
    it('should return department statistics', async () => {
      const response = await request(app)
        .get('/api/departments/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalActive');
      expect(response.body.data).toHaveProperty('totalInactive');
      expect(response.body.data).toHaveProperty('totalAll');
    });

    it('should have correct statistics', async () => {
      const response = await request(app)
        .get('/api/departments/stats')
        .expect(200);

      const { totalActive, totalInactive, totalAll } = response.body.data;

      expect(totalAll).toBe(totalActive + totalInactive);
      expect(totalActive).toBeGreaterThan(0);
      expect(totalAll).toBeGreaterThan(0);
    });

    it('should return numbers for all stats', async () => {
      const response = await request(app)
        .get('/api/departments/stats')
        .expect(200);

      const { totalActive, totalInactive, totalAll } = response.body.data;

      expect(typeof totalActive).toBe('number');
      expect(typeof totalInactive).toBe('number');
      expect(typeof totalAll).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Create controller with invalid repository
      const invalidRepo = new SupabaseDepartmentRepository('invalid-url', 'invalid-key');
      const errorController = new DepartmentController(invalidRepo, cache);

      const errorApp = express();
      errorApp.use(express.json());
      errorApp.get('/api/departments', (req, res) => errorController.list(req, res));

      const response = await request(errorApp)
        .get('/api/departments')
        .expect(200); // Should still return 200 with empty array

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle cache errors gracefully', async () => {
      // Create controller with invalid cache
      const invalidCache = new RedisDepartmentCache('redis://invalid-host:9999');
      const errorController = new DepartmentController(repository, invalidCache);

      const errorApp = express();
      errorApp.use(express.json());
      errorApp.get('/api/departments/:id', (req, res) => errorController.getById(req, res));

      // Should still work, just without cache
      const response = await request(errorApp)
        .get(`/api/departments/${testDepartment.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testDepartment.id);
    });
  });

  describe('performance', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/departments')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should be faster with cache', async () => {
      // First request - database
      const dbStartTime = Date.now();
      await request(app).get('/api/departments');
      const dbTime = Date.now() - dbStartTime;

      // Second request - cache
      const cacheStartTime = Date.now();
      await request(app).get('/api/departments');
      const cacheTime = Date.now() - cacheStartTime;

      // Cache should be faster (or at least not slower)
      expect(cacheTime).toBeLessThanOrEqual(dbTime * 1.5); // Allow 50% margin
    });
  });
});
