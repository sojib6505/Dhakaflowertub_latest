// Serve smaller, modern-format images for Cloudinary-hosted URLs. Any other URL is returned unchanged.
const UPLOAD_SEGMENT = '/image/upload/'

export const optimizeImageUrl = (url, width) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD_SEGMENT)) return url

  const [head, tail] = url.split(UPLOAD_SEGMENT)
  // Stored URLs look like .../upload/v123/folder/file.jpg. If a transformation is already present, leave it alone.
  if (!/^v\d+\//.test(tail)) return url

  const transformation = ['f_auto', 'q_auto', width ? `w_${width}` : null, width ? 'c_limit' : null].filter(Boolean).join(',')
  return `${head}${UPLOAD_SEGMENT}${transformation}/${tail}`
}
