// Used only until the API responds (or if it is unreachable). The API is the source of truth for names and descriptions.
export const DEFAULT_CATEGORIES = [
  { key: 'planters-tub', name: 'Planters & Tub', description: 'Decorative planters and premium tubs' },
  { key: 'planter-sets', name: 'Planter Sets', description: 'Beautifully curated planter combinations' },
  { key: 'plants', name: 'Plants', description: 'Indoor, outdoor and decorative plants' },
  { key: 'landscaping', name: 'Landscaping', description: 'Landscape design and greenery solutions' },
  { key: 'essentials-services', name: 'Essentials & Services', description: 'Gardening essentials and related services' },
]

export const CATEGORY_FALLBACK_IMAGES = {
  'planters-tub': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
  'planter-sets': 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=800&q=80',
  'plants': 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80',
  'landscaping': 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=800&q=80',
  'essentials-services': 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
}
