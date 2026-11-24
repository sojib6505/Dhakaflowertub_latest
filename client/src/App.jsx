import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Leaf,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import AtmosphericBackground from "./components/AtmosphericBackground";
import OfferSlider from "./components/OfferSlider";
import ProductDetailsModal from "./components/ProductDetailsModal";
import { API_URL, BUSINESS_VIDEO, CORPORATE_IMAGES } from "./config/api";
import useReveal from "./hooks/useReveal";
import { CATEGORY_FALLBACK_IMAGES, DEFAULT_CATEGORIES } from "./utils/categories";
import { optimizeImageUrl } from "./utils/images";
import { getWhatsAppLink } from "./utils/whatsapp";
import "./App.css";
import Logo from "./components/Logo";

const formatPrice = (product) => {
  if (product.priceDisplay) return product.priceDisplay;
  if (product.isPriceCustom || !product.price) return "Price on request";
  return `৳ ${product.price.toLocaleString()}`;
};

function App() {
  const [rawProducts, setRawProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [offerPackages, setOfferPackages] = useState([]);
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORIES[0].key);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Corporate slider
  const [activeCorporateImage, setActiveCorporateImage] = useState(0);
  const [autoPlayCorporateImages, setAutoPlayCorporateImages] = useState(true);

  useReveal();

  useEffect(() => {
    const loadCatalogue = async () => {
      try {
        const [productResponse, offersResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_URL}/products?limit=200`),
          fetch(`${API_URL}/offers?active=true`).catch(() => ({ ok: false })),
          fetch(`${API_URL}/categories`).catch(() => ({ ok: false })),
        ]);

        if (!productResponse.ok) {
          throw new Error("The catalogue is temporarily unavailable.");
        }

        const productPayload = await productResponse.json();

        let offersData = [];
        if (offersResponse && offersResponse.ok) {
          const offersPayload = await offersResponse.json();
          offersData = offersPayload.data || [];
        }

        // Category names and descriptions are managed in the admin dashboard.
        if (categoriesResponse && categoriesResponse.ok) {
          const categoriesPayload = await categoriesResponse.json();
          if (Array.isArray(categoriesPayload.data) && categoriesPayload.data.length > 0) {
            setCategories(categoriesPayload.data);
          }
        }

        setRawProducts(productPayload.data || []);
        setOfferPackages(offersData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalogue();
  }, []);

  // Header gains a background once the page scrolls.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categoryByKey = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.key, category])),
    [categories]
  );

  // Products carry the stable category key; attach the current display name for the UI.
  const products = useMemo(
    () =>
      rawProducts.map((product) => ({
        ...product,
        categoryName: categoryByKey[product.category]?.name || product.category,
      })),
    [rawProducts, categoryByKey]
  );

  // One card per category, each with one representative product image.
  const categoryCards = useMemo(() => {
    return categories.map((category) => {
      const matchingProducts = products.filter((p) => p.category === category.key);
      return {
        key: category.key,
        name: category.name,
        description: category.description,
        count: matchingProducts.length,
        image: matchingProducts[0]?.images?.[0]?.url || CATEGORY_FALLBACK_IMAGES[category.key],
      };
    });
  }, [categories, products]);

  const activeCategoryName = categoryByKey[activeCategory]?.name || "";

  // Filtered products for shared display area
  const displayedProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term) {
      return products.filter((product) => {
        const text =
          `${product.name} ${product.shortDescription || ""} ${product.categoryName} ${product.material || ""}`.toLowerCase();
        return text.includes(term);
      });
    }

    if (showAllProducts) {
      return products;
    }

    return products.filter((product) => product.category === activeCategory);
  }, [products, search, showAllProducts, activeCategory]);

  const featuredProduct = useMemo(() => {
    return products.find((p) => p.isFeatured) || products[0];
  }, [products]);

  const heroShelfProducts = useMemo(() => {
    return products.slice(1, 4);
  }, [products]);

  // Corporate image slider timer (skipped for visitors who prefer reduced motion)
useEffect(() => {
  if (!autoPlayCorporateImages || CORPORATE_IMAGES.length <= 1) {
    return undefined;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return undefined;
  }

  const interval = window.setInterval(() => {
    setActiveCorporateImage(
      (curr) => (curr + 1) % CORPORATE_IMAGES.length
    );
  }, 2000);

  return () => window.clearInterval(interval);
}, [autoPlayCorporateImages]);

  const currentCorporateImage = CORPORATE_IMAGES[activeCorporateImage];
  const moveCorporateImage = (direction) => {
    setAutoPlayCorporateImages(false);
    setActiveCorporateImage(
      (curr) => (curr + direction + CORPORATE_IMAGES.length) % CORPORATE_IMAGES.length
    );
  };

  // const handleSelectCategory = (categoryKey) => {
  //   setActiveCategory(categoryKey);
  //   setShowAllProducts(false);
  //   setSearch("");
  // };

  const handleSelectCategory = (categoryKey) => {
  setActiveCategory(categoryKey);
  setShowAllProducts(false);
  setSearch("");

  setTimeout(() => {
    document.getElementById("product-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
};

  const handleToggleAllProducts = () => {
    setShowAllProducts((prev) => !prev);
    setSearch("");
  };

  return (
    <div className="site-shell">
      {/* Global Atmospheric Mist & Ambient Animation */}
      <AtmosphericBackground />

     
<header className={isScrolled ? "site-header is-scrolled" : "site-header"}>
        <a href="#top" aria-label="Dhaka Flower Tub home">
          <Logo />
        </a>

        <nav
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          aria-label="Main navigation"
        >
          <a
            href="#categories"
            onClick={() => setMenuOpen(false)}
          >
            Collections
          </a>
          <a href="#offers" onClick={() => setMenuOpen(false)}>
            Special Offers
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            Our Approach
          </a>
          <a href="#corporate" onClick={() => setMenuOpen(false)}>
            Corporate
          </a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
        </nav>

        <a
          className="header-cta"
          href={getWhatsAppLink()}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} /> Enquire on WhatsApp
        </a>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>    


      <main id="top">
        {/* ========================================================
            1. HERO SECTION (Reference Image 1: InPlant Style)
            ======================================================== */}
        <section className="hero-stage-redesign">
          <div className="hero-main-grid">
            {/* Left Content */}
            <div className="hero-text-column">
              <span className="hero-tag">#ORNAMENTAL PLANTERS · DHAKA FLOWER TUB</span>
              <h1 className="hero-title">
                Various Indoor &amp; <em>Outdoor</em> Plant Tubs
              </h1>
              <p className="hero-description">
                Architectural flower tubs, handcrafted planters, and custom mineral basins.
                Engineered for Dhaka homes, executive offices, and luxury balcony terraces.
              </p>
              <div className="hero-cta-group">
                <a
                  className="hero-btn-primary"
                  href={getWhatsAppLink(featuredProduct)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={18} /> Order on WhatsApp
                </a>
                <a className="hero-btn-secondary" href="#offers">
                  <Tag size={16} /> View Offer Packages
                </a>
              </div>
            </div>

            {/* Right Visual: Concentric Rings & Hanging Tub */}
            <div className="hero-visual-frame">
              <div className="concentric-ring ring-outer" />
              <div className="concentric-ring ring-inner" />

              {/* Orbiting badges */}
              <div className="orbit-node orbit-top-right" title="Eco Mineral"><Leaf size={14} /></div>
              <div className="orbit-node orbit-bottom-right" title="Weather Sealed"><Sparkles size={14} /></div>
              <div className="orbit-node orbit-left" title="Handcrafted"><Layers size={14} /></div>

              {/* Featured Showcase Tub */}
              <div
                className="hero-main-image-wrap cursor-pointer"
                onClick={() => featuredProduct && setSelectedProduct(featuredProduct)}
              >
                <img
                  src={
                    featuredProduct?.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80"
                  }
                  alt={featuredProduct?.name || "Featured Architectural Plant Tub"}
                  className="hero-main-plant-img"
                />
              </div>

              {/* Floating Glassmorphism Badge */}
              <div
                className="hero-floating-glass-card cursor-pointer"
                onClick={() => featuredProduct && setSelectedProduct(featuredProduct)}
              >
                <div className="glass-icon-box">
                  <Sparkles size={18} />
                </div>
                <div className="glass-text-box">
                  <h4>{featuredProduct?.badge || "Best Selling Planter"}</h4>
                  <p>{featuredProduct?.name || "Architectural Concrete Series"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom Shelf (InPlant Bottom Row) */}
          
        </section>

        {/* Special offers (managed from the admin dashboard) */}
        <OfferSlider offers={offerPackages} />

        {/* Collections: four business categories + shared product display */}
        <section className="section pt-10 collections" id="categories">
          <div className="section-inner">
            <header className="section-head" data-reveal>
              <div className="section-head-copy mt-0">
                <h2 className="text-3xl font-bold">Browse by category</h2>
                <p className="section-lead">
                  Select a category to see its pieces below.
                </p>
              </div>

              <div className="search-field">
                <Search size={16} aria-hidden="true" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search planters"
                  aria-label="Search all products"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="search-clear"
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </header>

          <div
  className="grid grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2 md:gap-3"
  role="tablist"
  aria-label="Product categories"
  data-reveal
>
  {categoryCards.map((cat) => {
    const isSelected =
      !showAllProducts && !search && activeCategory === cat.key;

    return (
      <button
        type="button"
        role="tab"
        key={cat.key}
        aria-selected={isSelected}
        aria-controls="product-panel"
        onClick={() => handleSelectCategory(cat.key)}
        className={`min-w-0 overflow-hidden rounded-lg border text-left transition-all duration-200 ${
          isSelected
            ? "border-black bg-gray-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"
        }`}
      >
        <span className="flex h-full min-h-[75px] flex-col justify-center gap-1 p-1.5 sm:min-h-[90px] sm:p-2 md:p-3">
          {/* Category name */}
          <span
            className={`line-clamp-2 text-[10px] font-semibold leading-tight sm:text-xs md:text-sm ${
              isSelected ? "text-black" : "text-gray-800"
            }`}
          >
            {cat.name}
          </span>

          {/* Description */}
          {cat.description && (
            <span className="line-clamp-2 text-[8px] leading-tight text-gray-500 sm:text-[10px] md:text-xs">
              {cat.description}
            </span>
          )}

          {/* Product count */}
          <span className="mt-0.5 text-[8px] text-gray-400 sm:text-[10px]">
            {cat.count} {cat.count === 1 ? "design" : "designs"}
          </span>
        </span>
      </button>
    );
  })}
</div>

            <div className="shared-product-display-area" id="product-panel" role="tabpanel">
              <div className="shared-area-header">
                <div className="shared-area-title-group">
                  <h3>
                    {search
                      ? `Results for “${search}”`
                      : showAllProducts
                      ? "All products"
                      : activeCategoryName}
                  </h3>
                  <span className="shared-count-badge">
                    {displayedProducts.length} {displayedProducts.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <button
                  type="button"
                  className={`all-products-toggle-btn ${showAllProducts ? "is-active" : ""}`}
                  onClick={handleToggleAllProducts}
                >
                  {showAllProducts ? "Show selected category" : "View all products"}
                </button>
              </div>

              {isLoading && <p className="catalogue-message">Loading the catalogue...</p>}
              {error && <p className="catalogue-message error-message">{error}</p>}

              {!isLoading && !error && displayedProducts.length === 0 && (
                <p className="catalogue-message">No pieces found for this selection.</p>
              )}

              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-20 md:mb-30">
                {displayedProducts.map((product) => (
                  <article className="product-card" key={product._id || product.slug}>
                    <button
                      type="button"
                      className="product-image"
                      onClick={() => setSelectedProduct(product)}
                      aria-label={`View details for ${product.name}`}
                    >
                      <img
                        src={optimizeImageUrl(product.images?.[0]?.url, 640)}
                        alt={product.images?.[0]?.alt || product.name}
                        loading="lazy"
                      />
                      {product.badge && <span className="product-badge">{product.badge}</span>}
                    </button>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-price">{formatPrice(product)}</p>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="view-details-button"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Details
                        </button>
                        <a
                          className="product-contact-button"
                          href={getWhatsAppLink(product)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Brand statement */}
        <section className="section intro-strip mb-20 md:mb-30" id="story">
          <div className="section-inner intro-grid" data-reveal>
            <p className="text:2xl md:text-4xl font-semibold font-sans ">
              Good planters do more than hold a plant. They give a room its rhythm, soften its edges, and make space for slower moments.
            </p>
            <a 
              className="circle-link"
              href={getWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              aria-label="Talk to Dhaka Flower Tub on WhatsApp"
            >
              <ArrowUpRight size={22} />
            </a>
          </div>
        </section>

        {/* Workshop film */}
     <section
  className="relative overflow-hidden bg-[#03130f] py-20 md:py-28 mb-10 md:mb-30"
  aria-labelledby="business-video-title"
>
  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">

    {/* LEFT — Workshop Video */}
    <div className="relative pb-10" data-reveal>

      {/* Video */}
      <div className="relative aspect-[1.48/1] overflow-hidden rounded-2xl bg-[#10241c] sm:rounded-3xl">
        <video
          id="workshop-video"
          controls
          playsInline
          preload="metadata"
          src={BUSINESS_VIDEO.url}
          className="h-full w-full object-cover"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Floating Location Badge */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-[#faf8ef]/95 px-4 py-2.5 text-xs font-medium text-[#1c2922] shadow-lg backdrop-blur-md sm:left-5 sm:top-5">
        <span className="h-2 w-2 rounded-full bg-[#b9c873]" />
        Uttara · Our Workshop
      </div>

      {/* Floating Craft Card */}
      {/* <div className="absolute -right-1 bottom-0 z-10  border-white/5 bg-[#71b69481]  text-[#f4edcf] shadow-2xl sm:-right-3 sm:min-h-[175px] sm:w-[150px] sm:p-4 ">

       <div className="flex flex-col items-start gap-1 w-full">
         <span className="mb-3 font-serif text-[22px] leading-none tracking-tight text-[#d9c16f] sm:text-[22px]">
          Handmade
        </span>

        <p className="text-[12px] leading-relaxed text-white/85 sm:text-[13px]">
          Crafted with care,
          finished by hand.
        </p>

       </div>
        <div className="mt-4 h-px w-full bg-[#d9c16f]/40" />
      </div> */}
    </div>

    {/* RIGHT — Content */}
    <div data-reveal className="max-w-xl lg:ml-auto">

      <h2
        id="business-video-title"
        className="mb-6 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.04em] text-[#f5f1e7]"
      >
        Where Every Planter
        <br className="hidden sm:block" />
        {" "}Finds Its Purpose.
      </h2>

      <p className="mb-8 max-w-lg text-sm leading-8 text-[#eeefe4]/65 sm:text-[15px]">
        Get to know the artistry behind every planter. Discover our
        production process, carefully selected materials, and the
        craftsmanship that brings each piece to life for modern spaces.
      </p>

      {/* CTA */}
      <a
        href="#workshop-video"
        className="group inline-flex items-center gap-4 rounded-full bg-[#d9b95f] px-6 py-3.5 text-sm font-semibold text-[#152019] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e7ca7a] hover:shadow-[0_8px_25px_rgba(217,185,95,0.15)]"
      >
        Explore Our Craft

        <span className="inline-block text-lg leading-none transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1">
          ↗
        </span>
      </a>
    </div>

  </div>
</section>

        {/* Corporate projects */}
        <section
          className="section corporate-section"
          id="corporate"
          aria-labelledby="corporate-corner-title"
          onMouseEnter={() => setAutoPlayCorporateImages(false)}
          onMouseLeave={() => setAutoPlayCorporateImages(true)}
        >
          <div className="section-inner">
            <header className="flex flex-col items-center pb-5 md:pb-10" >
              <div className="section-head-copy ">
                <h2 id="corporate-corner-title" className="text-xl mb-1 md:text-4xl font-bold text-center">
                  Built for business. Designed for longevity.
                </h2>
              </div>
              <p className="text-center text-sm md:text-base">
                A look into our corporate installations for tech headquarters, boutique restaurants, and commercial lobbies.
              </p>
            </header>

          <div
  className="corporate-slider mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8"
  aria-label="Corporate image slider"
  data-reveal
>
              <div className="corporate-slider-frame">
                <img
                  key={currentCorporateImage.src}
                  src={currentCorporateImage.src}
                  alt={currentCorporateImage.alt}
                  className="corporate-slide-image"
                />
              </div>

              <div className="corporate-slider-controls">
                <button
                  type="button"
                  className="corporate-slider-nav"
                  aria-label="Previous corporate image"
                  onClick={() => moveCorporateImage(-1)}
                >
                  <ChevronLeft size={18} />
                </button>

<div
  className="flex items-center justify-center gap-2"
  aria-label="Select image slide"
>
  {CORPORATE_IMAGES.map((image, index) => (
    <button
      key={`${image.src}-${index}`}
      type="button"
      className={`h-2 rounded-full transition-all duration-300 ${
        activeCorporateImage === index
          ? "w-7 bg-[#174d39]"
          : "w-2 bg-[#c5cec6] hover:bg-[#174d39]/60"
      }`}
      aria-label={`View image ${index + 1}`}
      aria-current={activeCorporateImage === index}
      onClick={() => {
        setAutoPlayCorporateImages(false);
        setActiveCorporateImage(index);
      }}
    />
  ))}
</div>

                <button
                  type="button"
                  className="corporate-slider-nav"
                  aria-label="Next corporate image"
                  onClick={() => moveCorporateImage(1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Direct contact */}
        <section className="section contact-section" id="contact">
          <div className="section-inner contact-inner" data-reveal>
            <div>
              <p className="contact-eyebrow">Have a space or project in mind?</p>
              <h2 className="section-title">Let’s find the right planter for your space.</h2>
            </div>
            <a
              className="contact-button"
              href={getWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} /> Start a conversation
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Dhaka Flower Tub. All rights reserved.</span>
        <span>Architectural Planters &amp; Ceramic Vessels · Dhaka, Bangladesh</span>
      </footer>

      <ProductDetailsModal
        key={selectedProduct?._id || selectedProduct?.slug || "none"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default App;