// Used only until the API responds (or if it is unreachable). The API is the source of truth for names and descriptions.
export const DEFAULT_CATEGORIES = [
  { key: 'residential', name: 'Residential', description: 'Homes, balconies & rooftops' },
  { key: 'corporate', name: 'Corporate', description: 'Offices & professional spaces' },
  { key: 'commercial', name: 'Commercial', description: 'Shops, cafés & restaurants' },
  { key: 'hospitality', name: 'Hospitality', description: 'Hotels, resorts & guest spaces' },
]

export const CATEGORY_FALLBACK_IMAGES = {
  residential: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
  corporate: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
  commercial: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
  hospitality: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
}
