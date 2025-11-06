import { describe, it, expect } from 'vitest';
import { getObjectNameFromUrl } from '../storage';

describe('Storage utilities', () => {
  describe('getObjectNameFromUrl', () => {
    it('should extract object name from MinIO URL', () => {
      const url =
        'http://localhost:9000/memoire-dame/audio/1234567890-test.mp3';
      const objectName = getObjectNameFromUrl(url);
      expect(objectName).toBe('audio/1234567890-test.mp3');
    });

    it('should handle URLs with multiple path segments', () => {
      const url =
        'http://localhost:9000/memoire-dame/media/photos/family/image.jpg';
      const objectName = getObjectNameFromUrl(url);
      expect(objectName).toBe('media/photos/family/image.jpg');
    });
  });
});
