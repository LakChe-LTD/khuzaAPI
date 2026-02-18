"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.getMe = exports.getAllAdmins = exports.login = exports.createAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const Admin_js_1 = __importDefault(require("../models/Admin.js"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, env_js_1.config.jwt.secret, {
        expiresIn: env_js_1.config.jwt.expiresIn,
    });
};
const createAdmin = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const existingAdmin = await Admin_js_1.default.findOne({ email });
        if (existingAdmin) {
            res.status(400).json({ success: false, message: 'Admin already exists' });
            return;
        }
        const admin = await Admin_js_1.default.create({
            email,
            password,
            name,
            role: role || 'admin',
            isActive: true,
        });
        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            data: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createAdmin = createAdmin;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Please provide email and password' });
            return;
        }
        const admin = await Admin_js_1.default.findOne({ email }).select('+password');
        if (!admin || !(await admin.comparePassword(password))) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        if (!admin.isActive) {
            res.status(403).json({ success: false, message: 'Account is inactive' });
            return;
        }
        const token = generateToken(admin._id.toString());
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
                token,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};
exports.login = login;
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin_js_1.default.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: admins });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch admins' });
    }
};
exports.getAllAdmins = getAllAdmins;
const getMe = async (req, res) => {
    try {
        res.status(200).json({ success: true, data: { admin: req.admin } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
};
exports.getMe = getMe;
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.admin?._id.toString() === id) {
            res.status(400).json({ success: false, message: 'You cannot delete your own account' });
            return;
        }
        const admin = await Admin_js_1.default.findById(id);
        if (!admin) {
            res.status(404).json({ success: false, message: 'Admin not found' });
            return;
        }
        if (admin.role === 'super_admin') {
            res.status(403).json({ success: false, message: 'Cannot delete super admin account' });
            return;
        }
        await Admin_js_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete admin' });
    }
};
exports.deleteAdmin = deleteAdmin;
//# sourceMappingURL=authController.js.map