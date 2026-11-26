export const getVariants = (product) =>
  Array.isArray(product?.variants)
    ? [...product.variants]
        .filter((variant) => variant?.name?.trim() && Number(variant?.price) > 0)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : []

export const getVariantTotal = (product) =>
  getVariants(product).reduce((total, variant) => total + Number(variant.price), 0)

export const getMainPrice = (product) => {
  const variants = getVariants(product)
  if (variants.length > 0) return getVariantTotal(product)
  return Number(product?.price) || 0
}

export const formatMainPrice = (product) => {
  const variants = getVariants(product)
  if (variants.length === 0 && product?.priceDisplay) return product.priceDisplay
  const amount = getMainPrice(product)
  if (variants.length === 0 && (product?.isPriceCustom || !amount)) return 'Price on request'
  return `৳ ${amount.toLocaleString()}`
}

export const getOldPrice = (product) => {
  const amount = Number(product?.oldPrice)
  return amount > 0 ? amount : 0
}
