/**
 * Module: utils/imageUtils.js
 * Purpose: Image processing utilities for event story HTML
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Replace image placeholders in HTML with base64 data URIs
 * - Automatic image type detection (PNG, JPEG, GIF)
 * - Preserve HTML attributes during replacement
 *
 * @since 2025-11-20
 */

/**
 * Replace {{EVENT_IMAGE}} placeholder with actual base64 image in story HTML
 *
 * Searches for <img src="{{EVENT_IMAGE}}" /> tags in HTML and replaces them
 * with actual base64 data URIs. Automatically detects image type (PNG/JPEG/GIF)
 * from base64 prefix and creates appropriate data URI.
 *
 * @param {string} html - Story HTML containing {{EVENT_IMAGE}} placeholders
 * @param {string} imageData - Base64-encoded image data (without data URI prefix)
 * @returns {string} HTML with replaced <img> tags containing data URIs
 *
 * @example
 * // Replace placeholder with PNG image
 * const html = '<div><img src="{{EVENT_IMAGE}}" alt="Story" /></div>';
 * const base64 = 'iVBORw0KGgoAAAANSUhEUgA...'; // PNG data
 * const result = replaceImagePlaceholder(html, base64);
 * // Returns: '<div><img src="data:image/png;base64,iVBORw0..." alt="Story" /></div>'
 *
 * @example
 * // Multiple placeholders with JPEG
 * const html = `
 *   <h1>Story</h1>
 *   <img src="{{EVENT_IMAGE}}" class="hero" alt="Hero" />
 *   <p>Text content</p>
 *   <img src="{{EVENT_IMAGE}}" class="banner" alt="Banner" />
 * `;
 * const jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD...';
 * const result = replaceImagePlaceholder(html, jpeg);
 * // Both placeholders replaced with same image data URI
 *
 * @note Supports PNG (iVBOR prefix), JPEG (/9j/ prefix), and GIF (R0lGOD prefix)
 * @note Preserves all other attributes (alt, class, style) from original img tag
 * @note Case-insensitive placeholder matching
 * @security Image data is embedded as data URI, not external URL (XSS safe)
 * @performance For large images, consider lazy loading or thumbnail generation
 */
export function replaceImagePlaceholder(html, imageData) {
    // Validate inputs
    if (!html || !imageData) {
        return html;
    }

    // Detect image type from base64 prefix
    // PNG starts with: iVBOR (base64 of 89 50 4E 47)
    // JPEG starts with: /9j/ (base64 of FF D8 FF)
    // GIF starts with: R0lGOD (base64 of 47 49 46)
    let mimeType = 'image/jpeg'; // Default fallback

    if (imageData.startsWith('iVBOR')) {
        mimeType = 'image/png';
    } else if (imageData.startsWith('/9j/')) {
        mimeType = 'image/jpeg';
    } else if (imageData.startsWith('R0lGOD')) {
        mimeType = 'image/gif';
    }

    // Create the base64 data URI
    const dataUri = `data:${mimeType};base64,${imageData}`;

    // Replace all instances of <img src="{{EVENT_IMAGE}}" ... />
    // Regex breakdown:
    // - <img\s+ : Match opening img tag with whitespace
    // - ([^>]*\s+)? : Optionally capture attributes before src
    // - src=["']{{EVENT_IMAGE}}["'] : Match placeholder in src attribute
    // - ([^>]*) : Capture any attributes after src
    // - > : Match closing bracket
    // - gi : Global (all matches), case-insensitive
    return html.replace(
        /<img\s+([^>]*\s+)?src=["']{{EVENT_IMAGE}}["']([^>]*)>/gi,
        (match, beforeSrc, afterSrc) => {
            // Preserve other attributes from the original tag
            const before = beforeSrc || '';
            const after = afterSrc || '';
            return `<img ${before}src="${dataUri}"${after}>`;
        }
    );
}

/**
 * Detect image MIME type from base64 data
 *
 * @param {string} base64Data - Base64-encoded image data
 * @returns {string} MIME type (image/png, image/jpeg, or image/gif)
 *
 * @example
 * detectImageType('iVBORw0KGgo...') // Returns: 'image/png'
 * detectImageType('/9j/4AAQSkZ...') // Returns: 'image/jpeg'
 */
export function detectImageType(base64Data) {
    if (!base64Data) {
        return 'image/jpeg'; // Default
    }

    if (base64Data.startsWith('iVBOR')) {
        return 'image/png';
    } else if (base64Data.startsWith('/9j/')) {
        return 'image/jpeg';
    } else if (base64Data.startsWith('R0lGOD')) {
        return 'image/gif';
    }

    return 'image/jpeg'; // Default fallback
}

/**
 * Create data URI from base64 image data
 *
 * @param {string} base64Data - Base64-encoded image data
 * @param {string} [mimeType] - Optional MIME type (auto-detected if not provided)
 * @returns {string} Complete data URI
 *
 * @example
 * createDataUri('iVBORw0...') // Returns: 'data:image/png;base64,iVBORw0...'
 * createDataUri('base64data', 'image/jpeg') // Returns: 'data:image/jpeg;base64,base64data'
 */
export function createDataUri(base64Data, mimeType = null) {
    if (!base64Data) {
        return '';
    }

    const type = mimeType || detectImageType(base64Data);
    return `data:${type};base64,${base64Data}`;
}
