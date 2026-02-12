import { IBlog } from "../models/Blog.js";
import { IEvent } from "../models/Event.js";

export const formatBlogForList = (blog: IBlog) => {
  return {
    id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    highlightedQuote: blog.highlightedQuote,
    excerpt: (blog as any).excerpt || blog.content?.substring(0, 200), // Temporary fix
    featuredImage: {
      url: blog.featuredImage.url,
      publicId: blog.featuredImage.publicId,
    },
    category: blog.category,
    tags: blog.tags,
    author: {
      name: (blog.author as any)?.name || 'Admin',
      email: (blog.author as any)?.email,
    },
    publishedAt: blog.publishedAt,
    createdAt: blog.createdAt,
    formattedDate: formatDate(blog.publishedAt || blog.createdAt),
    views: blog.views,
    status: blog.status,
  };
};

export const formatBlogForDetail = (blog: IBlog) => {
  return {
    id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    highlightedQuote: blog.highlightedQuote,
    excerpt: (blog as any).excerpt || blog.content?.substring(0, 200), // Temporary fix
    featuredImage: {
      url: blog.featuredImage.url,
      publicId: blog.featuredImage.publicId,
    },
    category: blog.category,
    tags: blog.tags,
    author: {
      name: (blog.author as any)?.name || 'Admin',
      email: (blog.author as any)?.email,
    },
    publishedAt: blog.publishedAt,
    formattedDate: formatDate(blog.publishedAt || blog.createdAt),
    views: blog.views,
    status: blog.status,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
};

/**
 * Format event for listing view
 */
export const formatEventForList = (event: IEvent) => {
  return {
    id: event._id.toString(),
    title: event.title,
    slug: event.slug,
    description: event.description.length > 200
      ? event.description.substring(0, 200) + '...'
      : event.description,
    coverImage: {
      url: event.coverImage.url,
      publicId: event.coverImage.publicId,
    },
    location: {
      venue: event.location.venue,
      city: event.location.city,
      country: event.location.country || '',
    },
    startDate: event.startDate,
    endDate: event.endDate,
    formattedStartDate: formatDate(event.startDate),
    formattedEndDate: event.endDate ? formatDate(event.endDate) : null,
    category: event.category,
    tags: event.tags,
    status: event.status,
    isFeatured: event.isFeatured,
    capacity: event.capacity,
    registrationRequired: event.registrationRequired || false,
    price: event.price,
    views: event.views,
  };
};

/**
 * Format event for detail view
 */
export const formatEventForDetail = (event: IEvent) => {
  return {
    id: event._id.toString(),
    title: event.title,
    slug: event.slug,
    description: event.description,
    coverImage: {
      url: event.coverImage.url,
      publicId: event.coverImage.publicId,
    },
    images: event.images.map((img) => ({
      url: img.url,
      publicId: img.publicId,
    })),
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    formattedStartDate: formatDate(event.startDate),
    formattedEndDate: event.endDate ? formatDate(event.endDate) : null,
    category: event.category,
    tags: event.tags,
    organizer: {
      name: (event.organizer as any)?.name || 'Admin',
      email: (event.organizer as any)?.email,
    },
    status: event.status,
    isFeatured: event.isFeatured,
    capacity: event.capacity,
    registrationRequired: event.registrationRequired || false,
    registrationDeadline: event.registrationDeadline,
    formattedRegistrationDeadline: event.registrationDeadline
      ? formatDate(event.registrationDeadline)
      : null,
    price: event.price,
    views: event.views,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};

/**
 * Format date to match your frontend format (e.g., "March 15, 2024")
 */
export const formatDate = (date: Date): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format date for API responses (ISO format)
 */
export const formatDateISO = (date: Date): string => {
  return new Date(date).toISOString();
};