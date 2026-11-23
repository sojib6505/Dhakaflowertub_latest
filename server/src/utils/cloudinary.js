import crypto from 'node:crypto';

// Cloudinary free plan: signed browser uploads + server-side deletes. No SDK needed.
export const UPLOAD_SCOPES = ['products', 'offers'];
export const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif';
// Applied when the file is stored, so oversized originals never use free-tier storage.
export const INCOMING_TRANSFORMATION = 'c_limit,h_2000,w_2000';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const getConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  baseFolder: (process.env.CLOUDINARY_UPLOAD_FOLDER || 'dhakaflowertub').replace(/^\/+|\/+$/g, '')
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = getConfig();
  return Boolean(cloudName && apiKey && apiSecret);
};

// https://cloudinary.com/documentation/authentication_signatures
export const signParams = (params, apiSecret) => {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
};

export const createUploadSignature = (scope) => {
  const { cloudName, apiKey, apiSecret, baseFolder } = getConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `${baseFolder}/${scope}`;
  const params = {
    allowed_formats: ALLOWED_FORMATS,
    folder,
    timestamp,
    transformation: INCOMING_TRANSFORMATION
  };

  return {
    cloudName,
    apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    maxFileBytes: MAX_FILE_BYTES,
    fields: { ...params, signature: signParams(params, apiSecret), api_key: apiKey }
  };
};

// Best-effort removal of an image we uploaded. Never throws: a failed cleanup must not fail a save.
export const destroyImage = async (publicId) => {
  const { cloudName, apiKey, apiSecret, baseFolder } = getConfig();
  if (!isCloudinaryConfigured() || typeof publicId !== 'string') return false;
  // Only ever delete assets inside our own upload folder.
  if (!publicId.startsWith(`${baseFolder}/`)) return false;

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const params = { invalidate: 'true', public_id: publicId, timestamp };
    const body = new URLSearchParams({
      ...params,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature: signParams(params, apiSecret)
    });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body });
    const payload = await response.json().catch(() => ({}));
    return response.ok && (payload.result === 'ok' || payload.result === 'not found');
  } catch (error) {
    console.warn(`[Cloudinary Warning] Could not delete ${publicId}: ${error.message}`);
    return false;
  }
};

export const destroyImages = (publicIds) => Promise.all([...new Set(publicIds.filter(Boolean))].map(destroyImage));
