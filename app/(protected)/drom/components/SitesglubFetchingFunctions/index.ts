import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export interface SitesglubFetchResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Base function to fetch or update sitesglub metrics for a domain
 */
export class SitesglubFetcher {
  /**
   * Fetch ns_full (nameserver) data for a domain
   */
  static async fetchNsFull(domain: string): Promise<SitesglubFetchResult> {
    try {
      console.log(`Fetching ns_full for domain: ${domain}`);
      
      // Real DNS lookup using DNS over HTTPS (DoH) service
      let nsData = '';
      
      try {
        console.log(`[DEBUG] Starting DNS lookup for: ${domain}`);
        // Use Cloudflare's DNS over HTTPS service
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`, {
          method: 'GET',
          headers: {
            'Accept': 'application/dns-json'
          }
        });
        
        console.log(`[DEBUG] DNS response status: ${response.status}`);
        
        if (response.ok) {
          const dnsResult = await response.json();
          console.log(`[DEBUG] DNS result:`, dnsResult);
          
          if (dnsResult.Answer && dnsResult.Answer.length > 0) {
            // Extract nameservers from the response
            const nameservers = dnsResult.Answer
              .filter((record: any) => record.type === 2) // NS records have type 2
              .map((record: any) => record.data.replace(/\.$/, '')) // Remove trailing dot
              .join(', ');
            
            console.log(`[DEBUG] Extracted nameservers: ${nameservers}`);
            nsData = nameservers;
          } else {
            console.warn(`No NS records found for domain: ${domain}`);
            console.log(`[DEBUG] dnsResult.Answer:`, dnsResult.Answer);
            nsData = 'No nameservers found';
          }
        } else {
          console.warn(`DNS lookup failed for ${domain}, status: ${response.status}`);
          nsData = 'DNS lookup failed';
        }
      } catch (dnsError) {
        console.error('DNS lookup error:', dnsError);
        // Fallback to a more generic error message
        nsData = 'DNS lookup unavailable';
      }
      
      // Insert or update the sitesglub record
      const { data, error } = await supabase
        .from('sitesglub')
        .upsert({
          sitesglub_base: domain,
          ns_full: nsData,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'sitesglub_base',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating sitesglub ns_full:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.ns_full };
    } catch (error) {
      console.error('Error in fetchNsFull:', error);
      return { success: false, error: 'Failed to fetch nameserver data' };
    }
  }

  /**
   * Fetch ip_address data for a domain
   */
  static async fetchIpAddress(domain: string): Promise<SitesglubFetchResult> {
    try {
      console.log(`Fetching ip_address for domain: ${domain}`);
      
      // Real DNS lookup using DNS over HTTPS (DoH) service
      let ipData = '';
      
      try {
        // Use Cloudflare's DNS over HTTPS service for A records
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
          method: 'GET',
          headers: {
            'Accept': 'application/dns-json'
          }
        });
        
        if (response.ok) {
          const dnsResult = await response.json();
          
          if (dnsResult.Answer && dnsResult.Answer.length > 0) {
            // Extract IP addresses from the response
            const ipAddresses = dnsResult.Answer
              .filter((record: any) => record.type === 1) // A records have type 1
              .map((record: any) => record.data)
              .join(', ');
            
            ipData = ipAddresses;
          } else {
            console.warn(`No A records found for domain: ${domain}`);
            ipData = 'No IP address found';
          }
        } else {
          console.warn(`DNS lookup failed for ${domain}, status: ${response.status}`);
          ipData = 'DNS lookup failed';
        }
      } catch (dnsError) {
        console.error('DNS lookup error:', dnsError);
        // Fallback to a more generic error message
        ipData = 'DNS lookup unavailable';
      }
      
      // Insert or update the sitesglub record
      const { data, error } = await supabase
        .from('sitesglub')
        .upsert({
          sitesglub_base: domain,
          ip_address: ipData,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'sitesglub_base',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating sitesglub ip_address:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.ip_address };
    } catch (error) {
      console.error('Error in fetchIpAddress:', error);
      return { success: false, error: 'Failed to fetch IP address data' };
    }
  }

  /**
   * Generic function to fetch any sitesglub metric
   * This can be extended for future metrics (mj_tf, mj_cf, etc.)
   */
  static async fetchMetric(domain: string, metric: string): Promise<SitesglubFetchResult> {
    switch (metric) {
      case 'ns_full':
        return this.fetchNsFull(domain);
      case 'ip_address':
        return this.fetchIpAddress(domain);
      default:
        return { success: false, error: `Unknown metric: ${metric}` };
    }
  }
}