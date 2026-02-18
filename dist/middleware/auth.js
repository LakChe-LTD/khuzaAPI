"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_js_1 = __importDefault(require("../models/Admin.js"));
const env_js_1 = require("../config/env.js");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided. Authentication required.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwt.secret);
        const admin = await Admin_js_1.default.findById(decoded.id).select('-password');
        if (!admin) {
            res.status(401).json({
                success: false,
                message: 'Admin not found. Invalid token.',
            });
            return;
        }
        if (!admin.isActive) {
            res.status(403).json({
                success: false,
                message: 'Admin account is inactive.',
            });
            return;
        }
        req.admin = admin;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.admin || !roles.includes(req.admin.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.',
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map