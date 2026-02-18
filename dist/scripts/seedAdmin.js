"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const Admin_js_1 = __importDefault(require("../models/Admin.js"));
const database_js_1 = require("../config/database.js");
dotenv_1.default.config();
const seedMasterAdmin = async () => {
    try {
        await (0, database_js_1.connectDatabase)();
        const email = 'master@khuza.com';
        const password = 'SecurePassword123!';
        const name = 'Master Admin';
        const existingAdmin = await Admin_js_1.default.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists. Deleting and re-seeding to fix hash...');
            await Admin_js_1.default.deleteOne({ email });
        }
        await Admin_js_1.default.create({
            name,
            email,
            password,
            role: 'super_admin',
            isActive: true,
        });
        console.log(`
    ✅ Master Admin created successfully!
    📧 Email: ${email}
    🔑 Password: ${password}
    `);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};
seedMasterAdmin();
//# sourceMappingURL=seedAdmin.js.map