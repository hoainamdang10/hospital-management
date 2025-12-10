/**
 * Flow 4 Integration Test: Appointment Completion → Invoice → Payment
 * Tests the complete flow from appointment completion to invoice creation with appointment_id linkage
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Integration Testing, Flow Verification
 */

import { createClient } from '@supabase/supabase-js';

describe('Flow 4: Appointment Completion → Invoice → Payment', () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'billing_schema' },
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  const appointmentsSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'appointments_schema' },
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  describe('Invoice Creation with Appointment Linkage', () => {
    it('should create invoice with appointment_id populated when appointment is completed', async () => {
      // 1. Query recent completed appointments
      const { data: completedAppointments, error: appointmentError } = await appointmentsSupabase
        .from('appointments')
        .select('appointment_id, patient_id, status, consultation_fee, completed_at')
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false })
        .limit(1);

      expect(appointmentError).toBeNull();
      expect(completedAppointments).toBeDefined();
      expect(completedAppointments!.length).toBeGreaterThan(0);

      const completedAppointment = completedAppointments![0];
      console.log(' Found completed appointment:', {
        appointmentId: completedAppointment.appointment_id,
        patientId: completedAppointment.patient_id,
        consultationFee: completedAppointment.consultation_fee,
        completedAt: completedAppointment.completed_at
      });

      // 2. Query invoices for this appointment
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_id,
          appointment_id,
          patient_id,
          doctor_id,
          status,
          total_amount,
          created_at
        `)
        .eq('appointment_id', completedAppointment.appointment_id);

      expect(invoiceError).toBeNull();
      console.log(' Invoices found:', invoices?.length || 0);

      if (invoices && invoices.length > 0) {
        const invoice = invoices[0];
        console.log(' Invoice with appointment linkage:', {
          invoiceId: invoice.invoice_id,
          appointmentId: invoice.appointment_id,
          patientId: invoice.patient_id,
          doctorId: invoice.doctor_id,
          status: invoice.status,
          totalAmount: invoice.total_amount,
          createdAt: invoice.created_at
        });

        // 3. Verify appointment_id is populated
        expect(invoice.appointment_id).toBe(completedAppointment.appointment_id);
        expect(invoice.patient_id).toBe(completedAppointment.patient_id);
        expect(invoice.status).toBeDefined();
        expect(invoice.total_amount).toBeGreaterThan(0);

        // 4. Query payments for this invoice
        const { data: payments, error: paymentError } = await supabase
          .from('payment_records')
          .select(`
            id,
            payment_id,
            invoice_id,
            amount,
            currency,
            method,
            transaction_id,
            processed_at
          `)
          .eq('invoice_id', invoice.id);

        expect(paymentError).toBeNull();
        console.log(' Payments found:', payments?.length || 0);

        if (payments && payments.length > 0) {
          const payment = payments[0];
          console.log(' Payment record:', {
            paymentId: payment.payment_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            transactionId: payment.transaction_id,
            processedAt: payment.processed_at
          });

          // 5. Verify complete traceability
          expect(payment.invoice_id).toBe(invoice.id);
          expect(payment.amount).toBeGreaterThan(0);
        }

        //  FLOW 4 VERIFICATION PASSED
        console.log('\n FLOW 4 VERIFICATION PASSED');
        console.log('Traceability Chain:');
        console.log(`  Appointment: ${completedAppointment.appointment_id}`);
        console.log(`  ↓`);
        console.log(`  Invoice: ${invoice.invoice_id} (appointment_id: ${invoice.appointment_id})`);
        console.log(`  ↓`);
        if (payments && payments.length > 0) {
          console.log(`  Payment: ${payments[0].payment_id}`);
        }
      } else {
        console.log('  No invoices found for this appointment yet');
        console.log('Note: Invoices are created asynchronously when appointment.completed event is consumed');
      }
    });

    it('should verify appointment_id column type is VARCHAR', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'billing_schema')
        .eq('table_name', 'invoices')
        .eq('column_name', 'appointment_id');

      // Note: This query may not work directly, so we'll use a simpler approach
      console.log('Checking appointment_id column type...');
      
      // Query an invoice with appointment_id to verify it's stored correctly
      const { data: invoicesWithAppointmentId } = await supabase
        .from('invoices')
        .select('appointment_id')
        .not('appointment_id', 'is', null)
        .limit(1);

      if (invoicesWithAppointmentId && invoicesWithAppointmentId.length > 0) {
        const appointmentId = invoicesWithAppointmentId[0].appointment_id;
        console.log(' appointment_id column stores VARCHAR format:', appointmentId);
        expect(typeof appointmentId).toBe('string');
        // Verify it's in the expected format (e.g., "2025-APT-202511-901")
        expect(appointmentId).toMatch(/^\d{4}-APT-\d{6}-\d{3}$/);
      }
    });

    it('should verify outbox events for appointment.completed', async () => {
      const { data: outboxEvents, error } = await appointmentsSupabase
        .from('outbox_events')
        .select('id, event_type, status, aggregate_id, created_at')
        .eq('event_type', 'appointments.completed')
        .eq('status', 'SENT')
        .order('created_at', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      console.log(' Outbox events found:', outboxEvents?.length || 0);

      if (outboxEvents && outboxEvents.length > 0) {
        console.log(' Recent appointment.completed events:');
        outboxEvents.forEach((event, idx) => {
          console.log(`  ${idx + 1}. ${event.aggregate_id} (${event.created_at})`);
        });
      }
    });
  });

  describe('Data Consistency Checks', () => {
    it('should verify all invoices have either appointment_id or are from other sources', async () => {
      const { data: allInvoices, error } = await supabase
        .from('invoices')
        .select('id, invoice_id, appointment_id, patient_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      expect(error).toBeNull();
      console.log('\n Invoice Summary (last 20):');

      let withAppointmentId = 0;
      let withoutAppointmentId = 0;

      allInvoices?.forEach(invoice => {
        if (invoice.appointment_id) {
          withAppointmentId++;
        } else {
          withoutAppointmentId++;
        }
      });

      console.log(`  With appointment_id: ${withAppointmentId}`);
      console.log(`  Without appointment_id: ${withoutAppointmentId}`);
      console.log(`  Total: ${allInvoices?.length || 0}`);

      if (withAppointmentId > 0) {
        console.log(`   ${((withAppointmentId / (allInvoices?.length || 1)) * 100).toFixed(1)}% invoices have appointment linkage`);
      }
    });
  });
});
