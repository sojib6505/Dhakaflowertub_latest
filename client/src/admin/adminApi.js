import { API_URL } from '../config/api'

const TOKEN_KEY = 'dhaka_flower_tub_admin_token'

export const getAdminToken = () => window.localStorage.getItem(TOKEN_KEY)

export const saveAdminToken = (token) => window.localStorage.setItem(TOKEN_KEY, token)

export const clearAdminToken = () => window.localStorage.removeItem(TOKEN_KEY)

export const adminRequest = async (path, options = {}) => {
  const token = getAdminToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload.message || 'The request could not be completed.')
    error.status = response.status
    throw error
  }

  return payload
}

export { API_URL }

// ---- Image uploads (Cloudinary, signed by our API so the secret never reaches the browser) ----

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const validateImageFile = (file) => {
  if (!file) return 'Choose an image to upload.'
  if (!IMAGE_TYPES.includes(file.type)) return 'Unsupported file type. Use a JPG, PNG, WebP or AVIF image.'
  if (file.size > MAX_IMAGE_BYTES) {
    return `This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum size is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`
  }
  return ''
}

// Uploads one image and resolves with { url, publicId }. Call the returned `cancel` to abort.
export const uploadImage = (file, scope, { onProgress } = {}) => {
  let request = null
  let cancelled = false

  const promise = (async () => {
    const signature = await adminRequest('/uploads/sign', { method: 'POST', body: JSON.stringify({ scope }) })
    if (cancelled) throw Object.assign(new Error('Upload cancelled.'), { cancelled: true })
    const { uploadUrl, fields } = signature.data

    const body = new FormData()
    Object.entries(fields).forEach(([key, value]) => body.append(key, String(value)))
    body.append('file', file)

    return new Promise((resolve, reject) => {
      request = new XMLHttpRequest()
      request.open('POST', uploadUrl)
      request.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100))
      }
      request.onload = () => {
        let payload = {}
        try { payload = JSON.parse(request.responseText) } catch { /* handled below */ }
        if (request.status >= 200 && request.status < 300 && payload.secure_url) {
          resolve({ url: payload.secure_url, publicId: payload.public_id })
        } else {
          reject(new Error(payload.error?.message || 'The image host rejected the upload. Please try again.'))
        }
      }
      request.onerror = () => reject(new Error('Network error while uploading. Check your connection and try again.'))
      request.onabort = () => reject(Object.assign(new Error('Upload cancelled.'), { cancelled: true }))
      request.send(body)
    })
  })()

  return {
    promise,
    cancel: () => { cancelled = true; request?.abort() },
  }
}
