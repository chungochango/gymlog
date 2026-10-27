// Open Food Facts: free, open product database (CORS enabled, no key needed).
const API = 'https://world.openfoodfacts.org/api/v2/product/'
const FIELDS = 'product_name,product_name_es,brands,nutriments,serving_quantity'

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : Number.parseFloat(v)) || 0

/** Product nutrition per 100 g for a barcode, or null if it isn't in the database. */
export async function fetchProduct(code) {
  const res = await fetch(`${API}${encodeURIComponent(code)}.json?fields=${FIELDS}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`)
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null

  const p = data.product
  const n = p.nutriments ?? {}
  const kcal = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0)
  return {
    code,
    name: (p.product_name_es || p.product_name || 'Producto sin nombre').trim(),
    brand: p.brands?.split(',')[0]?.trim() || '',
    serving: num(p.serving_quantity) || null,
    per100: { kcal: num(kcal), protein: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), fat: num(n.fat_100g) },
  }
}

/** Nutrition for a given amount in grams, rounded for display. */
export function forGrams(product, grams) {
  const f = grams / 100
  const r1 = (v) => Math.round(v * f * 10) / 10
  return {
    kcal: Math.round(product.per100.kcal * f),
    protein: r1(product.per100.protein),
    carbs: r1(product.per100.carbs),
    fat: r1(product.per100.fat),
  }
}
