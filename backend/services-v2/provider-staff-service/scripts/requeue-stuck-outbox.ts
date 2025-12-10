/**
 * Script to Requeue Stuck Outbox Events
 * 
 * This script resets PUBLISHING events back to PENDING status
 * so they can be retried after the OutboxPublisher code fix.
 * 
 * Usage:
 *   ts-node scripts/requeue-stuck-outbox.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function requeueStuckEvents() {
    console.log(' Requeuing stuck outbox events...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'provider_schema' }
    });

    try {
        // 1. Find stuck PUBLISHING events
        const { data: stuckEvents, error: fetchError } = await supabase
            .from('outbox')
            .select('*')
            .eq('status', 'PUBLISHING')
            .order('created_at', { ascending: true });

        if (fetchError) {
            throw new Error(`Failed to fetch stuck events: ${fetchError.message}`);
        }

        if (!stuckEvents || stuckEvents.length === 0) {
            console.log(' No stuck events found.');
            return;
        }

        console.log(` Found ${stuckEvents.length} stuck PUBLISHING events:\n`);
        stuckEvents.forEach((evt, idx) => {
            console.log(`  ${idx + 1}. ${evt.outbox_id}`);
            console.log(`     Event: ${evt.event_type}`);
            console.log(`     Aggregate: ${evt.aggregate_id}`);
            console.log(`     Created: ${evt.created_at}`);
            console.log(`     Attempts: ${evt.publish_attempts || 0}\n`);
        });

        // 2. Reset to PENDING
        const outboxIds = stuckEvents.map(e => e.outbox_id);

        const { error: updateError } = await supabase
            .from('outbox')
            .update({
                status: 'PENDING',
                updated_at: new Date().toISOString()
            })
            .in('outbox_id', outboxIds);

        if (updateError) {
            throw new Error(`Failed to requeue events: ${updateError.message}`);
        }

        console.log(` Successfully requeued ${outboxIds.length} events to PENDING status.\n`);
        console.log(' Next steps:');
        console.log('   1. Restart provider-staff-service to apply code fixes');
        console.log('   2. Monitor logs for successful event publishing');
        console.log('   3. Check outbox table to verify events are PUBLISHED\n');

    } catch (error) {
        console.error(' Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Run the script
requeueStuckEvents()
    .then(() => {
        console.log(' Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error(' Script failed:', error);
        process.exit(1);
    });
