import Papa from 'papaparse'
import type { Resource } from '../types/resource'

export async function loadResources(): Promise<Resource[]> {
  const response = await fetch('/Design Resources.csv')
  const csvText = await response.text()

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const resources: Resource[] = results.data.map((row: any) => ({
          id: row.ID,
          name: row.Name,
          url: row.URL,
          description: row.Description,
          category: row.Category as 'Brand' | 'UX' | 'Art' | 'Code',
          section: row.Section,
          pricing: row.Pricing,
          featured: row.Featured === 'TRUE',
          openSource: row.OpenSource === 'TRUE',
          tags: row.Tags ? row.Tags.split(',').map((tag: string) => tag.trim()) : [],
          count: row.Count,
          tier: parseInt(row.Tier, 10),
        }))
        resolve(resources)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
