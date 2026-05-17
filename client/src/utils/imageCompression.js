// ============================================================
// Image Compression Utility
// Reduces image file size before upload to speed up transmission
// ============================================================

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default 1200)
 * @param {number} maxHeight - Maximum height in pixels (default 1200)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = async (
  file,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      resolve(file); // Return original if not an image
      return;
    }

    // For very small images, skip compression
    if (file.size < 100 * 1024) {
      // Less than 100KB
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            // Create a new File object with the compressed blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(
              `Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};
