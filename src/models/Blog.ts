import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  highlightedQuote?: string;
  featuredImage: {
    url: string;
    publicId: string;
  };
  author: mongoose.Types.ObjectId;
  category?: string;
  tags: string[];
  publishDate?: Date;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
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
      // Remove required: true to let pre-validate hook handle it
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    highlightedQuote: {
      type: String,
      maxlength: [500, 'Highlighted quote cannot exceed 500 characters'],
    },
    featuredImage: {
      url: {
        type: String,
        required: [true, 'Featured image URL is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Featured image public ID is required'],
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Author is required'],
    },
    category: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    publishDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
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
blogSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Update slug if title changes and set publishedAt
blogSchema.pre('save', function (next) {
  // Update slug if title changes
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Index for better query performance
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });

export default mongoose.model<IBlog>('Blog', blogSchema);