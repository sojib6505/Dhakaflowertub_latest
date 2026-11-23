export const generateSlug = (text) =>
  String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Names written only in Bangla produce an empty ASCII slug, so fall back to something unique.
export const slugOrFallback = (text, prefix) => generateSlug(text) || `${prefix}-${Date.now().toString(36)}`;

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const cleanImage = (image) => {
  if (!image || typeof image !== 'object') return null;
  const url = typeof image.url === 'string' ? image.url.trim() : '';
  if (!url || !isHttpUrl(url)) return null;

  const cleaned = {
    url,
    alt: typeof image.alt === 'string' ? image.alt.trim() : ''
  };
  if (typeof image.publicId === 'string' && image.publicId.trim()) cleaned.publicId = image.publicId.trim();
  if (image.isPrimary !== undefined) cleaned.isPrimary = Boolean(image.isPrimary);
  return cleaned;
};

export const cleanImages = (images) => {
  const cleaned = (Array.isArray(images) ? images : []).map(cleanImage).filter(Boolean);
  return cleaned.map((image, index) => ({ ...image, isPrimary: index === 0 }));
};

export const cleanStringList = (value) =>
  (Array.isArray(value) ? value : []).map((item) => String(item).trim()).filter(Boolean);

export const pick = (source, fields) =>
  Object.fromEntries(fields.filter((field) => source && source[field] !== undefined).map((field) => [field, source[field]]));
