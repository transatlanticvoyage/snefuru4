export async function func_create_plans_from_xls_1(records: any[], gridData?: string[][]): Promise<any> {
  try {
    const response = await fetch('/api/sfunc_create_plans_from_xls_1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, gridData }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
} 