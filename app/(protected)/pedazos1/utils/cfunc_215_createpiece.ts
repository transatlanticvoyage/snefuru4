/**
 * cfunc_215_createpiece - Client function to create a new content piece
 * Creates a new row in the gcon_pieces table with associated user ID
 */

interface CreatePieceResult {
  success: boolean;
  data?: {
    id: string;
    message: string;
  };
  error?: string;
}

export async function cfunc_215_createpiece(authUserId: string): Promise<CreatePieceResult> {
  try {
    const response = await fetch('/api/func_215_createpiece', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_user_id: authUserId
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error ${response.status}`
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
        error: result.error || 'Unknown error occurred'
      };
    }

  } catch (error) {
    console.error('cfunc_215_createpiece error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}