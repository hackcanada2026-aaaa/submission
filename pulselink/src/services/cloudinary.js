import { Cloudinary } from '@cloudinary/url-gen';
import { quality, format } from '@cloudinary/url-gen/actions/delivery';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cld = new Cloudinary({
  cloud: { cloudName }
});

export const getVideo = (publicId) => {
  return cld.video(publicId).delivery(quality('auto')).delivery(format('auto'));
};

export const uploadToCloudinary = async (videoBlob) => {
  const formData = new FormData();
  formData.append('file', videoBlob);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'video');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudinary upload failed: ${body}`);
  }
  return res.json();
};
