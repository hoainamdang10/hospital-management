/**
 * Optimized DataLoaders Service
 * Advanced batching and caching for N+1 query optimization
 */

import logger from "@hospital/shared/dist/utils/logger";
import DataLoader from "dataloader";
import { dataLoaderConfig } from "../config/performance.config";
import { advancedCacheService } from "./advanced-cache.service";
import { RestApiService } from "./rest-api.service";

export interface DataLoaderOptions {
  batchSize?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

export class OptimizedDataLoadersService {
  private restApi: RestApiService;
  private loaders: Map<string, DataLoader<any, any>> = new Map();

  constructor(restApi: RestApiService) {
    this.restApi = restApi;
    this.initializeDataLoaders();
  }

  /**
   * Initialize all DataLoaders with optimization
   */
  private initializeDataLoaders(): void {
    // Doctor DataLoaders
    this.createLoader("doctorById", this.batchLoadDoctors.bind(this), {
      cacheTTL: 1800, // 30 minutes
    });

    this.createLoader(
      "doctorsByDepartment",
      this.batchLoadDoctorsByDepartment.bind(this),
      {
        cacheTTL: 3600, // 1 hour
      }
    );

    this.createLoader(
      "doctorSchedules",
      this.batchLoadDoctorSchedules.bind(this),
      {
        cacheTTL: 300, // 5 minutes
      }
    );

    this.createLoader("doctorReviews", this.batchLoadDoctorReviews.bind(this), {
      cacheTTL: 600, // 10 minutes
    });

    // Patient DataLoaders
    this.createLoader("patientById", this.batchLoadPatients.bind(this), {
      cacheTTL: 1800, // 30 minutes
    });

    this.createLoader(
      "patientsByDoctor",
      this.batchLoadPatientsByDoctor.bind(this),
      {
        cacheTTL: 900, // 15 minutes
      }
    );

    this.createLoader(
      "patientMedicalRecords",
      this.batchLoadPatientMedicalRecords.bind(this),
      {
        cacheTTL: 300, // 5 minutes - sensitive data
      }
    );

    // Appointment DataLoaders
    this.createLoader(
      "appointmentById",
      this.batchLoadAppointments.bind(this),
      {
        cacheTTL: 300, // 5 minutes - real-time data
      }
    );

    this.createLoader(
      "appointmentsByDoctor",
      this.batchLoadAppointmentsByDoctor.bind(this),
      {
        cacheTTL: 300, // 5 minutes
      }
    );

    this.createLoader(
      "appointmentsByPatient",
      this.batchLoadAppointmentsByPatient.bind(this),
      {
        cacheTTL: 300, // 5 minutes
      }
    );

    // Department DataLoaders
    this.createLoader("departmentById", this.batchLoadDepartments.bind(this), {
      cacheTTL: 7200, // 2 hours - static data
    });

    this.createLoader(
      "departmentSpecialties",
      this.batchLoadDepartmentSpecialties.bind(this),
      {
        cacheTTL: 7200, // 2 hours
      }
    );

    // Medical Records DataLoaders
    this.createLoader(
      "medicalRecordById",
      this.batchLoadMedicalRecords.bind(this),
      {
        cacheTTL: 300, // 5 minutes - sensitive data
      }
    );

    this.createLoader(
      "vitalSignsByPatient",
      this.batchLoadVitalSigns.bind(this),
      {
        cacheTTL: 180, // 3 minutes - real-time data
      }
    );

    logger.info("🚀 Optimized DataLoaders initialized");
  }

  /**
   * Create optimized DataLoader with caching
   */
  private createLoader<K, V>(
    name: string,
    batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>,
    options: DataLoaderOptions = {}
  ): DataLoader<K, V> {
    const loader = new DataLoader<K, V>(
      async (keys: readonly K[]) => {
        const startTime = Date.now();

        try {
          // Check cache first for individual keys
          const cachedResults: (V | null)[] = [];
          const uncachedKeys: K[] = [];
          const keyIndexMap: Map<K, number> = new Map();

          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const cacheKey = `dataloader:${name}:${String(key)}`;
            const cached = await advancedCacheService.get<V>(
              "dataloader",
              cacheKey
            );

            if (cached !== null) {
              cachedResults[i] = cached;
            } else {
              cachedResults[i] = null;
              uncachedKeys.push(key);
              keyIndexMap.set(key, i);
            }
          }

          // Batch load uncached keys
          let batchResults: (V | Error)[] = [];
          if (uncachedKeys.length > 0) {
            batchResults = await batchLoadFn(uncachedKeys);

            // Cache the results
            for (let i = 0; i < uncachedKeys.length; i++) {
              const key = uncachedKeys[i];
              const result = batchResults[i];

              if (!(result instanceof Error)) {
                const cacheKey = `dataloader:${name}:${String(key)}`;
                await advancedCacheService.set("dataloader", cacheKey, result, {
                  ttl: options.cacheTTL || 300,
                  tags: [name, "dataloader"],
                });
              }
            }
          }

          // Merge cached and batch results
          const finalResults: (V | Error)[] = [];
          let batchIndex = 0;

          for (let i = 0; i < keys.length; i++) {
            if (cachedResults[i] !== null) {
              finalResults[i] = cachedResults[i] as V;
            } else {
              finalResults[i] = batchResults[batchIndex++];
            }
          }

          const duration = Date.now() - startTime;
          logger.debug(`📊 DataLoader ${name}:`, {
            totalKeys: keys.length,
            cachedKeys: keys.length - uncachedKeys.length,
            batchedKeys: uncachedKeys.length,
            duration: `${duration}ms`,
            cacheHitRate: `${(((keys.length - uncachedKeys.length) / keys.length) * 100).toFixed(1)}%`,
          });

          return finalResults;
        } catch (error) {
          logger.error(`DataLoader ${name} error:`, error);
          return keys.map(() => error as Error);
        }
      },
      {
        batchScheduleFn: dataLoaderConfig.batchScheduleFn,
        maxBatchSize: options.batchSize || dataLoaderConfig.maxBatchSize,
        cacheKeyFn: dataLoaderConfig.cacheKeyFn as any,
        cache: options.cacheEnabled !== false,
      }
    );

    this.loaders.set(name, loader);
    return loader;
  }

  /**
   * Batch load doctors
   */
  private async batchLoadDoctors(
    ids: readonly string[]
  ): Promise<(any | Error)[]> {
    try {
      const results = await Promise.allSettled(
        ids.map((id) => this.restApi.getDoctor(id))
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          return result.value.data;
        } else {
          const error =
            result.status === "rejected"
              ? result.reason
              : new Error(result.value.error?.message || "Doctor not found");
          logger.warn(`Failed to load doctor ${ids[index]}:`, error);
          return error;
        }
      });
    } catch (error) {
      logger.error("Batch load doctors error:", error);
      return ids.map(() => error as Error);
    }
  }

  /**
   * Batch load doctors by department
   */
  private async batchLoadDoctorsByDepartment(
    departmentIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.allSettled(
        departmentIds.map((deptId) =>
          this.restApi.getDoctors({ departmentId: deptId, limit: 100 })
        )
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          return result.value.data || [];
        } else {
          const error =
            result.status === "rejected"
              ? result.reason
              : new Error("Failed to load doctors for department");
          logger.warn(
            `Failed to load doctors for department ${departmentIds[index]}:`,
            error
          );
          return error;
        }
      });
    } catch (error) {
      logger.error("Batch load doctors by department error:", error);
      return departmentIds.map(() => error as Error);
    }
  }

  /**
   * Batch load doctor schedules
   */
  private async batchLoadDoctorSchedules(
    doctorIds: readonly string[]
  ): Promise<(any | Error)[]> {
    try {
      const results = await Promise.allSettled(
        doctorIds.map((doctor_id) => this.restApi.getDoctorSchedule(doctor_id))
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          return result.value.data;
        } else {
          const error =
            result.status === "rejected"
              ? result.reason
              : new Error("Schedule not found");
          logger.warn(
            `Failed to load schedule for doctor ${doctorIds[index]}:`,
            error
          );
          return error;
        }
      });
    } catch (error) {
      logger.error("Batch load doctor schedules error:", error);
      return doctorIds.map(() => error as Error);
    }
  }

  /**
   * Batch load doctor reviews
   */
  private async batchLoadDoctorReviews(
    doctorIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.allSettled(
        doctorIds.map((doctor_id) => this.restApi.getDoctorReviews(doctor_id))
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          return result.value.data || [];
        } else {
          const error =
            result.status === "rejected"
              ? result.reason
              : new Error("Reviews not found");
          logger.warn(
            `Failed to load reviews for doctor ${doctorIds[index]}:`,
            error
          );
          return error;
        }
      });
    } catch (error) {
      logger.error("Batch load doctor reviews error:", error);
      return doctorIds.map(() => error as Error);
    }
  }

  /**
   * Batch load patients
   */
  private async batchLoadPatients(
    ids: readonly string[]
  ): Promise<(any | Error)[]> {
    try {
      const results = await Promise.allSettled(
        ids.map((id) => this.restApi.getPatient(id))
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          return result.value.data;
        } else {
          const error =
            result.status === "rejected"
              ? result.reason
              : new Error(result.value.error?.message || "Patient not found");
          logger.warn(`Failed to load patient ${ids[index]}:`, error);
          return error;
        }
      });
    } catch (error) {
      logger.error("Batch load patients error:", error);
      return ids.map(() => error as Error);
    }
  }

  /**
   * Batch load patients by doctor
   */
  private async batchLoadPatientsByDoctor(
    doctorIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.allSettled(
        doctorIds.map((doctor_id) => this.restApi.getPatients({ limit: 100 }))
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          return result.value.data || [];
        } else {
          const error =
            result.status === "rejected"
              ? result.reason
              : new Error("Failed to load patients for doctor");
          logger.warn(
            `Failed to load patients for doctor ${doctorIds[index]}:`,
            error
          );
          return error;
        }
      });
    } catch (error) {
      logger.error("Batch load patients by doctor error:", error);
      return doctorIds.map(() => error as Error);
    }
  }

  // Additional batch load methods would continue here...
  // (Truncated for brevity - would include all other entity loaders)

  /**
   * Get DataLoader by name
   */
  getLoader<K, V>(name: string): DataLoader<K, V> | undefined {
    return this.loaders.get(name);
  }

  /**
   * Clear all DataLoader caches
   */
  clearAll(): void {
    this.loaders.forEach((loader, name) => {
      loader.clearAll();
      logger.debug(`🧹 Cleared DataLoader cache: ${name}`);
    });
  }

  /**
   * Clear specific DataLoader cache
   */
  clear(name: string): void {
    const loader = this.loaders.get(name);
    if (loader) {
      loader.clearAll();
      logger.debug(`🧹 Cleared DataLoader cache: ${name}`);
    }
  }

  /**
   * Prime DataLoader cache
   */
  prime<K, V>(loaderName: string, key: K, value: V): void {
    const loader = this.loaders.get(loaderName);
    if (loader) {
      loader.prime(key, value);
      logger.debug(`📝 Primed DataLoader cache: ${loaderName}[${String(key)}]`);
    }
  }

  /**
   * Get DataLoader statistics
   */
  getStats(): any {
    const stats: any = {};

    this.loaders.forEach((loader, name) => {
      // Note: DataLoader doesn't expose internal stats by default
      // This would require custom implementation or wrapper
      stats[name] = {
        cacheSize: (loader as any)._cache?.size || 0,
        // Add more stats as needed
      };
    });

    return stats;
  }

  // Missing batch load methods - placeholder implementations
  private async batchLoadPatientMedicalRecords(
    patientIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.all(
        patientIds.map(async (patient_id) => {
          try {
            const response = await this.restApi.getPatientMedicalRecords({
              patient_id,
            });
            return response.success ? response.data : [];
          } catch (error) {
            return new Error(
              `Failed to load medical records for patient ${patient_id}`
            );
          }
        })
      );
      return results;
    } catch (error) {
      return patientIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadAppointments(
    appointmentIds: readonly string[]
  ): Promise<(any | Error)[]> {
    try {
      const results = await Promise.all(
        appointmentIds.map(async (appointment_id) => {
          try {
            const response = await this.restApi.getAppointment(appointment_id);
            return response.success ? response.data : null;
          } catch (error) {
            return new Error(`Failed to load appointment ${appointment_id}`);
          }
        })
      );
      return results;
    } catch (error) {
      return appointmentIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadAppointmentsByDoctor(
    doctorIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.all(
        doctorIds.map(async (doctor_id) => {
          try {
            const response = await this.restApi.getAppointments({
              doctor_id,
              limit: 100,
            });
            return response.success ? response.data : [];
          } catch (error) {
            return new Error(
              `Failed to load appointments for doctor ${doctor_id}`
            );
          }
        })
      );
      return results;
    } catch (error) {
      return doctorIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadAppointmentsByPatient(
    patientIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.all(
        patientIds.map(async (patient_id) => {
          try {
            const response = await this.restApi.getAppointments({
              patient_id,
              limit: 100,
            });
            return response.success ? response.data : [];
          } catch (error) {
            return new Error(
              `Failed to load appointments for patient ${patient_id}`
            );
          }
        })
      );
      return results;
    } catch (error) {
      return patientIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadDepartments(
    departmentIds: readonly string[]
  ): Promise<(any | Error)[]> {
    try {
      const results = await Promise.all(
        departmentIds.map(async (departmentId) => {
          try {
            const response = await this.restApi.getDepartment(departmentId);
            return response.success ? response.data : null;
          } catch (error) {
            return new Error(`Failed to load department ${departmentId}`);
          }
        })
      );
      return results;
    } catch (error) {
      return departmentIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadDepartmentSpecialties(
    departmentIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    try {
      const results = await Promise.all(
        departmentIds.map(async (departmentId) => {
          try {
            // Specialties functionality simplified - return empty array
            const response = { success: true, data: [] };
            return response.success ? response.data : [];
          } catch (error) {
            return new Error(
              `Failed to load specialties for department ${departmentId}`
            );
          }
        })
      );
      return results;
    } catch (error) {
      return departmentIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadMedicalRecords(
    recordIds: readonly string[]
  ): Promise<(any | Error)[]> {
    try {
      const results = await Promise.all(
        recordIds.map(async (recordId) => {
          try {
            const response = await this.restApi.getMedicalRecord(recordId);
            return response.success ? response.data : null;
          } catch (error) {
            return new Error(`Failed to load medical record ${recordId}`);
          }
        })
      );
      return results;
    } catch (error) {
      return recordIds.map(() => new Error("Batch load failed"));
    }
  }

  private async batchLoadVitalSigns(
    patientIds: readonly string[]
  ): Promise<(any[] | Error)[]> {
    // Vital signs removed from simplified system - return empty arrays
    return patientIds.map(() => []);
  }
}

/**
 * Factory function to create optimized DataLoaders
 */
export function createOptimizedDataLoaders(
  restApi: RestApiService
): OptimizedDataLoadersService {
  return new OptimizedDataLoadersService(restApi);
}
