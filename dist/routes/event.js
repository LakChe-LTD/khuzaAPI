"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController_js_1 = require("../controllers/eventController.js");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
const router = express_1.default.Router();
router.get('/', eventController_js_1.getEvents);
router.get('/:id', eventController_js_1.getEvent);
router.post('/', auth_js_1.authenticate, upload_js_1.uploadMultiple, eventController_js_1.createEvent);
router.put('/:id', auth_js_1.authenticate, upload_js_1.uploadMultiple, eventController_js_1.updateEvent);
router.delete('/:id', auth_js_1.authenticate, eventController_js_1.deleteEvent);
exports.default = router;
//# sourceMappingURL=event.js.map