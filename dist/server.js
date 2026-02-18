"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const blog_1 = __importDefault(require("./routes/blog"));
const event_1 = __importDefault(require("./routes/event"));
const errorHandler_1 = require("./middleware/errorHandler");
(0, env_1.validateEnv)();
const app = (0, express_1.default)();
(0, database_1.connectDatabase)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.config.cors.origin,
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Khuza API is active and healthy',
        timestamp: new Date().toISOString()
    });
});
app.use('/api', limiter);
app.use('/api/auth', auth_1.default);
app.use('/api/blogs', blog_1.default);
app.use('/api/events', event_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = Number(env_1.config.port) || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
//# sourceMappingURL=server.js.map