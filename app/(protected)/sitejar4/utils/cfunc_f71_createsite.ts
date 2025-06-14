/**
 * cfunc_f71_createsite - Client function to create multiple sites
 * Processes a list of URLs and creates records in the sitespren table
 */

interface CreateSitesResult {
  success: boolean;
  data?: {
    sitesCreated: number;
    sitesRequested: number;
    invalidUrls: number;
    message: string;
  };
  error?: string;
  details?: string;
}

export async function cfunc_f71_createsite(
  userInternalId: string, 
  sitesList: string
): Promise<CreateSitesResult> {
  try {
    const response = await fetch('/api/f71_createsite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_internal_id: userInternalId,
        sites_list: sitesList
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error ${response.status}`,
        details: result.details
      };
    }

    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown error occurred',
        details: result.details
      };
    }

  } catch (error) {
    console.error('cfunc_f71_createsite error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}