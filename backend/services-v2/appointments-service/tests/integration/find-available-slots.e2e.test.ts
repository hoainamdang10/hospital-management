/**
 * Find Available Slots E2E Tests
 * 
 * Tests the availability search functionality including:
 * - Provider-based slot search
 * - Date range filtering
 * - Specialty-based filtering
 * - Duration requirements
 * - Multiple provider search
 * - Performance optimization
 * - Cache effectiveness
 */

import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createAppointment, waitFor } from '../helpers/test-data-builder';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Find Available Slots E2E', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'appointments_schema' }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('appointments').delete().like('patient_id', 'e2e-slots-%');
    await supabase.from('provider_schedules').delete().like('provider_id', 'e2e-slots-%');
  });

  describe('Basic Provider Slot Search', () => {
    it('should find available slots for a specific provider', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000); // Tomorrow

      // Create provider schedule (9 AM - 5 PM, 30-min slots)
      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '17:00',
        slot_duration: 30,
        is_available: true
      });

      // Search for available slots
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.availableSlots).toBeDefined();
      expect(response.body.availableSlots.length).toBeGreaterThan(0);
      expect(response.body.providerId).toBe(providerId);

      // Verify slot structure
      const firstSlot = response.body.availableSlots[0];
      expect(firstSlot).toHaveProperty('startTime');
      expect(firstSlot).toHaveProperty('endTime');
      expect(firstSlot).toHaveProperty('available', true);
      expect(firstSlot).toHaveProperty('duration', 30);
    });

    it('should exclude booked slots from available slots', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      // Create provider schedule
      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '12:00',
        slot_duration: 30,
        is_available: true
      });

      // Book 10:00-10:30 slot
      await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-slots-patient-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(searchDate)
            .withTimeSlot('10:00', '10:30')
            .build()
        )
        .expect(201);

      // Search for available slots
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      // Verify 10:00-10:30 is not in available slots
      const bookedSlot = response.body.availableSlots.find(
        (slot: any) => slot.startTime === '10:00' && slot.endTime === '10:30'
      );

      expect(bookedSlot).toBeUndefined();

      // But 9:00-9:30 and 11:00-11:30 should be available
      const slot9am = response.body.availableSlots.find(
        (slot: any) => slot.startTime === '09:00'
      );
      const slot11am = response.body.availableSlots.find(
        (slot: any) => slot.startTime === '11:00'
      );

      expect(slot9am).toBeDefined();
      expect(slot11am).toBeDefined();
    });

    it('should return correct number of slots based on schedule', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      // 3-hour schedule (9-12), 30-min slots = 6 slots
      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '12:00',
        slot_duration: 30,
        is_available: true
      });

      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      // Should have 6 slots: 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
      expect(response.body.availableSlots.length).toBe(6);
    });
  });

  describe('Date Range Search', () => {
    it('should find available slots within date range', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 86400000 * 7); // 7 days

      // Create schedule for all weekdays
      for (let day = 1; day <= 5; day++) {
        await supabase.from('provider_schedules').insert({
          provider_id: providerId,
          day_of_week: day,
          start_time: '09:00',
          end_time: '12:00',
          slot_duration: 60,
          is_available: true
        });
      }

      const response = await request(app)
        .get('/api/v1/availability/slots/range')
        .query({
          providerId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.dateRange).toBeDefined();
      expect(response.body.dateRange.length).toBeGreaterThan(0);

      // Each date should have its slots
      const firstDay = response.body.dateRange[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('availableSlots');
      expect(firstDay.availableSlots.length).toBeGreaterThan(0);
    });

    it('should handle date ranges with no availability', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 86400000 * 3);

      // No schedule created - provider not available

      const response = await request(app)
        .get('/api/v1/availability/slots/range')
        .query({
          providerId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.dateRange).toBeDefined();
      expect(response.body.totalAvailableSlots).toBe(0);
    });

    it('should limit date range to maximum allowed period', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 86400000 * 365); // 1 year (too long)

      const response = await request(app)
        .get('/api/v1/availability/slots/range')
        .query({
          providerId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
        .expect(400);

      expect(response.body.error).toContain('range');
      expect(response.body.maxDays).toBeDefined(); // e.g., 90 days
    });
  });

  describe('Specialty-Based Search', () => {
    it('should find available slots for providers with specific specialty', async () => {
      const specialty = 'CARDIOLOGY';
      const searchDate = new Date(Date.now() + 86400000);

      // Create 2 cardiologists with schedules
      const cardiologist1 = `e2e-slots-cardio1-${Date.now()}`;
      const cardiologist2 = `e2e-slots-cardio2-${Date.now()}`;

      for (const providerId of [cardiologist1, cardiologist2]) {
        await supabase.from('provider_schedules').insert({
          provider_id: providerId,
          day_of_week: searchDate.getDay(),
          start_time: '09:00',
          end_time: '11:00',
          slot_duration: 30,
          is_available: true,
          specialty: specialty
        });
      }

      // Create 1 dermatologist (should not appear in results)
      await supabase.from('provider_schedules').insert({
        provider_id: `e2e-slots-derma-${Date.now()}`,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '11:00',
        slot_duration: 30,
        is_available: true,
        specialty: 'DERMATOLOGY'
      });

      const response = await request(app)
        .get('/api/v1/availability/slots/by-specialty')
        .query({
          specialty,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.specialty).toBe(specialty);
      expect(response.body.providers).toBeDefined();
      expect(response.body.providers.length).toBe(2);

      // Verify each provider has slots
      response.body.providers.forEach((provider: any) => {
        expect(provider.availableSlots.length).toBeGreaterThan(0);
        expect([cardiologist1, cardiologist2]).toContain(provider.providerId);
      });
    });

    it('should return empty results for specialty with no available providers', async () => {
      const response = await request(app)
        .get('/api/v1/availability/slots/by-specialty')
        .query({
          specialty: 'NEUROSURGERY',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.specialty).toBe('NEUROSURGERY');
      expect(response.body.providers.length).toBe(0);
      expect(response.body.message).toContain('No providers available');
    });
  });

  describe('Duration-Based Filtering', () => {
    it('should find slots matching required duration', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      // Provider with 30-min slots
      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '12:00',
        slot_duration: 30,
        is_available: true
      });

      // Search for 60-minute appointments
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0],
          duration: 60
        })
        .expect(200);

      // Should find consecutive 30-min slots that can accommodate 60-min appointment
      expect(response.body.availableSlots).toBeDefined();
      response.body.availableSlots.forEach((slot: any) => {
        expect(slot.duration).toBeGreaterThanOrEqual(60);
      });
    });

    it('should NOT suggest slots shorter than required duration', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      // Provider with 30-min slots
      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '10:00',
        slot_duration: 30,
        is_available: true
      });

      // Book one slot, breaking continuity
      await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-slots-patient-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(searchDate)
            .withTimeSlot('09:30', '10:00')
            .build()
        )
        .expect(201);

      // Search for 60-minute appointment (should find none, only 9:00-9:30 available)
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0],
          duration: 60
        })
        .expect(200);

      expect(response.body.availableSlots.length).toBe(0);
    });
  });

  describe('Multiple Provider Search', () => {
    it('should find available slots across multiple providers', async () => {
      const searchDate = new Date(Date.now() + 86400000);
      const providers = [
        `e2e-slots-provider1-${Date.now()}`,
        `e2e-slots-provider2-${Date.now()}`,
        `e2e-slots-provider3-${Date.now()}`
      ];

      // Create schedules for all providers
      for (const providerId of providers) {
        await supabase.from('provider_schedules').insert({
          provider_id: providerId,
          day_of_week: searchDate.getDay(),
          start_time: '09:00',
          end_time: '11:00',
          slot_duration: 30,
          is_available: true
        });
      }

      const response = await request(app)
        .get('/api/v1/availability/slots/multiple')
        .query({
          providerIds: providers.join(','),
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.providers).toBeDefined();
      expect(response.body.providers.length).toBe(3);

      // Each provider should have availability
      response.body.providers.forEach((provider: any) => {
        expect(providers).toContain(provider.providerId);
        expect(provider.availableSlots.length).toBeGreaterThan(0);
      });
    });

    it('should aggregate total available slots across providers', async () => {
      const searchDate = new Date(Date.now() + 86400000);
      const providers = [
        `e2e-slots-provider1-${Date.now()}`,
        `e2e-slots-provider2-${Date.now()}`
      ];

      // Provider 1: 2 slots
      await supabase.from('provider_schedules').insert({
        provider_id: providers[0],
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '10:00',
        slot_duration: 30,
        is_available: true
      });

      // Provider 2: 4 slots
      await supabase.from('provider_schedules').insert({
        provider_id: providers[1],
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '11:00',
        slot_duration: 30,
        is_available: true
      });

      const response = await request(app)
        .get('/api/v1/availability/slots/multiple')
        .query({
          providerIds: providers.join(','),
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.totalAvailableSlots).toBe(6); // 2 + 4
    });
  });

  describe('Performance and Caching', () => {
    it('should return results within acceptable time for large date range', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 86400000 * 30); // 30 days

      // Create schedules for all weekdays
      for (let day = 0; day <= 6; day++) {
        await supabase.from('provider_schedules').insert({
          provider_id: providerId,
          day_of_week: day,
          start_time: '08:00',
          end_time: '18:00',
          slot_duration: 30,
          is_available: true
        });
      }

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/availability/slots/range')
        .query({
          providerId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
        .expect(200);

      const elapsedTime = Date.now() - startTime;

      expect(response.body.dateRange).toBeDefined();
      expect(elapsedTime).toBeLessThan(3000); // Should respond within 3 seconds
    });

    it('should utilize cache for repeated queries', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '12:00',
        slot_duration: 30,
        is_available: true
      });

      // First request (cold cache)
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request (warm cache)
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);
      const time2 = Date.now() - start2;

      // Results should be identical
      expect(response1.body.availableSlots.length).toBe(response2.body.availableSlots.length);

      // Second request should be faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);
    });

    it('should invalidate cache when appointment is booked', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '09:00',
        end_time: '10:00',
        slot_duration: 30,
        is_available: true
      });

      // Get initial slots
      const beforeResponse = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      const initialSlotCount = beforeResponse.body.availableSlots.length;

      // Book a slot
      await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-slots-patient-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(searchDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Get slots again (should reflect booking)
      const afterResponse = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      const finalSlotCount = afterResponse.body.availableSlots.length;

      expect(finalSlotCount).toBe(initialSlotCount - 1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle search for past dates gracefully', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const pastDate = new Date(Date.now() - 86400000); // Yesterday

      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: pastDate.toISOString().split('T')[0]
        })
        .expect(400);

      expect(response.body.error).toContain('past date');
    });

    it('should return empty array for provider with no schedule', async () => {
      const providerId = `e2e-slots-noschedule-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.availableSlots).toEqual([]);
      expect(response.body.message).toContain('No schedule configured');
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          // Missing providerId and date
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.missingParameters).toContain('providerId');
      expect(response.body.missingParameters).toContain('date');
    });

    it('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId: 'test-provider',
          date: 'invalid-date'
        })
        .expect(400);

      expect(response.body.error).toContain('date format');
    });

    it('should handle provider not found', async () => {
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId: 'nonexistent-provider-12345',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        })
        .expect(404);

      expect(response.body.error).toContain('Provider not found');
    });
  });

  describe('Complex Filtering Scenarios', () => {
    it('should combine specialty, duration, and date range filters', async () => {
      const specialty = 'ORTHOPEDICS';
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 86400000 * 7);

      // Create orthopedic surgeon with appropriate slots
      const providerId = `e2e-slots-ortho-${Date.now()}`;

      for (let day = 1; day <= 5; day++) {
        await supabase.from('provider_schedules').insert({
          provider_id: providerId,
          day_of_week: day,
          start_time: '09:00',
          end_time: '15:00',
          slot_duration: 60, // 1-hour slots
          is_available: true,
          specialty: specialty
        });
      }

      const response = await request(app)
        .get('/api/v1/availability/slots/advanced')
        .query({
          specialty,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          duration: 60
        })
        .expect(200);

      expect(response.body.filters).toEqual({
        specialty,
        duration: 60
      });

      expect(response.body.providers).toBeDefined();
      expect(response.body.providers.length).toBeGreaterThan(0);

      // All slots should meet duration requirement
      response.body.providers.forEach((provider: any) => {
        provider.availableSlots.forEach((slot: any) => {
          expect(slot.duration).toBeGreaterThanOrEqual(60);
        });
      });
    });

    it('should handle time-of-day preferences', async () => {
      const providerId = `e2e-slots-provider-${Date.now()}`;
      const searchDate = new Date(Date.now() + 86400000);

      // Full day schedule
      await supabase.from('provider_schedules').insert({
        provider_id: providerId,
        day_of_week: searchDate.getDay(),
        start_time: '08:00',
        end_time: '18:00',
        slot_duration: 30,
        is_available: true
      });

      // Search for morning slots only (before 12:00)
      const response = await request(app)
        .get('/api/v1/availability/slots')
        .query({
          providerId,
          date: searchDate.toISOString().split('T')[0],
          timeOfDay: 'MORNING' // Before 12:00
        })
        .expect(200);

      // All returned slots should be before 12:00
      response.body.availableSlots.forEach((slot: any) => {
        const hour = parseInt(slot.startTime.split(':')[0]);
        expect(hour).toBeLessThan(12);
      });
    });
  });
});
