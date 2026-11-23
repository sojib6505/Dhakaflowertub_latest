
import { useEffect, useState } from 'react'
import { Check, MessageCircle, X } from 'lucide-react'
import { optimizeImageUrl } from '../utils/images'
import { getWhatsAppLink } from '../utils/whatsapp'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function OfferSlider({ offers = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)

  const totalOffers = offers.length

  // Autoplay
  useEffect(() => {
    if (
      totalOffers <= 1 ||
      isPaused ||
      selectedOffer ||
      prefersReducedMotion()
    ) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalOffers)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [totalOffers, isPaused, selectedOffer])

  // Modal scroll lock and Escape key
  useEffect(() => {
    if (!selectedOffer) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedOffer(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedOffer])

  if (!totalOffers) return null

  const visibleCount = Math.min(5, totalOffers)
  const middlePosition = Math.floor(visibleCount / 2)

  const visibleOffers = Array.from(
    { length: visibleCount },
    (_, position) => {
      const offset = position - middlePosition
      const offerIndex =
        (currentIndex + offset + totalOffers) % totalOffers

      return {
        offer: offers[offerIndex],
        offerIndex,
        offset,
      }
    }
  )

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsPaused(false)
    }
  }

  const getDiscountLabel = (offer) => {
    if (
      !offer.discountValue ||
      offer.discountValue <= 0 ||
      offer.discountType === 'none'
    ) {
      return ''
    }

    return offer.discountType === 'percentage'
      ? `${offer.discountValue}% OFF`
      : `SAVE ৳${offer.discountValue.toLocaleString()}`
  }

  const getPrice = (offer) =>
    offer.priceDisplay ||
    `৳${offer.offerPrice?.toLocaleString() ?? '0'}`

  return (
    <>
      <section
        className="section offers"
        id="offers"
        aria-label="Exclusive offer packages"
        aria-roledescription="carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={handleBlur}
      >
        <div className="section-inner offers-inner">

          {/* Header */}
          <header className="offers-heading">
            <span className="offers-eyebrow">
              DHAKA FLOWER TUB COLLECTION
            </span>

            <h2 className="section-title">
              Exclusive Offer Packages
            </h2>

            <p className="section-lead">
              Beautiful greenery and thoughtfully curated
              collections for your spaces.
            </p>
          </header>

          {/* Carousel */}
          <div className="offer-carousel">
            <div className="offer-product-track">

              {visibleOffers.map(({ offer, offerIndex, offset }) => {
                const isCenter = offset === 0
                const discountLabel = getDiscountLabel(offer)

                const imageUrl = optimizeImageUrl(
                  offer.image?.url,
                  1000
                )

                return (
                  <article
                    key={offer._id || offer.slug || offerIndex}
                    className={`offer-product-card position-${offset} ${
                      isCenter ? 'is-center' : ''
                    }`}
                    role="button"
                    tabIndex={isCenter ? 0 : -1}
                    aria-roledescription="slide"
                    aria-label={`View details for ${offer.title}`}
                    aria-hidden={!isCenter}
                    onClick={() => setSelectedOffer(offer)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault()
                        setSelectedOffer(offer)
                      }
                    }}
                    style={{
                      '--offer-image': imageUrl
                        ? `url("${imageUrl}")`
                        : 'none',
                    }}
                  >
                    {/* Product Image */}
                    <div className="offer-card-background" />

                    {/* Card Content */}
                    <div className="offer-product-content">

                      {/* Top Badges */}
                      <div className="offer-card-top">
                        {offer.badge && (
                          <span className="offer-product-badge">
                            {offer.badge}
                          </span>
                        )}

                        {discountLabel && (
                          <span className="offer-product-discount">
                            {discountLabel}
                          </span>
                        )}
                      </div>

                      {/* Only Title, Price and CTA */}
                      <div className="offer-card-details">

                        <h3 className="offer-product-title">
                          {offer.title}
                        </h3>

                        <div className="offer-product-footer">

                          <div className="offer-product-pricing">
                            {offer.originalPrice > 0 && (
                              <span className="offer-old-price">
                                ৳{offer.originalPrice.toLocaleString()}
                              </span>
                            )}

                            <span className="offer-current-price">
                              {getPrice(offer)}
                            </span>
                          </div>

                          <a
                            href={getWhatsAppLink(offer, 'offer')}
                            className="offer-whatsapp-btn"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Order ${offer.title} on WhatsApp`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MessageCircle size={16} />
                            <span>Order Now</span>
                          </a>

                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}

            </div>
          </div>

          {/* Pagination */}
          {totalOffers > 1 && (
            <div className="offer-pagination">
              <div className="offer-pagination-dots">
                {offers.map((offer, index) => (
                  <button
                    key={offer._id || offer.slug || index}
                    type="button"
                    className={`offer-pagination-dot ${
                      index === currentIndex ? 'active' : ''
                    }`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Show offer ${index + 1}`}
                    aria-current={
                      index === currentIndex ? 'true' : undefined
                    }
                  />
                ))}
              </div>

              <span className="offer-pagination-count">
                {String(currentIndex + 1).padStart(2, '0')}
                {' / '}
                {String(totalOffers).padStart(2, '0')}
              </span>
            </div>
          )}

        </div>
      </section>

      {/* Product Details Popup */}
      {selectedOffer && (
        <div
          className="offer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOffer(null)
            }
          }}
        >
          <div
            className="offer-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-modal-title"
          >
            <button
              type="button"
              className="offer-modal-close"
              onClick={() => setSelectedOffer(null)}
              aria-label="Close details"
            >
              <X size={21} />
            </button>

            {/* Popup Image */}
            <div className="offer-modal-image-wrap">
              {selectedOffer.image?.url && (
                <img
                  src={optimizeImageUrl(
                    selectedOffer.image.url,
                    1200
                  )}
                  alt={selectedOffer.title}
                  className="offer-modal-image"
                />
              )}

              <div className="offer-modal-badges">
                {selectedOffer.badge && (
                  <span className="offer-product-badge">
                    {selectedOffer.badge}
                  </span>
                )}

                {getDiscountLabel(selectedOffer) && (
                  <span className="offer-product-discount">
                    {getDiscountLabel(selectedOffer)}
                  </span>
                )}
              </div>
            </div>

            {/* Popup Details */}
            <div className="offer-modal-content">

              <span className="offer-modal-eyebrow">
                DHAKA FLOWER TUB COLLECTION
              </span>

              <h2 id="offer-modal-title">
                {selectedOffer.title}
              </h2>

              {selectedOffer.subtitle && (
                <p className="offer-modal-subtitle">
                  {selectedOffer.subtitle}
                </p>
              )}

              <div className="offer-modal-pricing">
                {selectedOffer.originalPrice > 0 && (
                  <span className="offer-old-price">
                    ৳{selectedOffer.originalPrice.toLocaleString()}
                  </span>
                )}

                <span className="offer-current-price">
                  {getPrice(selectedOffer)}
                </span>
              </div>

              {selectedOffer.description && (
                <div className="offer-modal-section">
                  <h3>About This Package</h3>
                  <p>{selectedOffer.description}</p>
                </div>
              )}

              {selectedOffer.features?.length > 0 && (
                <div className="offer-modal-section">
                  <h3>What's Included</h3>

                  <ul className="offer-modal-features">
                    {selectedOffer.features.map((feature, index) => (
                      <li key={`${feature}-${index}`}>
                        <span className="offer-check">
                          <Check size={13} />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={getWhatsAppLink(selectedOffer, 'offer')}
                className="offer-modal-order-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={19} />
                Order This Package on WhatsApp
              </a>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
