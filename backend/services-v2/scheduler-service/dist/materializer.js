"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const SupabaseClientFactory_1 = require("./infrastructure/database/SupabaseClientFactory");
const SupabaseScheduleRepository_1 = require("./infrastructure/persistence/SupabaseScheduleRepository");
const SupabaseScheduleRunRepository_1 = require("./infrastructure/persistence/SupabaseScheduleRunRepository");
const MaterializerWorker_1 = require("./infrastructure/workers/MaterializerWorker");
dotenv_1.default.config();
async function bootstrap() {
    try {
        console.log('🚀 Starting Materializer Worker...');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }
        const supabase = SupabaseClientFactory_1.SupabaseClientFactory.create({
            url: supabaseUrl,
            serviceRoleKey: supabaseServiceKey,
            schema: 'scheduler'
        });
        const scheduleRepo = new SupabaseScheduleRepository_1.SupabaseScheduleRepository(supabase);
        const runRepo = new SupabaseScheduleRunRepository_1.SupabaseScheduleRunRepository(supabase);
        const config = {
            interval: parseInt(process.env.MATERIALIZER_INTERVAL || '60000'),
            lookaheadHours: parseInt(process.env.MATERIALIZER_LOOKAHEAD_HOURS || '48'),
            batchSize: parseInt(process.env.MATERIALIZER_BATCH_SIZE || '100'),
            numSegments: parseInt(process.env.NUM_SEGMENTS || '10')
        };
        const worker = new MaterializerWorker_1.MaterializerWorker(scheduleRepo, runRepo, config);
        await worker.start();
        process.on('SIGTERM', async () => {
            console.log('🛑 SIGTERM received, shutting down gracefully...');
            await worker.stop();
            await SupabaseClientFactory_1.SupabaseClientFactory.close();
            console.log('✅ Materializer Worker stopped');
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            console.log('🛑 SIGINT received, shutting down gracefully...');
            await worker.stop();
            await SupabaseClientFactory_1.SupabaseClientFactory.close();
            console.log('✅ Materializer Worker stopped');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to start Materializer Worker:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=materializer.js.map