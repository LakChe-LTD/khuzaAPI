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
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  startDate: Date;
  endDate: Date;
  category: string;
  tags: string[];
  organizer: mongoose.Types.ObjectId;
  capacity?: number;
  registrationRequired: boolean;
  registrationDeadline?: Date;
  price?: {
    amount: number;
    currency: string;
  };
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isFeatured: boolean;
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
      required: true,
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
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IEvent, value: Date) {
          return value >= this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
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
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
    },
    registrationRequired: {
      type: Boolean,
      default: false,
    },
    registrationDeadline: {
      type: Date,
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
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from title before saving
eventSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for better query performance
eventSchema.index({ slug: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isFeatured: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);