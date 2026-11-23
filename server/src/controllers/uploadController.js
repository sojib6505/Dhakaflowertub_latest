import { createUploadSignature, isCloudinaryConfigured, UPLOAD_SCOPES } from '../utils/cloudinary.js';

// @desc    Get a short-lived signed payload so the browser can upload one image directly to Cloudinary
// @route   POST /api/uploads/sign
export const signUpload = (req, res) => {
  const scope = req.body?.scope;

  if (!UPLOAD_SCOPES.includes(scope)) {
    return res.status(400).json({ success: false, message: `Upload scope must be one of: ${UPLOAD_SCOPES.join(', ')}.` });
  }

  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.'
    });
  }

  return res.json({ success: true, data: createUploadSignature(scope) });
};
