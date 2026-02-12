/**
 * Image compression utility
 */
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return await toBase64(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function validateImageSize(file: File): boolean {
  const maxSize = 100 * 1024; // 100KB
  return file.size <= maxSize;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
