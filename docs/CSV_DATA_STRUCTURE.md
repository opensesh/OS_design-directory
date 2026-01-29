# Data Structure & Particle Mapping

## Overview

Your 3D particle system is connected to the **resources.json** file. Each of the 1000 particles is mapped to one of the design resources from the JSON data.

---

## Data Structure

**Location:** `src/data/resources.json`

**Total Resources:** 100+ design tools, websites, and platforms

### Resource Fields:

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `id` | string | Unique identifier | "figma", "coolors" |
| `name` | string | Resource name | "Figma", "Coolors" |
| `url` | string | Website URL | "https://figma.com" |
| `description` | string | Short description | "Collaborative design tool" |
| `category` | string | Main category | "Brand", "UX", "Art", "Code" |
| `subCategory` | string | Subcategory | "Colors", "Design Tools", "Icons" |
| `pricing` | string | Price model | "free", "freemium", "paid" |
| `featured` | boolean | Featured status | true, false |
| `opensource` | boolean | Open source? | true, false |
| `tags` | string[] | Tag array | ["colors", "palette", "generator"] |
| `tier` | number | Priority tier | 1, 2, 3 |
| `thumbnail` | string | Thumbnail path | "/assets/screenshots/figma.png" |
| `screenshot` | string | Screenshot path | "/assets/screenshots/figma.png" |
| `gravityScore` | number | Relevance score | 85 |
| `gravityRationale` | string | Score explanation | "Essential design tool..." |

---

## Category Breakdown

Resources are distributed across categories:

- **Brand**: Color tools, typography, brand guidelines
- **UX**: Design tools, prototyping, user testing, accessibility
- **Art**: Icons, illustrations, photos, patterns, videos
- **Code**: Frameworks, UI kits, AI tools, mockups

---

## How Particle Mapping Works

### File Structure:

```
src/
├── types/
│   └── resource.ts          # TypeScript interface for Resource
├── data/
│   ├── index.ts             # Data export
│   └── resources.json       # Main data source
├── store/
│   └── useAppStore.ts       # Zustand store with resources array
└── components/
    └── canvas/
        └── ResourceNodes.tsx  # Particle renderer with data mapping
```

### Data Flow:

1. **Data imported from JSON:**
   ```typescript
   import resourcesData from './resources.json';
   export const resources: NormalizedResource[] = resourcesData;
   ```

2. **Data stored in Zustand:**
   ```typescript
   const resources = useAppStore((state) => state.resources)
   ```

3. **Particles map to resources:**
   ```typescript
   const getResourceForParticle = (index: number) => {
     return resources[index % resources.length]
   }
   ```

---

## Accessing Resource Data

### In Components:

```typescript
// Get resource for a specific particle
const resource = getResourceForParticle(particleIndex)

console.log(resource?.name)        // "Figma"
console.log(resource?.category)    // "UX"
console.log(resource?.url)         // "https://figma.com"
console.log(resource?.description) // "Collaborative design tool"
console.log(resource?.tags)        // ["design", "prototyping", "collaboration"]
console.log(resource?.featured)    // true
console.log(resource?.tier)        // 1
```

### Common Use Cases:

**1. Filter particles by category:**
```typescript
const isBrandResource = getResourceForParticle(index)?.category === 'Brand'
```

**2. Color particles by category:**
```typescript
const getCategoryColor = (category: string) => {
  const colors = {
    'Brand': '#F59E0B',
    'UX': '#3B82F6',
    'Art': '#EC4899',
    'Code': '#10B981',
  }
  return colors[category]
}
```

---

## File Locations

- **Data:** `src/data/resources.json`
- **Types:** `src/types/resource.ts`
- **Store:** `src/store/useAppStore.ts`
- **Particle System:** `src/components/canvas/ResourceNodes.tsx`

---

**✅ Status: Fully Connected & Working**

Your particles are data-driven - each particle has metadata from the JSON file.
