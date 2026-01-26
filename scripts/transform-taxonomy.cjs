#!/usr/bin/env node
/**
 * Transform Taxonomy Script
 * Maps old subcategories to the new consolidated taxonomy
 */

const fs = require('fs');
const path = require('path');

// Define the subcategory mappings per category
const SUBCATEGORY_MAPPINGS = {
  Tools: {
    // Design & Creative
    'Design': 'Design & Creative',
    'Color': 'Design & Creative',
    'Branding': 'Design & Creative',
    'Graphics': 'Design & Creative',
    'Design Systems': 'Design & Creative',
    // Development
    'Development': 'Development',
    'Components': 'Development',
    'Backend': 'Development',
    'Auth': 'Development',
    'Database': 'Development',
    'Infrastructure': 'Development',
    // No-Code & Builders
    'No-Code': 'No-Code & Builders',
    // Animation & 3D
    'Animation': 'Animation & 3D',
    '3D': 'Animation & 3D',
    // Hosting & Deployment
    'Hosting': 'Hosting & Deployment',
    // Productivity & Utilities
    'Productivity': 'Productivity & Utilities',
    'Collaboration': 'Productivity & Utilities',
    'Analytics': 'Productivity & Utilities',
    'Email': 'Productivity & Utilities',
    'Converters': 'Productivity & Utilities',
    'Video': 'Productivity & Utilities',
    'Payments': 'Productivity & Utilities',
    'Scheduling': 'Productivity & Utilities',
    'Social Media': 'Productivity & Utilities',
    'Diagramming': 'Productivity & Utilities',
    'Communication': 'Productivity & Utilities',
    'Business': 'Productivity & Utilities',
    'Image Tools': 'Productivity & Utilities',
  },
  Templates: {
    // Assets & Media
    'Images': 'Assets & Media',
    'Icons': 'Assets & Media',
    'Textures': 'Assets & Media',
    'Mockups': 'Assets & Media',
    'Animations': 'Assets & Media',
    // Design Kits
    'UI Kits': 'Design Kits',
    // Site Templates
    'Framer': 'Site Templates',
    'Webflow': 'Site Templates',
    'E-commerce': 'Site Templates',
    'Productivity': 'Site Templates', // Notion templates etc.
  },
  AI: {
    // Generative Media
    'Image Generation': 'Generative Media',
    'Video Generation': 'Generative Media',
    'Audio': 'Generative Media',
    'Design': 'Generative Media', // AI design tools like Endless Tools
    // Assistants & Chat
    'Chat': 'Assistants & Chat',
    'Search': 'Assistants & Chat',
    'Automation': 'Assistants & Chat',
    'Presentations': 'Assistants & Chat',
    // Development & Infrastructure
    'Code Generation': 'Development & Infrastructure',
    'Infrastructure': 'Development & Infrastructure',
    'Development': 'Development & Infrastructure',
  },
  Learning: {
    // Guides & Resources
    'Resources': 'Guides & Resources',
    'Courses': 'Guides & Resources',
    // Blogs & Publications
    'Blogs': 'Blogs & Publications',
    'Video': 'Blogs & Publications',
  },
  Inspiration: {
    // Galleries & Awards
    'Awards': 'Galleries & Awards',
    'Galleries': 'Galleries & Awards',
    // Showcases & Patterns
    'Portfolios': 'Showcases & Patterns',
    'UI Patterns': 'Showcases & Patterns',
  },
  Community: {
    // Platforms & Forums
    'Chat': 'Platforms & Forums',
    'Code': 'Platforms & Forums',
    'Blogging': 'Platforms & Forums',
    // Discovery & News
    'Discovery': 'Discovery & News',
    'News': 'Discovery & News',
    'Entrepreneurship': 'Discovery & News',
    // Hiring & Talent (from Contractors)
    'Freelance': 'Hiring & Talent',
  },
  Contractors: {
    // All Contractors move to Community -> Hiring & Talent
    'Freelance': 'Hiring & Talent',
  },
};

function transformResource(resource) {
  const { category, subCategory } = resource;

  // Handle Contractors -> Community migration
  if (category === 'Contractors') {
    return {
      ...resource,
      category: 'Community',
      subCategory: 'Hiring & Talent',
    };
  }

  // Look up mapping
  const categoryMappings = SUBCATEGORY_MAPPINGS[category];
  if (!categoryMappings) {
    console.warn(`Warning: Unknown category "${category}" for resource "${resource.name}"`);
    return resource;
  }

  const newSubCategory = categoryMappings[subCategory];
  if (!newSubCategory) {
    console.warn(`Warning: Unknown subCategory "${subCategory}" in category "${category}" for resource "${resource.name}"`);
    return resource;
  }

  return {
    ...resource,
    subCategory: newSubCategory,
  };
}

function main() {
  const inputPath = path.join(__dirname, '../src/data/resources.json');
  const outputPath = inputPath; // Overwrite in place

  console.log('Reading resources...');
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const resources = JSON.parse(rawData);

  console.log(`Processing ${resources.length} resources...`);

  // Transform each resource
  const transformedResources = resources.map(transformResource);

  // Analyze results
  const categoryStats = {};
  const subCategoryStats = {};

  transformedResources.forEach(r => {
    const key = `${r.category}`;
    categoryStats[key] = (categoryStats[key] || 0) + 1;

    const subKey = `${r.category} → ${r.subCategory}`;
    subCategoryStats[subKey] = (subCategoryStats[subKey] || 0) + 1;
  });

  console.log('\n=== Category Statistics ===');
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  console.log('\n=== Subcategory Statistics ===');
  Object.entries(subCategoryStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([subCat, count]) => {
      console.log(`  ${subCat}: ${count}`);
    });

  // Count unique subcategories
  const uniqueSubCategories = new Set(transformedResources.map(r => `${r.category}::${r.subCategory}`));
  console.log(`\nTotal unique category->subcategory combinations: ${uniqueSubCategories.size}`);

  // Write output
  console.log('\nWriting transformed resources...');
  fs.writeFileSync(outputPath, JSON.stringify(transformedResources, null, 2) + '\n');

  console.log('Done!');
}

main();
