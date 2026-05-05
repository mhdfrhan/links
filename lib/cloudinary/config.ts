export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
export const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

interface UploadOptions {
  folder?: string;
  onProgress?: (percent: number) => void;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

export async function uploadToCloudinary(
  file: Blob,
  options: UploadOptions = {}
): Promise<CloudinaryResponse> {
  const { folder = "portfolio", onProgress } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload gagal: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload gagal: Network error"));
    xhr.send(formData);
  });
}

export function getCloudinaryUrl(publicId: string, transforms?: string): string {
  if (transforms) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
}
