import { useEffect, useMemo, useState } from 'react'
import { Check, LayoutGrid, LogOut, Package, Pencil, Plus, Search, Star, Tag, Trash2, X } from 'lucide-react'
import { adminRequest, API_URL, clearAdminToken, getAdminToken, saveAdminToken } from './adminApi'
import ImageUploader from './ImageUploader'
import './admin.css'

const emptyForm = {
  name: '', slug: '', category: '', shortDescription: '', description: '', price: '', priceDisplay: '',
  material: '', finish: '', availability: 'in_stock', badge: '', isFeatured: false, sortOrder: 0,
  imageUrl: '', imageAlt: '', imagePublicId: '', extraImages: [], features: '', specifications: '', height: '', diameter: '', length: '', width: '',
}

const formFromProduct = (product) => ({
  name: product.name || '', slug: product.slug || '', category: product.category || '',
  shortDescription: product.shortDescription || '', description: product.description || '',
  price: product.price ?? '', priceDisplay: product.priceDisplay || '', material: product.material || '', finish: product.finish || '',
  availability: product.availability || 'in_stock', badge: product.badge || '', isFeatured: Boolean(product.isFeatured), sortOrder: product.sortOrder || 0,
  imageUrl: product.images?.[0]?.url || '', imageAlt: product.images?.[0]?.alt || '', imagePublicId: product.images?.[0]?.publicId || '',
  // Gallery images beyond the first are kept as they are, so editing never drops them.
  extraImages: (product.images || []).slice(1),
  features: (product.features || []).join('\n'), specifications: (product.specifications || []).map((item) => `${item.label} | ${item.value}`).join('\n'),
  height: product.dimensions?.height || '', diameter: product.dimensions?.diameter || '', length: product.dimensions?.length || '', width: product.dimensions?.width || '',
})

const formToProduct = (form) => ({
  name: form.name.trim(), slug: form.slug.trim(), category: form.category, shortDescription: form.shortDescription.trim(), description: form.description.trim(),
  price: Number(form.price) || 0, priceDisplay: form.priceDisplay.trim(), material: form.material.trim(), finish: form.finish.trim(), availability: form.availability,
  badge: form.badge.trim(), isFeatured: form.isFeatured, sortOrder: Number(form.sortOrder) || 0,
  images: [
    ...(form.imageUrl.trim() ? [{ url: form.imageUrl.trim(), alt: form.imageAlt.trim(), isPrimary: true, ...(form.imagePublicId ? { publicId: form.imagePublicId } : {}) }] : []),
    ...form.extraImages,
  ],
  features: form.features.split('\n').map((item) => item.trim()).filter(Boolean),
  specifications: form.specifications.split('\n').map((item) => item.split('|').map((part) => part.trim())).filter(([label, value]) => label && value).map(([label, value]) => ({ label, value })),
  dimensions: { height: form.height.trim(), diameter: form.diameter.trim(), length: form.length.trim(), width: form.width.trim() },
})

const emptyOfferForm = {
  title: '', slug: '', subtitle: '', description: '', imageUrl: '', imageAlt: '', imagePublicId: '',
  discountType: 'percentage', discountValue: '', originalPrice: '', offerPrice: '',
  priceDisplay: '', badge: 'Special Offer', features: '', isActive: true, sortOrder: 0
}

const formFromOffer = (offer) => ({
  title: offer.title || '', slug: offer.slug || '', subtitle: offer.subtitle || '', description: offer.description || '',
  imageUrl: offer.image?.url || '', imageAlt: offer.image?.alt || '', imagePublicId: offer.image?.publicId || '',
  discountType: offer.discountType || 'percentage', discountValue: offer.discountValue ?? '',
  originalPrice: offer.originalPrice ?? '', offerPrice: offer.offerPrice ?? '',
  priceDisplay: offer.priceDisplay || '', badge: offer.badge || 'Special Offer',
  features: (offer.features || []).join('\n'), isActive: Boolean(offer.isActive ?? true), sortOrder: offer.sortOrder || 0
})

const formToOffer = (form) => ({
  title: form.title.trim(), slug: form.slug.trim(), subtitle: form.subtitle.trim(), description: form.description.trim(),
  image: { url: form.imageUrl.trim(), alt: form.imageAlt.trim() || form.title.trim(), ...(form.imagePublicId ? { publicId: form.imagePublicId } : {}) },
  discountType: form.discountType, discountValue: Number(form.discountValue) || 0,
  originalPrice: Number(form.originalPrice) || 0, offerPrice: Number(form.offerPrice) || 0,
  priceDisplay: form.priceDisplay.trim() || (form.offerPrice ? `৳ ${Number(form.offerPrice).toLocaleString()}` : ''),
  badge: form.badge.trim() || 'Special Offer',
  features: form.features.split('\n').map((item) => item.trim()).filter(Boolean),
  isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0
})

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      })
      const payload = await result.json()
      if (!result.ok) throw new Error(payload.message || 'Unable to sign in.')
      saveAdminToken(payload.token)
      window.history.replaceState({}, '', '/admin')
      onLogin()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-auth-shell">
      <div className="admin-auth-card">
        <div className="admin-brand">
          <span className="admin-brand-mark">d</span>
          <span>Dhaka Flower Tub</span>
        </div>
        <p className="admin-kicker">Private workspace</p>
        <h1>Welcome back.</h1>
        <p className="admin-muted">Sign in to manage products and special offer packages.</p>
        <form onSubmit={submit} className="admin-form">
          <label>Username
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>Password
            <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button className="admin-primary-button" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <a className="back-to-site" href="/">Back to website</a>
      </div>
    </main>
  )
}

function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(product ? formFromProduct(product) : emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.category) { setError('Name and category are required.'); return }
    if (isUploading) { setError('Please wait for the image upload to finish.'); return }
    setError('')
    setIsSaving(true)
    try {
      const path = product ? `/products/${product._id}` : '/products'
      const result = await adminRequest(path, { method: product ? 'PUT' : 'POST', body: JSON.stringify(formToProduct(form)) })
      onSaved(result.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-form-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">{product ? 'Update catalogue item' : 'New catalogue item'}</p>
          <h2>{product ? 'Edit product' : 'Add product'}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onCancel} aria-label="Close product form"><X size={19} /></button>
      </div>
      <form className="admin-product-form" onSubmit={submit}>
        <fieldset>
          <legend>Basic information</legend>
          <div className="admin-field-grid">
            <label className="wide-field">Name *<input value={form.name} onChange={(event) => updateField('name', event.target.value)} required /></label>
            <label>Category *
              <select value={form.category} onChange={(event) => updateField('category', event.target.value)} required>
                <option value="" disabled>Select a category</option>
                {categories.map((category) => <option key={category.key} value={category.key}>{category.name}</option>)}
              </select>
            </label>
            <label>Slug<input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="Generated from name if blank" /></label>
            <label className="wide-field">Short description<textarea rows="2" value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} /></label>
            <label className="wide-field">Description<textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Pricing and availability</legend>
          <div className="admin-field-grid">
            <label>Price<input type="number" min="0" value={form.price} onChange={(event) => updateField('price', event.target.value)} /></label>
            <label>Display price<input value={form.priceDisplay} onChange={(event) => updateField('priceDisplay', event.target.value)} placeholder="৳ 1,650" /></label>
            <label>Status
              <select value={form.availability} onChange={(event) => updateField('availability', event.target.value)}>
                <option value="in_stock">In stock</option>
                <option value="made_to_order">Made to order</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </label>
            <label>Badge<input value={form.badge} onChange={(event) => updateField('badge', event.target.value)} placeholder="Bestseller" /></label>
            <label>Sort order<input type="number" value={form.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} /> Featured product</label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Image</legend>
          <div className="admin-field-grid">
            <ImageUploader
              label="Product image"
              scope="products"
              value={form.imageUrl ? { url: form.imageUrl, publicId: form.imagePublicId } : null}
              onBusyChange={setIsUploading}
              onChange={(image) => setForm((current) => ({ ...current, imageUrl: image?.url || '', imagePublicId: image?.publicId || '' }))}
            />
            <label className="wide-field">Image alt text<input value={form.imageAlt} onChange={(event) => updateField('imageAlt', event.target.value)} placeholder="Describe the image for screen readers" /></label>
            {form.extraImages.length > 0 && <p className="admin-help wide-field">{form.extraImages.length} additional gallery image{form.extraImages.length === 1 ? ' is' : 's are'} kept as is.</p>}
          </div>
        </fieldset>
        <fieldset>
          <legend>Details</legend>
          <div className="admin-field-grid">
            <label>Material<input value={form.material} onChange={(event) => updateField('material', event.target.value)} /></label>
            <label>Finish<input value={form.finish} onChange={(event) => updateField('finish', event.target.value)} /></label>
            <label>Height<input value={form.height} onChange={(event) => updateField('height', event.target.value)} /></label>
            <label>Diameter<input value={form.diameter} onChange={(event) => updateField('diameter', event.target.value)} /></label>
            <label>Length<input value={form.length} onChange={(event) => updateField('length', event.target.value)} /></label>
            <label>Width<input value={form.width} onChange={(event) => updateField('width', event.target.value)} /></label>
            <label className="wide-field">Features <span className="admin-help">One per line</span><textarea rows="4" value={form.features} onChange={(event) => updateField('features', event.target.value)} /></label>
            <label className="wide-field">Specifications <span className="admin-help">One per line, formatted as Label | Value</span><textarea rows="5" value={form.specifications} onChange={(event) => updateField('specifications', event.target.value)} /></label>
          </div>
        </fieldset>
        {error && <p className="admin-error">{error}</p>}
        <div className="form-actions">
          <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="admin-primary-button" disabled={isSaving || isUploading}>{isSaving ? 'Saving...' : isUploading ? 'Uploading image...' : product ? 'Save changes' : 'Create product'}</button>
        </div>
      </form>
    </div>
  )
}

function OfferPackageForm({ offer, onSaved, onCancel }) {
  const [form, setForm] = useState(offer ? formFromOffer(offer) : emptyOfferForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) { setError('Package title is required.'); return }
    if (!form.imageUrl.trim()) { setError('Please upload a package image.'); return }
    if (isUploading) { setError('Please wait for the image upload to finish.'); return }
    if (!(Number(form.offerPrice) > 0)) { setError('Offer price must be greater than 0.'); return }
    if (Number(form.originalPrice) > 0 && Number(form.offerPrice) > Number(form.originalPrice)) { setError('Offer price cannot be higher than the original price.'); return }
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) { setError('A percentage discount cannot be more than 100.'); return }
    setError('')
    setIsSaving(true)
    try {
      const path = offer ? `/offers/${offer._id || offer.slug}` : '/offers'
      const result = await adminRequest(path, {
        method: offer ? 'PUT' : 'POST',
        body: JSON.stringify(formToOffer(form))
      })
      onSaved(result.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-form-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">{offer ? 'Update special offer' : 'Create special offer package'}</p>
          <h2>{offer ? 'Edit offer package' : 'New offer package'}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onCancel} aria-label="Close offer form"><X size={19} /></button>
      </div>
      <form className="admin-product-form" onSubmit={submit}>
        <fieldset>
          <legend>Package Overview</legend>
          <div className="admin-field-grid">
            <label className="wide-field">Title *<input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. Living Room Trio Package" required /></label>
            <label className="wide-field">Subtitle / Tagline<input value={form.subtitle} onChange={(event) => updateField('subtitle', event.target.value)} placeholder="e.g. Nordic Cylinder + Terrazzo Low Bowl + Ceramic Urn" /></label>
            <label>Slug<input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="Generated from title if blank" /></label>
            <label>Badge<input value={form.badge} onChange={(event) => updateField('badge', event.target.value)} placeholder="Limited Offer / Bestseller" /></label>
            <label className="wide-field">Description<textarea rows="3" value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Pricing & Discount</legend>
          <div className="admin-field-grid">
            <label>Original Price (৳)<input type="number" min="0" value={form.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} placeholder="e.g. 6200" /></label>
            <label>Offer Price (৳) *<input type="number" min="0" value={form.offerPrice} onChange={(event) => updateField('offerPrice', event.target.value)} placeholder="e.g. 5250" required /></label>
            <label>Display Price Text<input value={form.priceDisplay} onChange={(event) => updateField('priceDisplay', event.target.value)} placeholder="e.g. ৳ 5,250" /></label>
            <label>Discount Type
              <select value={form.discountType} onChange={(event) => updateField('discountType', event.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (৳)</option>
                <option value="none">No discount badge</option>
              </select>
            </label>
            <label>Discount Value<input type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined} value={form.discountValue} onChange={(event) => updateField('discountValue', event.target.value)} placeholder="e.g. 15" /></label>
            <label>Sort Order<input type="number" value={form.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} /> Active on website</label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Package Visual & Features</legend>
          <div className="admin-field-grid">
            <ImageUploader
              label="Package image"
              scope="offers"
              required
              value={form.imageUrl ? { url: form.imageUrl, publicId: form.imagePublicId } : null}
              onBusyChange={setIsUploading}
              onChange={(image) => setForm((current) => ({ ...current, imageUrl: image?.url || '', imagePublicId: image?.publicId || '' }))}
            />
            <label className="wide-field">Image Alt Text<input value={form.imageAlt} onChange={(event) => updateField('imageAlt', event.target.value)} placeholder="Defaults to the package title" /></label>
            <label className="wide-field">Package Highlights / Features <span className="admin-help">One per line</span>
              <textarea rows="4" value={form.features} onChange={(event) => updateField('features', event.target.value)} placeholder="3 Curated Architectural Planters&#10;Free Protective Saucer Set&#10;Priority Delivery across Dhaka" />
            </label>
          </div>
        </fieldset>
        {error && <p className="admin-error">{error}</p>}
        <div className="form-actions">
          <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="admin-primary-button" disabled={isSaving || isUploading}>{isSaving ? 'Saving...' : isUploading ? 'Uploading image...' : offer ? 'Save changes' : 'Create offer package'}</button>
        </div>
      </form>
    </div>
  )
}

function CategoryCard({ category, productCount, onSaved }) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(0)

  const isChanged = name.trim() !== category.name || description.trim() !== (category.description || '')

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) { setError('Category name is required.'); return }
    setError('')
    setIsSaving(true)
    try {
      const result = await adminRequest(`/categories/${category.key}`, {
        method: 'PUT', body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      setName(result.data.name)
      setDescription(result.data.description || '')
      setSavedAt(Date.now())
      onSaved(result.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="category-admin-card" onSubmit={submit}>
      <div className="category-admin-meta">
        <span className="category-admin-key">{category.key}</span>
        <span className="admin-help">{productCount} {productCount === 1 ? 'product' : 'products'}</span>
      </div>
      <label>Name
        <input value={name} maxLength={40} onChange={(event) => { setName(event.target.value); setSavedAt(0) }} required />
      </label>
      <label>Description
        <input value={description} maxLength={120} onChange={(event) => { setDescription(event.target.value); setSavedAt(0) }} />
      </label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="category-admin-foot">
        {savedAt > 0 && !isChanged && <span className="category-admin-saved"><Check size={14} /> Saved</span>}
        <button className="admin-primary-button" disabled={isSaving || !isChanged}>{isSaving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
  )
}

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('products') // 'products' | 'offers' | 'categories'
  const [products, setProducts] = useState([])
  const [offers, setOffers] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingOffer, setEditingOffer] = useState(null)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [isOfferFormOpen, setIsOfferFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [productsRes, offersRes, categoriesRes] = await Promise.all([
        adminRequest('/products?limit=200'),
        adminRequest('/offers?active=false'),
        adminRequest('/categories'),
      ])
      setProducts(productsRes.data || [])
      setOffers(offersRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Products handlers
  const categoryNames = useMemo(() => Object.fromEntries(categories.map((category) => [category.key, category.name])), [categories])
  const categoryProductCounts = useMemo(() => products.reduce((counts, product) => ({ ...counts, [product.category]: (counts[product.category] || 0) + 1 }), {}), [products])
  const visibleProducts = useMemo(() =>
    products.filter((product) => `${product.name} ${categoryNames[product.category] || product.category}`.toLowerCase().includes(search.toLowerCase().trim())),
    [products, search, categoryNames]
  )
  const saveCategory = (saved) => setCategories((current) => current.map((item) => item.key === saved.key ? saved : item))
  const saveProduct = (saved) => {
    setProducts((current) => {
      const exists = current.some((item) => item._id === saved._id)
      return exists ? current.map((item) => item._id === saved._id ? saved : item) : [saved, ...current]
    })
    setEditingProduct(null)
    setIsProductFormOpen(false)
  }
  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return
    try {
      await adminRequest(`/products/${product._id}`, { method: 'DELETE' })
      setProducts((current) => current.filter((item) => item._id !== product._id))
    } catch (requestError) { setError(requestError.message) }
  }
  const updateProduct = async (product, changes) => {
    try {
      const result = await adminRequest(`/products/${product._id}`, { method: 'PUT', body: JSON.stringify(changes) })
      setProducts((current) => current.map((item) => item._id === product._id ? result.data : item))
    } catch (requestError) { setError(requestError.message) }
  }

  // Offers handlers
  const visibleOffers = useMemo(() =>
    offers.filter((offer) => `${offer.title} ${offer.subtitle || ''}`.toLowerCase().includes(search.toLowerCase().trim())),
    [offers, search]
  )
  const saveOffer = (saved) => {
    setOffers((current) => {
      const exists = current.some((item) => item._id === saved._id || item.slug === saved.slug)
      return exists ? current.map((item) => (item._id === saved._id || item.slug === saved.slug) ? saved : item) : [saved, ...current]
    })
    setEditingOffer(null)
    setIsOfferFormOpen(false)
  }
  const deleteOffer = async (offer) => {
    if (!window.confirm(`Delete offer package "${offer.title}"?`)) return
    try {
      await adminRequest(`/offers/${offer._id || offer.slug}`, { method: 'DELETE' })
      setOffers((current) => current.filter((item) => item._id !== offer._id && item.slug !== offer.slug))
    } catch (requestError) { setError(requestError.message) }
  }
  const toggleOfferStatus = async (offer) => {
    try {
      const result = await adminRequest(`/offers/${offer._id || offer.slug}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !offer.isActive })
      })
      setOffers((current) => current.map((item) => (item._id === offer._id || item.slug === offer.slug) ? result.data : item))
    } catch (requestError) { setError(requestError.message) }
  }

  const logout = () => { clearAdminToken(); window.history.replaceState({}, '', '/admin/login'); onLogout() }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          <span className="admin-brand-mark">d</span>
          <span>Dhaka Flower Tub <small>Admin</small></span>
        </a>
        <div className="admin-header-actions">
          <a href="/" className="back-to-site">View website</a>
          <button className="admin-logout" type="button" onClick={logout}><LogOut size={16} /> Log out</button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-page-heading">
          <div>
            <p className="admin-kicker">Management Workspace</p>
            <h1>{activeTab === 'products' ? 'Products' : activeTab === 'offers' ? 'Offer Packages' : 'Categories'}</h1>
            <p className="admin-muted">
              {activeTab === 'products'
                ? 'Manage catalogue items and inventory displayed on the store.'
                : activeTab === 'offers'
                  ? 'Manage special bundles and curated offer packages shown on the homepage.'
                  : 'The catalogue has exactly four categories. Rename them or change their descriptions; the website updates automatically.'}
            </p>
          </div>
          <div className="flex gap-2.5">
            {activeTab === 'products' ? (
              <button className="admin-primary-button add-button" type="button" onClick={() => { setEditingProduct(null); setIsProductFormOpen(true) }}>
                <Plus size={17} /> Add product
              </button>
            ) : activeTab === 'offers' && (
              <button className="admin-primary-button add-button" type="button" onClick={() => { setEditingOffer(null); setIsOfferFormOpen(true) }}>
                <Plus size={17} /> Add offer package
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex gap-3 border-b border-[#dfe4dc] pb-3">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition ${
              activeTab === 'products'
                ? 'bg-[#174d39] text-white'
                : 'bg-white text-[#6b766d] hover:bg-[#e8ece5] hover:text-[#174d39]'
            }`}
            onClick={() => { setActiveTab('products'); setSearch('') }}
          >
            <Package size={15} /> Products ({products.length})
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition ${
              activeTab === 'offers'
                ? 'bg-[#174d39] text-white'
                : 'bg-white text-[#6b766d] hover:bg-[#e8ece5] hover:text-[#174d39]'
            }`}
            onClick={() => { setActiveTab('offers'); setSearch('') }}
          >
            <Tag size={15} /> Offer Packages ({offers.length})
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition ${
              activeTab === 'categories'
                ? 'bg-[#174d39] text-white'
                : 'bg-white text-[#6b766d] hover:bg-[#e8ece5] hover:text-[#174d39]'
            }`}
            onClick={() => { setActiveTab('categories'); setSearch('') }}
          >
            <LayoutGrid size={15} /> Categories ({categories.length})
          </button>
        </div>

        {error && <p className="admin-error admin-banner">{error}</p>}

        {activeTab !== 'categories' && <div className="admin-toolbar">
          <div className="admin-stat">
            {activeTab === 'products' ? <Package size={18} /> : <Tag size={18} />}
            <strong>{activeTab === 'products' ? visibleProducts.length : visibleOffers.length}</strong>
            <span>{activeTab === 'products' ? 'products' : 'offer packages'}</span>
          </div>
          <label className="admin-search">
            <Search size={17} />
            <span className="sr-only">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={activeTab === 'products' ? 'Search products...' : 'Search offer packages...'}
            />
          </label>
        </div>}

        {isLoading ? (
          <p className="admin-muted">Loading workspace data...</p>
        ) : activeTab === 'categories' ? (
          <div className="category-admin-grid">
            {categories.map((category) => (
              <CategoryCard key={`${category.key}-${category.updatedAt || ''}`} category={category} productCount={categoryProductCounts[category.key] || 0} onSaved={saveCategory} />
            ))}
          </div>
        ) : activeTab === 'products' ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Featured</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product._id || product.slug}>
                    <td>
                      <div className="admin-product-cell">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt="" />
                        ) : (
                          <div className="admin-image-placeholder"><Package size={15} /></div>
                        )}
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{categoryNames[product.category] || product.category}</td>
                    <td>{product.priceDisplay || (product.price ? `৳ ${product.price.toLocaleString()}` : 'On request')}</td>
                    <td>
                      <select className="status-select" value={product.availability} onChange={(event) => updateProduct(product, { availability: event.target.value })}>
                        <option value="in_stock">In stock</option>
                        <option value="made_to_order">Made to order</option>
                        <option value="out_of_stock">Out of stock</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={product.isFeatured ? 'feature-toggle active' : 'feature-toggle'}
                        type="button"
                        aria-label={product.isFeatured ? 'Remove featured status' : 'Mark as featured'}
                        onClick={() => updateProduct(product, { isFeatured: !product.isFeatured })}
                      >
                        <Star size={16} fill={product.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" type="button" onClick={() => { setEditingProduct(product); setIsProductFormOpen(true) }} aria-label={`Edit ${product.name}`}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger" type="button" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleProducts.length === 0 && <p className="admin-empty">No products match your search.</p>}
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Offer Package</th><th>Badge</th><th>Offer Price</th><th>Original</th><th>Status</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleOffers.map((offer) => (
                  <tr key={offer._id || offer.slug}>
                    <td>
                      <div className="admin-product-cell">
                        {offer.image?.url ? (
                          <img src={offer.image.url} alt="" />
                        ) : (
                          <div className="admin-image-placeholder"><Tag size={15} /></div>
                        )}
                        <div>
                          <strong>{offer.title}</strong>
                          {offer.subtitle && <p className="text-[11px] text-[#6b766d] m-0">{offer.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="inline-block rounded-full bg-[#e8ece5] px-2.5 py-1 text-[10px] font-semibold text-[#174d39] uppercase">{offer.badge || 'Offer'}</span></td>
                    <td><strong className="text-[#174d39]">{offer.priceDisplay || `৳ ${offer.offerPrice?.toLocaleString()}`}</strong></td>
                    <td className="text-[#6b766d] line-through">{offer.originalPrice ? `৳ ${offer.originalPrice.toLocaleString()}` : '—'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleOfferStatus(offer)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase transition ${
                          offer.isActive ? 'bg-[#c6f35c] text-[#10291a]' : 'bg-[#e0e4dd] text-[#6b766d]'
                        }`}
                      >
                        {offer.isActive ? 'Live' : 'Paused'}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" type="button" onClick={() => { setEditingOffer(offer); setIsOfferFormOpen(true) }} aria-label={`Edit ${offer.title}`}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger" type="button" onClick={() => deleteOffer(offer)} aria-label={`Delete ${offer.title}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleOffers.length === 0 && <p className="admin-empty">No offer packages match your search.</p>}
          </div>
        )}
      </section>

      {isProductFormOpen && (
        <div className="admin-form-overlay">
          <ProductForm product={editingProduct} categories={categories} onSaved={saveProduct} onCancel={() => setIsProductFormOpen(false)} />
        </div>
      )}

      {isOfferFormOpen && (
        <div className="admin-form-overlay">
          <OfferPackageForm offer={editingOffer} onSaved={saveOffer} onCancel={() => setIsOfferFormOpen(false)} />
        </div>
      )}
    </main>
  )
}

function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAdminToken()))
  const [isChecking, setIsChecking] = useState(Boolean(getAdminToken()))

  useEffect(() => {
    if (!getAdminToken()) return undefined
    adminRequest('/auth/me').catch(() => { clearAdminToken(); setIsAuthenticated(false) }).finally(() => setIsChecking(false))
    return undefined
  }, [])

  if (isChecking) return <main className="admin-auth-shell"><p className="admin-muted">Checking access...</p></main>
  if (!isAuthenticated) return <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
}

export default AdminApp
