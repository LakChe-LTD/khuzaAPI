"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const eventSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    coverImage: {
        url: {
            type: String,
            required: [true, 'Cover image URL is required'],
        },
        publicId: {
            type: String,
            required: [true, 'Cover image public ID is required'],
        },
    },
    images: [
        {
            url: String,
            publicId: String,
        },
    ],
    location: {
        venue: {
            type: String,
            required: [true, 'Venue is required'],
        },
        city: {
            type: String,
            required: [true, 'City is required'],
        },
        country: {
            type: String,
        },
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value >= this.startDate;
            },
            message: 'End date must be after start date',
        },
    },
    category: {
        type: String,
        trim: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    organizer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Admin',
        required: [true, 'Organizer is required'],
    },
    price: {
        amount: {
            type: Number,
            min: [0, 'Price cannot be negative'],
        },
        currency: {
            type: String,
            default: 'USD',
        },
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    capacity: {
        type: Number,
        min: [0, 'Capacity cannot be negative'],
    },
    registrationRequired: {
        type: Boolean,
        default: false,
    },
    registrationDeadline: {
        type: Date,
    },
    views: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
eventSchema.pre('validate', function (next) {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});
eventSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});
eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isFeatured: 1 });
exports.default = mongoose_1.default.model('Event', eventSchema);
//# sourceMappingURL=Event.js.map