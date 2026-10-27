import { Coffee, Cookie, Moon, Salad, Sandwich } from 'lucide-react'

export const MEALS = [
  { id: 'breakfast', name: 'Desayuno', icon: Coffee },
  { id: 'lunch', name: 'Comida', icon: Salad },
  { id: 'snack', name: 'Merienda', icon: Cookie },
  { id: 'dinner', name: 'Cena', icon: Moon },
  { id: 'other', name: 'Otros', icon: Sandwich },
]

/** Default meal for the current time of day. */
export function mealForNow(date = new Date()) {
  const h = date.getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 19) return 'snack'
  return 'dinner'
}

export const MACROS = [
  { id: 'protein', name: 'Proteína', short: 'P', color: '#60a5fa' },
  { id: 'carbs', name: 'Carbohidratos', short: 'C', color: '#fbbf24' },
  { id: 'fat', name: 'Grasas', short: 'G', color: '#f472b6' },
]

export function sumNutrition(entries) {
  return entries.reduce(
    (t, e) => ({
      kcal: t.kcal + (e.kcal || 0),
      protein: t.protein + (e.protein || 0),
      carbs: t.carbs + (e.carbs || 0),
      fat: t.fat + (e.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
