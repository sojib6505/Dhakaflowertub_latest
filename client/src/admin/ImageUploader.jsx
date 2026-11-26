import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Replace, Trash2 } from 'lucide-react'
import { IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage, validateImageFile } from './adminApi'

/**
 * Reusable image field for products and offers.
 *
 * value:    { url, publicId? } | null   (legacy external URLs are shown and can be replaced)
 * onChange: called with { url, publicId } after a successful upload, or null when removed
 * scope:    'products' | 'offers'       (upload folder)
 */
export default function ImageUploader({ label, scope, value, onChange, onBusyChange, uploadId, required = false }) {
  const inputRef = useRef(null)
  const uploadRef = useRef(null)
  const [localPreview, setLocalPreview] = useState('')
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  // Release object URLs and cancel any upload still running when the form closes.
  useEffect(() => () => uploadRef.current?.cancel(), [])
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview) }, [localPreview])
  useEffect(() => {
    onBusyChange?.(isUploading, uploadId)
    return () => {
      if (isUploading) onBusyChange?.(false, uploadId)
    }
  }, [isUploading, onBusyChange, uploadId])

  const startUpload = async (file) => {
    const validationError = validateImageFile(file)
    if (validationError) { setError(validationError); return }

    setError('')
    setProgress(0)
    setIsUploading(true)
    setLocalPreview(URL.createObjectURL(file))

    const upload = uploadImage(file, scope, { onProgress: setProgress })
    uploadRef.current = upload

    try {
      const result = await upload.promise
      onChange(result)
      setLocalPreview('')
    } catch (uploadError) {
      if (!uploadError.cancelled) setError(uploadError.message)
      setLocalPreview('')
    } finally {
      uploadRef.current = null
      setIsUploading(false)
    }
  }

  const handleFiles = (files) => {
    if (isUploading) return
    const [file] = Array.from(files || [])
    if (file) startUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const previewUrl = localPreview || value?.url || ''
  const hasImage = Boolean(previewUrl)

  return (
    <div className="image-uploader wide-field">
      <span className="image-uploader-label">{label}{required ? ' *' : ''}</span>

      <div className="image-uploader-body">
        <div
          className={`image-uploader-preview ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files) }}
        >
          {hasImage ? (
            <img src={previewUrl} alt="" className={isUploading ? 'is-uploading' : ''} />
          ) : (
            <button type="button" className="image-uploader-empty" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              <ImagePlus size={22} />
              <span>Choose or drop an image</span>
            </button>
          )}
          {isUploading && (
            <div className="image-uploader-overlay" role="status">
              <Loader2 size={18} className="image-uploader-spinner" />
              <span>Uploading {progress}%</span>
            </div>
          )}
        </div>

        <div className="image-uploader-side">
          {isUploading && (
            <div className="image-uploader-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <span style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="image-uploader-actions">
            <button type="button" className="admin-secondary-button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              {hasImage ? <Replace size={15} /> : <ImagePlus size={15} />} {hasImage ? 'Replace image' : 'Choose image'}
            </button>
            {isUploading ? (
              <button type="button" className="admin-secondary-button" onClick={() => uploadRef.current?.cancel()}>Cancel</button>
            ) : value?.url && (
              <button type="button" className="admin-secondary-button danger" onClick={() => { setError(''); onChange(null) }}>
                <Trash2 size={15} /> Remove
              </button>
            )}
          </div>

          <p className="admin-help">JPG, PNG, WebP or AVIF, up to {MAX_IMAGE_BYTES / 1024 / 1024} MB. Large images are resized automatically.</p>
          {error && <p className="admin-error" role="alert">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}
