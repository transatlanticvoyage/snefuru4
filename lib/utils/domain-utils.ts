/**
 * Utility functions for domain manipulation
 */

// Comprehensive list of known multi-part TLDs
const MULTI_PART_TLDS = [
  // UK
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'sch.uk', 'nhs.uk', 'mil.uk', 'nic.uk',
  // Australia
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au', 'info.au', 'conf.au', 'oz.au', 
  'act.au', 'nsw.au', 'nt.au', 'qld.au', 'sa.au', 'tas.au', 'vic.au', 'wa.au',
  // New Zealand
  'co.nz', 'net.nz', 'org.nz', 'ac.nz', 'govt.nz', 'school.nz', 'geek.nz', 'gen.nz', 'kiwi.nz', 'maori.nz',
  // South Africa
  'co.za', 'gov.za', 'ac.za', 'org.za', 'net.za', 'edu.za', 'nom.za', 'web.za',
  // India
  'co.in', 'gov.in', 'ac.in', 'edu.in', 'org.in', 'net.in', 'res.in', 'gen.in', 'firm.in', 'ind.in',
  // Japan
  'co.jp', 'ac.jp', 'or.jp', 'ne.jp', 'gr.jp', 'go.jp', 'ad.jp', 'ed.jp', 'lg.jp',
  // Brazil
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br', 'mil.br', 'art.br', 'blog.br', 'eco.br', 'esp.br',
  // China
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn', 'mil.cn',
  // Other countries
  'co.kr', 'co.th', 'co.id', 'com.mx', 'com.tw', 'com.ar', 'com.sg', 
  'net.mx', 'net.tw', 'net.ar', 'org.mx', 'org.tw', 'edu.mx', 'edu.sg', 'edu.tw',
  'gov.sg', 'gov.br', 'gov.mx', 'gov.tw'
];

/**
 * Extracts the root domain from a full domain name
 * @param fullDomain - The full domain (e.g., 'www.example.com', 'subdomain.test.co.uk')
 * @returns The root domain (e.g., 'example.com', 'test.co.uk')
 */
export function extractRootDomain(fullDomain: string | null | undefined): string | null {
  if (!fullDomain) return null;
  
  // Convert to lowercase and trim
  fullDomain = fullDomain.toLowerCase().trim();
  
  // Remove protocol if present (just in case)
  fullDomain = fullDomain.replace(/^https?:\/\//, '');
  
  // Remove path if present
  fullDomain = fullDomain.split('/')[0];
  
  // Remove port if present
  fullDomain = fullDomain.split(':')[0];
  
  // Split by dots
  const parts = fullDomain.split('.');
  
  // Handle invalid domains
  if (parts.length < 2) return fullDomain;
  
  // Check for multi-part TLDs
  if (parts.length >= 3) {
    const possibleTld = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (MULTI_PART_TLDS.includes(possibleTld)) {
      // Return domain with multi-part TLD
      return `${parts[parts.length - 3]}.${possibleTld}`;
    }
  }
  
  // Standard TLD, return last two parts
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

/**
 * Checks if two domains have the same root domain
 * @param domain1 - First domain to compare
 * @param domain2 - Second domain to compare
 * @returns True if both domains have the same root domain
 */
export function haveSameRootDomain(domain1: string, domain2: string): boolean {
  const root1 = extractRootDomain(domain1);
  const root2 = extractRootDomain(domain2);
  return root1 === root2 && root1 !== null;
}

/**
 * Gets the subdomain from a full domain
 * @param fullDomain - The full domain
 * @returns The subdomain part or null if none
 */
export function getSubdomain(fullDomain: string): string | null {
  const rootDomain = extractRootDomain(fullDomain);
  if (!rootDomain || fullDomain === rootDomain) return null;
  
  const subdomainPart = fullDomain.substring(0, fullDomain.lastIndexOf(rootDomain) - 1);
  return subdomainPart || null;
}