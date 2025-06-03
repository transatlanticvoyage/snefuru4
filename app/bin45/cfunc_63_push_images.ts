export async function cfunc_63_push_images(batchId: string, pushMethod: string) {
  try {
    if (!batchId || !pushMethod) {
      throw new Error('Batch ID and push method are required');
    }

    // Validate push method
    if (pushMethod !== 'wp_login' && pushMethod !== 'wp_plugin') {
      throw new Error('Invalid push method. Must be "wp_login" or "wp_plugin"');
    }

    const response = await fetch('/api/bin45/sfunc_63_push_images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batch_id: batchId,
        push_method: pushMethod
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to push images');
    }

    return {
      success: true,
      message: data.message,
      pushId: data.push_id,
      results: data.results
    };

  } catch (error) {
    console.error('Error in cfunc_63_push_images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 