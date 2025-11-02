"use strict";
/**
 * Scheduler Service - Development Entry Point
 *
 * This file provides a unified entry point for development mode.
 * In production, use specific component entry points:
 * - npm run start:api
 * - npm run start:materializer
 * - npm run start:worker
 * - npm run start:publisher
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const COMPONENT = process.env.COMPONENT || 'api';
console.log(`🚀 Starting Scheduler Service in development mode...`);
console.log(`📦 Component: ${COMPONENT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('');
// Dynamically import the appropriate component
async function start() {
    try {
        switch (COMPONENT.toLowerCase()) {
            case 'api':
                console.log('🔌 Starting API Server...');
                await Promise.resolve().then(() => __importStar(require('./api')));
                break;
            case 'materializer':
                console.log('⚙️  Starting Materializer Worker...');
                await Promise.resolve().then(() => __importStar(require('./materializer')));
                break;
            case 'worker':
                console.log('👷 Starting Execution Worker...');
                await Promise.resolve().then(() => __importStar(require('./worker')));
                break;
            case 'publisher':
                console.log('📤 Starting Outbox Publisher...');
                await Promise.resolve().then(() => __importStar(require('./publisher')));
                break;
            default:
                console.error(`❌ Unknown component: ${COMPONENT}`);
                console.error('Valid components: api, materializer, worker, publisher');
                process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ Failed to start component:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
// Start the service
start();
//# sourceMappingURL=index.js.map