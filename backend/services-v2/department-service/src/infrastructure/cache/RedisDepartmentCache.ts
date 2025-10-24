/**
 * Redis Department Cache - Infrastructure Layer
 * Caching layer for Department data (departments rarely change)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Caching Strategy, Performance Optimization
 */

import { createClient, RedisClientType } from 'redis';
import { Department } from '../../domain/entities/Department';

export class RedisDepartmentCache {
  private client: RedisClientType;
  private readonly TTL = 86400; // 24 hours (departments rarely change)
  private readonly KEY_PREFIX = 'department:';
  private readonly ALL_KEY = 'departments:all';

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err) => {
      console.error('[RedisDepartmentCache] Redis Client Error:', err);
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log('[RedisDepartmentCache] Connected to Redis');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
      console.log('[RedisDepartmentCache] Disconnected from Redis');
    }
  }

  /**
   * Get department by ID from cache
   */
  async get(id: string): Promise<Department | null> {
    try {
      await this.connect();
      const cached = await this.client.get(`${this.KEY_PREFIX}${id}`);
      
      if (!cached) return null;

      const data = JSON.parse(cached);
      return this.toDomain(data);
    } catch (error: any) {
      console.error('[RedisDepartmentCache] Error getting from cache:', error.message);
      return null;
    }
  }

  /**
   * Set department in cache
   */
  async set(id: string, department: Department): Promise<void> {
    try {
      await this.connect();
      const data = department.toJSON();
      await this.client.setEx(
        `${this.KEY_PREFIX}${id}`,
        this.TTL,
        JSON.stringify(data)
      );
    } catch (error: any) {
      console.error('[RedisDepartmentCache] Error setting cache:', error.message);
    }
  }

  /**
   * Get all departments from cache
   */
  async getAll(): Promise<Department[] | null> {
    try {
      await this.connect();
      const cached = await this.client.get(this.ALL_KEY);
      
      if (!cached) return null;

      const data = JSON.parse(cached);
      return data.map((item: any) => this.toDomain(item));
    } catch (error: any) {
      console.error('[RedisDepartmentCache] Error getting all from cache:', error.message);
      return null;
    }
  }

  /**
   * Set all departments in cache
   */
  async setAll(departments: Department[]): Promise<void> {
    try {
      await this.connect();
      const data = departments.map(dept => dept.toJSON());
      await this.client.setEx(
        this.ALL_KEY,
        this.TTL,
        JSON.stringify(data)
      );
    } catch (error: any) {
      console.error('[RedisDepartmentCache] Error setting all in cache:', error.message);
    }
  }

  /**
   * Invalidate cache for a specific department
   */
  async invalidate(id: string): Promise<void> {
    try {
      await this.connect();
      await this.client.del(`${this.KEY_PREFIX}${id}`);
      // Also invalidate the "all" cache
      await this.client.del(this.ALL_KEY);
    } catch (error: any) {
      console.error('[RedisDepartmentCache] Error invalidating cache:', error.message);
    }
  }

  /**
   * Clear all department caches
   */
  async clear(): Promise<void> {
    try {
      await this.connect();
      const keys = await this.client.keys(`${this.KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      await this.client.del(this.ALL_KEY);
    } catch (error: any) {
      console.error('[RedisDepartmentCache] Error clearing cache:', error.message);
    }
  }

  /**
   * Convert JSON to Department domain entity
   */
  private toDomain(data: any): Department {
    return new Department(data.id, {
      departmentCode: data.code,
      departmentNameEn: data.nameEn,
      departmentNameVi: data.nameVi,
      description: data.description,
      phone: data.phone,
      email: data.email,
      location: data.location,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy
    });
  }
}

