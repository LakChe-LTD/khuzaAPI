"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateISO = exports.formatDate = exports.formatEventForDetail = exports.formatEventForList = exports.formatBlogForDetail = exports.formatBlogForList = void 0;
const formatBlogForList = (blog) => {
    return {
        id: blog._id.toString(),
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        highlightedQuote: blog.highlightedQuote,
        excerpt: blog.excerpt || blog.content?.substring(0, 200),
        featuredImage: {
            url: blog.featuredImage.url,
            publicId: blog.featuredImage.publicId,
        },
        category: blog.category,
        tags: blog.tags,
        author: {
            name: blog.author?.name || 'Admin',
            email: blog.author?.email,
        },
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
        formattedDate: (0, exports.formatDate)(blog.publishedAt || blog.createdAt),
        views: blog.views,
        status: blog.status,
    };
};
exports.formatBlogForList = formatBlogForList;
const formatBlogForDetail = (blog) => {
    return {
        id: blog._id.toString(),
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        highlightedQuote: blog.highlightedQuote,
        excerpt: blog.excerpt || blog.content?.substring(0, 200),
        featuredImage: {
            url: blog.featuredImage.url,
            publicId: blog.featuredImage.publicId,
        },
        category: blog.category,
        tags: blog.tags,
        author: {
            name: blog.author?.name || 'Admin',
            email: blog.author?.email,
        },
        publishedAt: blog.publishedAt,
        formattedDate: (0, exports.formatDate)(blog.publishedAt || blog.createdAt),
        views: blog.views,
        status: blog.status,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
    };
};
exports.formatBlogForDetail = formatBlogForDetail;
const formatEventForList = (event) => {
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
        formattedStartDate: (0, exports.formatDate)(event.startDate),
        formattedEndDate: event.endDate ? (0, exports.formatDate)(event.endDate) : null,
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
exports.formatEventForList = formatEventForList;
const formatEventForDetail = (event) => {
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
        formattedStartDate: (0, exports.formatDate)(event.startDate),
        formattedEndDate: event.endDate ? (0, exports.formatDate)(event.endDate) : null,
        category: event.category,
        tags: event.tags,
        organizer: {
            name: event.organizer?.name || 'Admin',
            email: event.organizer?.email,
        },
        status: event.status,
        isFeatured: event.isFeatured,
        capacity: event.capacity,
        registrationRequired: event.registrationRequired || false,
        registrationDeadline: event.registrationDeadline,
        formattedRegistrationDeadline: event.registrationDeadline
            ? (0, exports.formatDate)(event.registrationDeadline)
            : null,
        price: event.price,
        views: event.views,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
    };
};
exports.formatEventForDetail = formatEventForDetail;
const formatDate = (date) => {
    const d = new Date(date);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return d.toLocaleDateString('en-US', options);
};
exports.formatDate = formatDate;
const formatDateISO = (date) => {
    return new Date(date).toISOString();
};
exports.formatDateISO = formatDateISO;
//# sourceMappingURL=responseFormatter.js.map