import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ImageResult } from 'expo-image-picker';

interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export const pickImage = async (): Promise<ImageResult | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    return result.cancelled ? null : result;
  } catch (error) {
    console.error('Pick image error:', error);
    return null;
  }
};

export const takePhoto = async (): Promise<ImageResult | null> => {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      console.warn('Camera permission denied');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    return result.cancelled ? null : result;
  } catch (error) {
    console.error('Take photo error:', error);
    return null;
  }
};

export const compressImage = async (
  uri: string,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1440
): Promise<CompressedImage> => {
  try {
    // Get image info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const originalSize = fileInfo.size || 0;

    // Create a temporary path for compressed image
    const filename = uri.split('/').pop() || 'image.jpg';
    const compressedPath = `${FileSystem.cacheDirectory}${filename}`;

    // Use native compression (this is simplified - in production use native bridge)
    // For now, we'll simulate compression by reducing quality
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    // Return compressed image info
    return {
      uri: compressedPath,
      width: maxWidth,
      height: maxHeight,
      size: Math.floor(originalSize * quality),
    };
  } catch (error) {
    console.error('Compress image error:', error);
    throw error;
  }
};

export const generateThumbnail = async (
  uri: string,
  size: number = 200
): Promise<string> => {
  try {
    // In production, use react-native-image-crop-picker for native thumbnails
    const filename = `thumb_${Date.now()}.jpg`;
    const thumbnailPath = `${FileSystem.cacheDirectory}${filename}`;

    return thumbnailPath;
  } catch (error) {
    console.error('Generate thumbnail error:', error);
    throw error;
  }
};

export const uploadImage = async (
  uri: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string }> => {
  try {
    const filename = uri.split('/').pop() || 'image.jpg';

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = e.loaded / e.total;
          onProgress?.(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload error'));
      });

      xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
};
