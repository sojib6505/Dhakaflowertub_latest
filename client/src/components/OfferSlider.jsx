
import { useEffect, useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import { optimizeImageUrl } from '../utils/images'
import { getWhatsAppLink } from '../utils/whatsapp'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function OfferSlider({ offers = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const totalOffers = offers.length

  useEffect(() => {
    if (totalOffers <= 1 || isPaused || prefersReducedMotion()) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalOffers)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [totalOffers, isPaused])

  if (!totalOffers) return null

  const visibleCount = Math.min(5, totalOffers)
  const middlePosition = Math.floor(visibleCount / 2)

  const visibleOffers = Array.from(
    { length: visibleCount },
    (_, position) => {
      const offset = position - middlePosition
      const offerIndex =
        (currentIndex + offset + totalOffers) % totalOffers

      return { offer: offers[offerIndex], offerIndex, offset }
    }
  )

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsPaused(false)
    }
  }

  return (
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

        <header className="offers-heading">
          <span className="offers-eyebrow">
            DHAKA FLOWER TUB COLLECTION
          </span>

          <h2 className="section-title flex justify-center">
            Exclusive Offer Packages
          </h2>

          <p className="section-lead">
            Beautiful greenery and thoughtfully curated
            collections for your spaces.
          </p>
        </header>

        <div className="offer-carousel">
          <div className="offer-product-track">

            {visibleOffers.map(({ offer, offerIndex, offset }) => {
              const isCenter = offset === 0

              const discountLabel =
                offer.discountValue > 0 &&
                offer.discountType !== 'none'
                  ? offer.discountType === 'percentage'
                    ? `${offer.discountValue}% OFF`
                    : `SAVE ৳${offer.discountValue.toLocaleString()}`
                  : ''

              const imageUrl = optimizeImageUrl(
                offer.image?.url,
                900
              )

              return (
                <article
                  key={offer._id || offer.slug || offerIndex}
                  className={`offer-product-card position-${offset} ${
                    isCenter ? 'is-center' : ''
                  }`}
                  aria-roledescription="slide"
                  aria-label={`${offer.title}, ${offerIndex + 1} of ${totalOffers}`}
                  aria-hidden={!isCenter}
                  style={{
                    '--offer-image': `url("${imageUrl}")`,
                  }}
                >

                  {/* Full Background Image */}
                  <div className="offer-card-background" />

                  {/* Glass Overlay */}
                  <div className="offer-glass-overlay" />

                  {/* Offer Content */}
                  <div className="offer-product-content">

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

                    <div className="offer-card-details">

                      <h3 className="offer-product-title">
                        {offer.title}
                      </h3>
{/* 
                      {offer.subtitle && (
                        <p className="offer-product-subtitle">
                          {offer.subtitle}
                        </p>
                      )} */}

                      {/* {offer.description && (
                        <p className="offer-product-description">
                          {offer.description}
                        </p>
                      )} */}
{/* 
                      {offer.features?.length > 0 && (
                        <ul className="offer-product-features">
                          {offer.features
                            .slice(0, isCenter ? 3 : 2)
                            .map((feature, index) => (
                              <li key={`${feature}-${index}`}>
                                <span className="offer-check">
                                  <Check size={13} />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                        </ul>
                      )} */}

                      <div className="offer-product-footer">

                        <div className="offer-product-pricing">
                          {offer.originalPrice > 0 && (
                            <span className="offer-old-price">
                              ৳{offer.originalPrice.toLocaleString()}
                            </span>
                          )}

                          <span className="offer-current-price">
                            {offer.priceDisplay ||
                              `৳${offer.offerPrice?.toLocaleString()}`}
                          </span>
                        </div>

                        <a
                          href={getWhatsAppLink(offer, 'offer')}
                          className="offer-whatsapp-btn"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Order ${offer.title} on WhatsApp`}
                        >
                          <MessageCircle size={16} />
                          <span>
                            {isCenter ? 'Order on WhatsApp' : 'WhatsApp'}
                          </span>
                        </a>

                      </div>
                    </div>
                  </div>
                </article>
              )
            })}

          </div>
        </div>

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
  )
}
