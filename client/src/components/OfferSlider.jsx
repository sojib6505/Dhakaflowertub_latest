import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { optimizeImageUrl } from '../utils/images'
import { getWhatsAppLink } from '../utils/whatsapp'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function OfferSlider({ offers = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Offers can be removed or paused in the admin, so keep the index inside the current list.
  const safeIndex = offers.length ? Math.min(currentIndex, offers.length - 1) : 0

  // Auto-advance every 6 seconds unless paused, or the visitor prefers reduced motion.
  useEffect(() => {
    if (!offers || offers.length <= 1 || isPaused || prefersReducedMotion()) return undefined

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [offers, isPaused])

  if (!offers || offers.length === 0) {
    return null
  }

  const currentOffer = offers[safeIndex]

  const handlePrev = () => setCurrentIndex((safeIndex - 1 + offers.length) % offers.length)
  const handleNext = () => setCurrentIndex((safeIndex + 1) % offers.length)

  const discountLabel = currentOffer.discountValue > 0 && currentOffer.discountType !== 'none'
    ? currentOffer.discountType === 'percentage'
      ? `${currentOffer.discountValue}% off`
      : `Save ৳ ${currentOffer.discountValue.toLocaleString()}`
    : ''

  return (
    <section
      className="section offers"
      id="offers"
      aria-roledescription="carousel"
      aria-label="Special offer packages"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="section-inner">
        <header className="section-head" data-reveal>
          <div className="section-head-copy">
            <h2 className="section-title">Exclusive offer packages</h2>
            <p className="section-lead">
              Curated planter bundles and architectural sets at workshop-direct prices.
            </p>
          </div>

          {offers.length > 1 && (
            <div className="slider-nav-controls">
              <button type="button" className="slider-nav-btn" onClick={handlePrev} aria-label="Previous offer package">
                <ChevronLeft size={18} />
              </button>

              <div className="slider-nav-dots" role="group" aria-label="Select offer package">
                {offers.map((offer, idx) => (
                  <button
                    key={offer._id || offer.slug || idx}
                    type="button"
                    className={`slider-nav-dot ${idx === safeIndex ? 'is-active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Show offer ${idx + 1} of ${offers.length}`}
                    aria-current={idx === safeIndex}
                  />
                ))}
              </div>

              <button type="button" className="slider-nav-btn" onClick={handleNext} aria-label="Next offer package">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </header>

        <article
          className="offer-card"
          key={currentOffer._id || currentOffer.slug || safeIndex}
          aria-roledescription="slide"
          aria-label={`${safeIndex + 1} of ${offers.length}`}
        >
          <div className="offer-media">
            <img
              src={optimizeImageUrl(currentOffer.image?.url, 1100)}
              alt={currentOffer.image?.alt || currentOffer.title}
            />
            {currentOffer.badge && <span className="offer-badge">{currentOffer.badge}</span>}
          </div>

          <div className="offer-body">
            <div className="offer-heading">
              <h3 className="offer-title">{currentOffer.title}</h3>
              {currentOffer.subtitle && <p className="offer-subtitle">{currentOffer.subtitle}</p>}
            </div>

            {currentOffer.description && <p className="offer-desc">{currentOffer.description}</p>}

            {currentOffer.features && currentOffer.features.length > 0 && (
              <ul className="offer-features">
                {currentOffer.features.map((feature, i) => (
                  <li key={`${feature}-${i}`}>
                    <Check size={15} aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="offer-foot">
              <div className="offer-price">
                {currentOffer.originalPrice > 0 && (
                  <span className="offer-price-was">৳ {currentOffer.originalPrice.toLocaleString()}</span>
                )}
                <span className="offer-price-now">
                  {currentOffer.priceDisplay || `৳ ${currentOffer.offerPrice?.toLocaleString()}`}
                </span>
                {discountLabel && <span className="offer-discount">{discountLabel}</span>}
              </div>

              <a
                className="offer-cta"
                href={getWhatsAppLink(currentOffer, 'offer')}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} />
                <span>Order on WhatsApp</span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
