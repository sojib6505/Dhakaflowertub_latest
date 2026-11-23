import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, MessageCircle, Sparkles, X } from 'lucide-react'
import { optimizeImageUrl } from '../utils/images'
import { getWhatsAppLink, getWhatsAppNumber } from '../utils/whatsapp'

const availabilityLabels = {
  in_stock: 'In stock · Ready to dispatch',
  made_to_order: 'Made to order · Handcrafted',
  out_of_stock: 'Currently unavailable',
}

const formatPrice = (product) => {
  if (product.priceDisplay) return product.priceDisplay
  if (product.isPriceCustom || !product.price) return 'Price on request'
  return `৳ ${product.price.toLocaleString()}`
}

function ProductDetailsModal({ product, onClose }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (!product) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, product])

  if (!product) return null

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80', alt: product.name }]

  const activeImage = images[activeImageIndex] || images[0]
  const specifications = product.specifications || []
  const features = product.features || []
  const dimensions = Object.entries(product.dimensions || {}).filter(([, value]) => value)

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="product-modal product-modal-redesign"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close product details"
        >
          <X size={20} />
        </button>

        {/* Left Side / Image Presentation (Ref: Organic architectural shape) */}
        <div className="modal-visual-column">
          <div className="product-showcase-card">
            {/* Organic rounded backdrop banner */}
            <div className="showcase-arch-bg" />

            {/* Product image container with proper aspect ratio containment */}
            <div className="showcase-image-stage">
              <img
                src={optimizeImageUrl(activeImage.url, 1000)}
                alt={activeImage.alt || product.name}
                className="showcase-main-img"
              />
            </div>

            {product.badge && (
              <span className="showcase-badge">
                <Sparkles size={13} className="text-[#174d39]" />
                {product.badge}
              </span>
            )}

            {/* WhatsApp direct contact chip */}
            <div className="showcase-contact-chip">
              <span className="chip-wa-icon"><MessageCircle size={14} /></span>
              <span>+880 {getWhatsAppNumber().slice(-10)}</span>
            </div>
          </div>

          {/* Gallery thumbnails if multiple images */}
          {images.length > 1 && (
            <div className="modal-gallery-row">
              {images.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`gallery-thumb ${idx === activeImageIndex ? 'is-active' : ''}`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={optimizeImageUrl(img.url, 200)} alt={img.alt || ''} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side / Product Details */}
        <div className="modal-content">
          <div className="modal-header-meta">
            <span className="product-category-chip">{product.categoryName || product.category}</span>
            <span className={`availability-tag availability-${product.availability}`}>
              <span className="status-dot" />
              {availabilityLabels[product.availability] || product.availability}
            </span>
          </div>

          <h2 id="product-modal-title" className="modal-product-title">{product.name}</h2>

          <div className="modal-price-box">
            <span className="price-main">{formatPrice(product)}</span>
            {product.price && !product.isPriceCustom && (
              <span className="price-caption">VAT included · Direct workshop pricing</span>
            )}
          </div>

          <p className="modal-description">
            {product.description || product.shortDescription || 'Hand-finished architectural planter made for residential terraces, interior lounges, and boutique commercial spaces.'}
          </p>

          {/* Key attributes grid */}
          <div className="modal-details-grid">
            <div className="attribute-cell">
              <p className="detail-label">Material</p>
              <p className="detail-value">{product.material || 'Reinforced Stone Concrete'}</p>
            </div>
            <div className="attribute-cell">
              <p className="detail-label">Finish</p>
              <p className="detail-value">{product.finish || 'Smooth Mineral Matte'}</p>
            </div>
          </div>

          {/* Dimensions */}
          {dimensions.length > 0 && (
            <div className="modal-block">
              <p className="detail-label">Dimensions & Sizing</p>
              <div className="dimensions-list">
                {dimensions.map(([label, value]) => (
                  <span key={label}>
                    <strong>{label}:</strong> {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specifications table */}
          {specifications.length > 0 && (
            <div className="modal-block">
              <p className="detail-label">Specifications</p>
              <div className="spec-list">
                {specifications.map((spec) => (
                  <div key={`${spec.label}-${spec.value}`}>
                    <span>{spec.label}</span>
                    <strong>{spec.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="modal-block">
              <p className="detail-label">Crafted for Longevity</p>
              <ul className="feature-list">
                {features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} className="feature-check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* WhatsApp Primary CTA */}
          <div className="modal-cta-wrap">
            <a
              className="modal-contact-primary"
              href={getWhatsAppLink(product)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              <span>Order via WhatsApp</span>
              <ArrowUpRight size={17} className="ml-auto" />
            </a>
            <p className="modal-cta-note">
              No online checkout required. Inquire directly with our Dhaka workshop for custom sizing, delivery estimates, or live stock availability.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductDetailsModal
