import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  coverImage: {
    url: string;
    publicId: string;
  };
  images: Array<{
    url: string;
    publicId: string;
  }>;
  location: {
    venue: string;
    city: string;
    country?: string; // ADD THIS
  };
  startDate: Date;
  endDate?: Date;
  category?: string;
  tags: string[];
  organizer: mongoose.Types.ObjectId;
  price?: {
    amount: number;
    currency: string;
  };
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isFeatured: boolean;
  capacity?: number; // ADD THIS
  registrationRequired?: boolean; // ADD THIS
  registrationDeadline?: Date; // ADD THIS
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
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
        validator: function (this: IEvent, value: Date) {
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Create slug from title before validation
eventSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Update slug if title changes
eventSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for better query performance
eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isFeatured: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);