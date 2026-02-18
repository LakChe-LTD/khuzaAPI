"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
const blogController_js_1 = require("../controllers/blogController.js");
const router = express_1.default.Router();
router.get('/', blogController_js_1.getBlogs);
router.get('/recent/:limit?', blogController_js_1.getRecentBlogs);
router.get('/category/:category', blogController_js_1.getBlogsByCategory);
router.get('/:id', blogController_js_1.getBlog);
router.post('/', auth_js_1.authenticate, upload_js_1.uploadSingle, blogController_js_1.createBlog);
router.put('/:id', auth_js_1.authenticate, upload_js_1.uploadSingle, blogController_js_1.updateBlog);
router.delete('/:id', auth_js_1.authenticate, blogController_js_1.deleteBlog);
exports.default = router;
//# sourceMappingURL=blog.js.map