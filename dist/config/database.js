"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDatabase = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.config.mongodb.uri);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ MongoDB Connection Error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB Disconnected');
        });
    }
    catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=database.js.map