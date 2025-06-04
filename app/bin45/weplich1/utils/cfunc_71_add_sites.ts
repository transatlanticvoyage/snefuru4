export async function func_71_add_sites(sites: string[]) {
  try {
    const response = await fetch('/api/bin45/weplich1/sfunc_71_add_sites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sites }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error in func_71_add_sites:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 