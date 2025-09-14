export async function tbn2_func_create_plans_from_xls_2(records: any[], gridData?: string[][], batchId?: string): Promise<any> {
  try {
    const response = await fetch('/api/tbn2_sfunc_create_plans_from_xls_2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, gridData, batchId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}