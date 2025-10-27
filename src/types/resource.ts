export interface Resource {
  id: string
  name: string
  url: string
  description: string
  category: 'Brand' | 'UX' | 'Art' | 'Code'
  section: string
  pricing: string
  featured: boolean
  openSource: boolean
  tags: string[]
  count: string
  tier: number
}
