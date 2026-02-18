"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_js_1 = require("../controllers/authController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = express_1.default.Router();
router.post('/login', authController_js_1.login);
router.post('/create-admin', auth_js_1.authenticate, (0, auth_js_1.authorize)('super_admin', 'admin'), authController_js_1.createAdmin);
router.get('/users', auth_js_1.authenticate, (0, auth_js_1.authorize)('super_admin', 'admin'), authController_js_1.getAllAdmins);
router.get('/me', auth_js_1.authenticate, authController_js_1.getMe);
router.delete('/users/:id', auth_js_1.authenticate, (0, auth_js_1.authorize)('super_admin', 'admin'), authController_js_1.deleteAdmin);
exports.default = router;
//# sourceMappingURL=auth.js.map