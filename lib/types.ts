export interface Item {
  id: string
  name: string
  category: string
  quantity: number
  price: number
}

export const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Office Supplies",
  "Kitchen",
  "Clothing",
  "Tools",
  "Books",
  "Other",
] as const

export type Category = (typeof CATEGORIES)[number]

