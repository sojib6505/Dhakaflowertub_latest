const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '8801711292501'

export const getWhatsAppLink = (item, type = 'product') => {
  if (!item) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Hello Dhaka Flower Tub, I would like to enquire about your collection and available pieces.'
    )}`
  }

  if (type === 'offer' || item.offerPrice !== undefined || item.title !== undefined) {
    const offerTitle = item.title || item.name || 'Special Offer Package'
    const priceText = item.priceDisplay || (item.offerPrice ? `৳ ${item.offerPrice.toLocaleString()}` : '')
    const message = `Hello Dhaka Flower Tub, I am interested in this Special Offer Package.\n\nPackage: ${offerTitle}\nPrice: ${priceText}\n\nI would like to order or enquire about this offer package.`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  }

  const productMessage = `Hello Dhaka Flower Tub, I am interested in this product.\n\nProduct: ${item.name}\nCategory: ${item.categoryName || item.category}\nPrice: ${item.priceDisplay || (item.price ? `৳ ${item.price.toLocaleString()}` : 'Price on request')}\n\nI would like to know more about this product.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(productMessage)}`
}

export const getWhatsAppNumber = () => WHATSAPP_NUMBER
