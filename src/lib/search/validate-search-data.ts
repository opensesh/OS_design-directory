/**
 * Validation Script for Search Data Integrity
 * 
 * Run at build time to ensure:
 * - Concept mapping resourceNames reference existing resources
 * - No orphaned references in semantic mappings
 * 
 * Usage:
 *   import { validateSearchData } from './validate-search-data';
 *   validateSearchData(); // Throws if validation fails
 */

import { conceptMappings } from './semantic-mappings';
import { resources } from '../../data';

export interface ValidationError {
  type: 'missing_resource' | 'duplicate_mapping' | 'empty_keywords';
  concept: string;
  detail: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate that all concept mapping resourceNames exist in resources.json
 */
export function validateConceptMappings(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // Build a set of resource names (lowercase for case-insensitive matching)
  const resourceNames = new Set(
    resources.map(r => r.name.toLowerCase())
  );
  
  // Also track resources mentioned in mappings to check for duplicates
  const mentionedResources = new Map<string, string[]>();
  
  for (const [conceptName, concept] of Object.entries(conceptMappings)) {
    // Check for empty keywords
    if (!concept.keywords || concept.keywords.length === 0) {
      errors.push({
        type: 'empty_keywords',
        concept: conceptName,
        detail: 'Concept "' + conceptName + '" has no keywords defined',
      });
    }
    
    // Check each resource name
    for (const name of concept.resourceNames) {
      const nameLower = name.toLowerCase();
      
      // Check if resource exists
      if (!resourceNames.has(nameLower)) {
        errors.push({
          type: 'missing_resource',
          concept: conceptName,
          detail: 'Resource "' + name + '" referenced in concept "' + conceptName + '" does not exist in resources.json',
        });
      }
      
      // Track for duplicate detection
      if (!mentionedResources.has(nameLower)) {
        mentionedResources.set(nameLower, []);
      }
      mentionedResources.get(nameLower)!.push(conceptName);
    }
    
    // Check for empty categories
    if (!concept.categories || concept.categories.length === 0) {
      warnings.push('Concept "' + conceptName + '" has no categories defined');
    }
  }
  
  // Check for resources mentioned in multiple concepts (warning, not error)
  for (const [resourceName, concepts] of mentionedResources) {
    if (concepts.length > 3) {
      warnings.push(
        'Resource "' + resourceName + '" appears in ' + concepts.length + ' concepts: ' + concepts.join(', ') + '. Consider if all are appropriate.'
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run all validation checks
 * Throws an error if validation fails (for use in build scripts)
 */
export function validateSearchData(): void {
  const result = validateConceptMappings();
  
  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Search Data Validation Warnings:');
    result.warnings.forEach(w => console.warn('   - ' + w));
  }
  
  // Throw on errors
  if (!result.valid) {
    console.error('\n❌ Search Data Validation Failed:');
    result.errors.forEach(e => {
      console.error('   [' + e.type + '] ' + e.detail);
    });
    throw new Error('Search data validation failed with ' + result.errors.length + ' error(s)');
  }
  
  console.log('\n✅ Search data validation passed');
}

/**
 * Get a report of validation results without throwing
 */
export function getValidationReport(): string {
  const result = validateConceptMappings();
  const lines: string[] = [];
  
  lines.push('=== Search Data Validation Report ===\n');
  
  if (result.errors.length > 0) {
    lines.push('ERRORS:');
    result.errors.forEach(e => {
      lines.push('  ❌ [' + e.type + '] ' + e.detail);
    });
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach(w => {
      lines.push('  ⚠️  ' + w);
    });
    lines.push('');
  }
  
  if (result.valid && result.warnings.length === 0) {
    lines.push('✅ All checks passed - no issues found');
  } else if (result.valid) {
    lines.push('✅ Validation passed with warnings');
  } else {
    lines.push('❌ Validation failed with ' + result.errors.length + ' error(s)');
  }
  
  return lines.join('\n');
}
