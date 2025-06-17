export async function tbn2_func_create_plans_make_images_2({ 
  records, 
  qty, 
  aiModel, 
  generateZip, 
  wipeMeta, 
  throttle1,
  gridData
}: { 
  records: any[], 
  qty: number, 
  aiModel: string, 
  generateZip?: boolean, 
  wipeMeta?: boolean,
  throttle1?: { enabled: boolean, delayBetweenImages: number, delayBetweenPlans: number },
  gridData?: string[][]
}): Promise<any> {
  try {
    const response = await fetch('/api/tbn2_sfunc_create_plans_make_images_2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, qty, aiModel, generateZip, wipeMeta, throttle1, gridData }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}