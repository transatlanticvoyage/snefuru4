import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface TestPluginOptions {
  siteId: string;
  siteUrl: string;
}

export async function cfunc_test_plugin(options: TestPluginOptions) {
  try {
    const supabase = createClientComponentClient();
    
    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('Authentication required for plugin test');
      return { success: false, message: 'Authentication required' };
    }

    // Call our server-side test API
    const response = await fetch('/api/sync/test-plugin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteId: options.siteId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
      console.error('Plugin test failed:', errorData.message);
      return { success: false, message: errorData.message };
    }

    const result = await response.json();
    
    // Show detailed results in console for debugging
    console.log('🔧 Plugin Test Results:', result);
    
    // Show user-friendly alert with results
    const { tests, recommendations } = result.results || { tests: {}, recommendations: [] };
    
    let alertMessage = `Plugin Test Results for ${options.siteUrl}:\n\n`;
    
    // Add test results
    if (tests.wordpress_rest_api?.available) {
      alertMessage += '✅ WordPress REST API: Working\n';
    } else {
      alertMessage += '❌ WordPress REST API: Failed\n';
    }
    
    if (tests.plugin_status_endpoint?.available) {
      alertMessage += '✅ Plugin Status Endpoint: Working\n';
    } else {
      alertMessage += '❌ Plugin Status Endpoint: Failed\n';
    }
    
    if (tests.plugin_posts_endpoint?.available) {
      alertMessage += '✅ Plugin Posts Endpoint: Working\n';
    } else {
      alertMessage += '❌ Plugin Posts Endpoint: Failed\n';
    }
    
    // Add recommendations
    if (recommendations && recommendations.length > 0) {
      alertMessage += '\nRecommendations:\n';
      recommendations.forEach((rec: string, index: number) => {
        alertMessage += `${index + 1}. ${rec}\n`;
      });
    }
    
    alert(alertMessage);
    
    return result;

  } catch (error) {
    console.error('Plugin test error:', error);
    const errorMessage = `Plugin test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    alert(errorMessage);
    return { success: false, message: errorMessage };
  }
} 