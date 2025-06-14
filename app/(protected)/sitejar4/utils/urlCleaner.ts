/**
 * Utility functions for cleaning and processing URLs
 */

/**
 * Clean a single URL according to the requirements:
 * - Remove https:// and http:// prefixes
 * - Remove www. subdomain
 * - Trim whitespace
 */
export function cleanUrl(url: string): string {
  if (!url) return '';
  
  // Trim whitespace
  let cleaned = url.trim();
  
  // Remove http:// or https:// from the beginning
  cleaned = cleaned.replace(/^https?:\/\//, '');
  
  // Remove www. subdomain (only if it's at the beginning after protocol removal)
  cleaned = cleaned.replace(/^www\./, '');
  
  return cleaned;
}

/**
 * Process a multi-line string of URLs
 * Returns an array of cleaned URLs, excluding empty lines
 */
export function processUrlList(urlList: string): string[] {
  return urlList
    .split('\n')
    .map(line => cleanUrl(line))
    .filter(url => url.length > 0); // Remove empty lines
}

/**
 * Validate if a cleaned URL looks valid
 * (basic validation - just checks for basic structure)
 */
export function isValidCleanedUrl(url: string): boolean {
  if (!url || url.length === 0) return false;
  
  // Check for at least one dot (domain.tld)
  if (!url.includes('.')) return false;
  
  // Check for invalid characters
  const invalidChars = /[<>"\s]/;
  if (invalidChars.test(url)) return false;
  
  return true;
}

/**
 * Extract domain parts from a cleaned URL
 * This is a placeholder for future functionality
 */
export function extractDomainParts(cleanedUrl: string): {
  true_root_domain?: string;
  full_subdomain?: string;
  webproperty_type?: string;
} {
  // This is a simplified implementation
  // In a real scenario, you might want to use a proper URL parsing library
  
  const parts = cleanedUrl.split('/');
  const domainPart = parts[0];
  
  // Check if it's a social media property
  const socialPlatforms = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com'];
  const isSocial = socialPlatforms.some(platform => domainPart.includes(platform));
  
  return {
    webproperty_type: isSocial ? 'social' : 'website'
  };
}