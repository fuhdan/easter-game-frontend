/**
 * Module: imageUtils.test.js
 * Purpose: Tests for image utilities
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import { replaceImagePlaceholder, detectImageType, createDataUri } from '../../src/utils/imageUtils';

describe('Image Utils', () => {
  describe('detectImageType', () => {
    test('detects PNG from prefix', () => {
      expect(detectImageType('iVBORw0KGgoAAAA')).toBe('image/png');
    });

    test('detects JPEG from prefix', () => {
      expect(detectImageType('/9j/4AAQSkZJRg')).toBe('image/jpeg');
    });

    test('detects GIF from prefix', () => {
      expect(detectImageType('R0lGODlhAQABAI')).toBe('image/gif');
    });

    test('defaults to JPEG for unknown prefix', () => {
      expect(detectImageType('unknownprefix')).toBe('image/jpeg');
    });

    test('defaults to JPEG for empty string', () => {
      expect(detectImageType('')).toBe('image/jpeg');
    });

    test('defaults to JPEG for null', () => {
      expect(detectImageType(null)).toBe('image/jpeg');
    });
  });

  describe('createDataUri', () => {
    test('creates data URI for PNG', () => {
      const result = createDataUri('iVBORw0data');
      expect(result).toBe('data:image/png;base64,iVBORw0data');
    });

    test('creates data URI for JPEG', () => {
      const result = createDataUri('/9j/data');
      expect(result).toBe('data:image/jpeg;base64,/9j/data');
    });

    test('creates data URI for GIF', () => {
      const result = createDataUri('R0lGODdata');
      expect(result).toBe('data:image/gif;base64,R0lGODdata');
    });

    test('uses explicit MIME type when provided', () => {
      const result = createDataUri('anydata', 'image/png');
      expect(result).toBe('data:image/png;base64,anydata');
    });

    test('returns empty string for empty data', () => {
      expect(createDataUri('')).toBe('');
    });

    test('returns empty string for null data', () => {
      expect(createDataUri(null)).toBe('');
    });
  });

  describe('replaceImagePlaceholder', () => {
    test('replaces single placeholder with PNG', () => {
      const html = '<img src="{{EVENT_IMAGE}}" alt="test" />';
      const result = replaceImagePlaceholder(html, 'iVBORdata');
      expect(result).toContain('data:image/png;base64,iVBORdata');
      expect(result).toContain('alt="test"');
    });

    test('replaces multiple placeholders', () => {
      const html = '<img src="{{EVENT_IMAGE}}" /><img src="{{EVENT_IMAGE}}" />';
      const result = replaceImagePlaceholder(html, 'data123');
      const matches = result.match(/data:image/g);
      expect(matches).toHaveLength(2);
    });

    test('preserves attributes before src', () => {
      const html = '<img class="hero" id="img1" src="{{EVENT_IMAGE}}" />';
      const result = replaceImagePlaceholder(html, 'data');
      expect(result).toContain('class="hero"');
      expect(result).toContain('id="img1"');
    });

    test('preserves attributes after src', () => {
      const html = '<img src="{{EVENT_IMAGE}}" class="banner" style="width:100%" />';
      const result = replaceImagePlaceholder(html, 'data');
      expect(result).toContain('class="banner"');
      expect(result).toContain('style="width:100%"');
    });

    test('handles case-insensitive matching', () => {
      const html = '<img SRC="{{event_image}}" />';
      const result = replaceImagePlaceholder(html, 'data');
      expect(result).toContain('data:image');
    });

    test('detects JPEG type', () => {
      const html = '<img src="{{EVENT_IMAGE}}" />';
      const result = replaceImagePlaceholder(html, '/9j/jpegdata');
      expect(result).toContain('data:image/jpeg');
    });

    test('detects GIF type', () => {
      const html = '<img src="{{EVENT_IMAGE}}" />';
      const result = replaceImagePlaceholder(html, 'R0lGODgif');
      expect(result).toContain('data:image/gif');
    });

    test('defaults to JPEG for unknown type', () => {
      const html = '<img src="{{EVENT_IMAGE}}" />';
      const result = replaceImagePlaceholder(html, 'unknowndata');
      expect(result).toContain('data:image/jpeg');
    });

    test('returns unchanged HTML if no placeholder', () => {
      const html = '<div>No images here</div>';
      const result = replaceImagePlaceholder(html, 'data');
      expect(result).toBe(html);
    });

    test('returns original HTML if imageData is null', () => {
      const html = '<img src="{{EVENT_IMAGE}}" />';
      const result = replaceImagePlaceholder(html, null);
      expect(result).toBe(html);
    });

    test('returns original HTML if html is empty', () => {
      const result = replaceImagePlaceholder('', 'data');
      expect(result).toBe('');
    });

    test('returns original HTML if html is null', () => {
      const result = replaceImagePlaceholder(null, 'data');
      expect(result).toBe(null);
    });

    test('preserves complex HTML structure', () => {
      const html = `
        <div class="story">
          <h1>Title</h1>
          <img src="{{EVENT_IMAGE}}" class="hero" alt="Hero image" />
          <p>Story content</p>
          <img src="{{EVENT_IMAGE}}" class="footer" />
        </div>
      `;
      const result = replaceImagePlaceholder(html, 'data');
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Story content</p>');
      expect(result).toContain('class="hero"');
      expect(result).toContain('class="footer"');
    });
  });
});
