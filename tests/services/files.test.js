/**
 * Module: files.test.js
 * Purpose: Tests for files service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as filesService from '../../src/services/files';
import { request, buildHeaders } from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api', () => ({
  request: jest.fn(),
  buildHeaders: jest.fn()
}));

describe('Files Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildHeaders.mockReturnValue({});
  });

  describe('uploadCSV', () => {
    test('uploads CSV file', async () => {
      const mockFile = new File(['name,email\nJohn,john@example.com'], 'test.csv', { type: 'text/csv' });
      const mockResponse = {
        data: [{ name: 'John', email: 'john@example.com' }]
      };

      request.mockResolvedValueOnce(mockResponse);

      const result = await filesService.uploadCSV(mockFile);

      expect(request).toHaveBeenCalledWith(
        'POST',
        '/files/csv',
        expect.any(FormData),
        { headers: {} }
      );
      expect(result).toEqual(mockResponse);
    });

    test('includes file in FormData', async () => {
      const mockFile = new File(['data'], 'test.csv', { type: 'text/csv' });
      request.mockResolvedValueOnce({ data: [] });

      await filesService.uploadCSV(mockFile);

      const callArgs = request.mock.calls[0];
      const formData = callArgs[2];

      expect(formData).toBeInstanceOf(FormData);
    });

    test('uses null content-type for FormData', async () => {
      const mockFile = new File(['data'], 'test.csv');
      request.mockResolvedValueOnce({ data: [] });

      await filesService.uploadCSV(mockFile);

      expect(buildHeaders).toHaveBeenCalledWith(null);
    });

    test('handles invalid CSV format error', async () => {
      const mockFile = new File(['invalid csv'], 'test.csv');
      request.mockRejectedValueOnce(new Error('Invalid CSV format'));

      await expect(filesService.uploadCSV(mockFile)).rejects.toThrow('Invalid CSV format');
    });

    test('handles large CSV file', async () => {
      const largeData = Array(1000).fill('name,email\n').join('');
      const mockFile = new File([largeData], 'large.csv', { type: 'text/csv' });
      request.mockResolvedValueOnce({ data: [] });

      const result = await filesService.uploadCSV(mockFile);

      expect(request).toHaveBeenCalled();
      expect(result).toEqual({ data: [] });
    });
  });

  describe('uploadImage', () => {
    test('uploads image file', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        url: 'https://example.com/uploads/test.jpg',
        filename: 'test_123456.jpg'
      };

      request.mockResolvedValueOnce(mockResponse);

      const result = await filesService.uploadImage(mockFile);

      expect(request).toHaveBeenCalledWith(
        'POST',
        '/files/image',
        expect.any(FormData),
        { headers: {} }
      );
      expect(result).toEqual(mockResponse);
    });

    test('supports PNG format', async () => {
      const mockFile = new File(['png data'], 'test.png', { type: 'image/png' });
      request.mockResolvedValueOnce({ url: 'https://example.com/test.png', filename: 'test.png' });

      const result = await filesService.uploadImage(mockFile);

      expect(result.url).toContain('.png');
    });

    test('supports GIF format', async () => {
      const mockFile = new File(['gif data'], 'test.gif', { type: 'image/gif' });
      request.mockResolvedValueOnce({ url: 'https://example.com/test.gif', filename: 'test.gif' });

      const result = await filesService.uploadImage(mockFile);

      expect(result.url).toContain('.gif');
    });

    test('supports WebP format', async () => {
      const mockFile = new File(['webp data'], 'test.webp', { type: 'image/webp' });
      request.mockResolvedValueOnce({ url: 'https://example.com/test.webp', filename: 'test.webp' });

      const result = await filesService.uploadImage(mockFile);

      expect(result.url).toContain('.webp');
    });

    test('includes image in FormData', async () => {
      const mockFile = new File(['image'], 'test.jpg');
      request.mockResolvedValueOnce({ url: '', filename: '' });

      await filesService.uploadImage(mockFile);

      const callArgs = request.mock.calls[0];
      const formData = callArgs[2];

      expect(formData).toBeInstanceOf(FormData);
    });

    test('uses null content-type for FormData', async () => {
      const mockFile = new File(['image'], 'test.jpg');
      request.mockResolvedValueOnce({ url: '', filename: '' });

      await filesService.uploadImage(mockFile);

      expect(buildHeaders).toHaveBeenCalledWith(null);
    });

    test('handles invalid image format error', async () => {
      const mockFile = new File(['data'], 'test.txt', { type: 'text/plain' });
      request.mockRejectedValueOnce(new Error('Invalid image format'));

      await expect(filesService.uploadImage(mockFile)).rejects.toThrow('Invalid image format');
    });

    test('handles file too large error', async () => {
      const mockFile = new File(['data'], 'huge.jpg');
      request.mockRejectedValueOnce(new Error('File too large'));

      await expect(filesService.uploadImage(mockFile)).rejects.toThrow('File too large');
    });

    test('returns uploaded image URL', async () => {
      const mockFile = new File(['image'], 'test.jpg');
      const mockResponse = {
        url: 'https://cdn.example.com/images/abc123.jpg',
        filename: 'abc123.jpg'
      };

      request.mockResolvedValueOnce(mockResponse);

      const result = await filesService.uploadImage(mockFile);

      expect(result.url).toBe('https://cdn.example.com/images/abc123.jpg');
      expect(result.filename).toBe('abc123.jpg');
    });
  });

  describe('error handling', () => {
    test('handles network error in CSV upload', async () => {
      const mockFile = new File(['data'], 'test.csv');
      request.mockRejectedValueOnce(new Error('Network error'));

      await expect(filesService.uploadCSV(mockFile)).rejects.toThrow('Network error');
    });

    test('handles network error in image upload', async () => {
      const mockFile = new File(['data'], 'test.jpg');
      request.mockRejectedValueOnce(new Error('Network error'));

      await expect(filesService.uploadImage(mockFile)).rejects.toThrow('Network error');
    });

    test('handles permission denied error', async () => {
      const mockFile = new File(['data'], 'test.csv');
      request.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(filesService.uploadCSV(mockFile)).rejects.toThrow('Permission denied');
    });
  });
});
