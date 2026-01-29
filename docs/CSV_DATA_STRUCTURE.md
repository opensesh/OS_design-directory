# CSV Data Structure & Particle Mapping

## Overview

Your 3D particle system is now fully connected to the **Design Resources.csv** file. Each of the 1000 particles is mapped to one of the 100 design resources from the CSV.

---

## CSV Structure

**Location:** `/public/Design Resources.csv`

**Total Resources:** 100 design tools, websites, and platforms

### CSV Columns:

| Column | Type | Description | Example Values |
|--------|------|-------------|----------------|
| `ID` | number | Unique identifier | 1, 2, 3... |
| `Name` | string | Resource name | "Figma", "Coolors", "React" |
| `URL` | string | Website URL | "https://figma.com" |
| `Description` | string | Short description | "Collaborative design tool" |
| `Category` | string | Main category | "Brand", "UX", "Art", "Code" |
| `Section` | string | Subcategory | "Colors", "Design Tools", "Icons" |
| `Pricing` | string | Price model | "free", "freemium", "paid" |
| `Featured` | boolean | Featured status | TRUE, FALSE |
| `OpenSource` | boolean | Open source? | TRUE, FALSE |
| `Tags` | string | Comma-separated tags | "colors,palette,generator" |
| `Count` | string | Asset count | "∞ palettes", "1,000+ icons" |
| `Tier` | number | Priority tier | 1, 2, 3 |

---

## Category Breakdown

Your 100 resources are distributed across 4 categories:

- **Brand** (23 resources): Color tools, typography, brand guidelines
- **UX** (19 resources): Design tools, prototyping, user testing, accessibility
- **Art** (41 resources): Icons, illustrations, photos, patterns, videos
- **Code** (17 resources): Frameworks, UI kits, AI tools, mockups

---

## How Particle Mapping Works

### File Structure:

```
src/
├── types/
│   └── resource.ts          # TypeScript interface for Resource
├── utils/
│   └── loadResources.ts     # CSV parser using papaparse
├── store/
│   └── useAppStore.ts       # Zustand store with resources array
├── components/
│   └── 3d/
│       └── ParticleSystem.tsx  # Particle renderer with data mapping
└── App.tsx                  # Loads CSV on mount
```

### Data Flow:

1. **App.tsx loads CSV on mount:**
   ```typescript
   useEffect(() => {
     loadResources()
       .then((data) => setResources(data))
       .catch(console.error)
   }, [])
   ```

2. **loadResources() parses CSV:**
   - Fetches `/public/Design Resources.csv`
   - Uses papaparse to convert CSV → JSON
   - Transforms data to match `Resource` TypeScript interface
   - Returns array of 100 Resource objects

3. **Data stored in Zustand:**
   ```typescript
   const resources = useAppStore((state) => state.resources)  // Array of 100 resources
   ```

4. **ParticleSystem maps particles to resources:**
   ```typescript
   const getResourceForParticle = (index: number) => {
     return resources[index % resources.length]
   }
   ```

### Mapping Example:

With 1000 particles and 100 resources:
- Particle 0 → Resource 0 (Coolors)
- Particle 1 → Resource 1 (Google Fonts)
- Particle 50 → Resource 50 (Humaaans)
- Particle 100 → Resource 0 (Coolors) ← cycles back
- Particle 999 → Resource 99 (Diagram)

Each resource is represented by **10 particles** in the sphere.

---

## Accessing Resource Data

### In ParticleSystem.tsx:

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

**2. Show resource info on click:**
```typescript
const handleClick = (particleIndex: number) => {
  const resource = getResourceForParticle(particleIndex)
  setSelectedResource(resource?.id)
}
```

**3. Color particles by category:**
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

**4. Filter by featured status:**
```typescript
const isFeatured = getResourceForParticle(index)?.featured
if (isFeatured) {
  // Make particle larger or different color
}
```

**5. Sort by tier:**
```typescript
const tier = getResourceForParticle(index)?.tier
// Tier 1 = highest priority, show closest to center
```

---

## Data Validation

The system includes:

✅ **TypeScript type safety** - Resource interface enforces structure
✅ **Null checks** - `getResourceForParticle()` returns null if resources not loaded
✅ **Console logging** - Logs when resources load and shows example mappings
✅ **Error handling** - Catches CSV parsing errors

### Debug in Browser Console:

After page load, you'll see:
```
Loaded resources: 100
✅ Particle-Resource Mapping:
   Total Resources: 100
   Total Particles: 1000
   Example mappings:
   - Particle 0: Coolors (Brand)
   - Particle 50: Humaaans (Art)
   - Particle 100: Coolors (Brand)
```

---

## Next Steps

Now that particles are mapped to CSV data, you can:

1. **Add interactivity:**
   - Click particles → show resource card
   - Hover particles → display resource name
   - Filter particles by category

2. **Visual encoding:**
   - Color particles by category
   - Size particles by tier (featured resources larger)
   - Highlight free vs paid resources

3. **Search & Filter:**
   - Filter by tags
   - Search by name
   - Show only featured resources

4. **Data updates:**
   - Edit CSV file → refresh page → see changes
   - Add new resources → they automatically appear
   - No code changes needed for data updates

---

## File Locations

- **CSV Data:** `public/Design Resources.csv`
- **Types:** `src/types/resource.ts`
- **Loader:** `src/utils/loadResources.ts`
- **Store:** `src/store/useAppStore.ts`
- **Particle System:** `src/components/3d/ParticleSystem.tsx`

---

**✅ Status: Fully Connected & Working**

Your particles are now data-driven! Each particle has metadata from your CSV file.
