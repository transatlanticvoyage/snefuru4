// MeadCraterNumber calculation logic
import { IMeadCraterResult } from './meadTypes';

export async function calculateMeadCraterNumber(
  currentPath: string, 
  increment: number
): Promise<IMeadCraterResult> {
  try {
    const response = await fetch(`/api/filegun/list?path=${encodeURIComponent(currentPath)}`);
    const data = await response.json();
    
    let highestNumber = 0;
    
    if (data.success && data.data && data.data.items) {
      // Filter for folders only and those that begin with numbers
      const numberedFolders = data.data.items
        .filter((item: any) => item.type === 'folder')
        .map((folder: any) => {
          const match = folder.name.match(/^(\d+)/); // Extract leading number
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((num: number | null) => num !== null) as number[];

      // Find the highest number
      highestNumber = numberedFolders.length > 0 ? Math.max(...numberedFolders) : 0;
    }
    
    return {
      craterNumber: highestNumber + increment,
      highestExisting: highestNumber,
      increment: increment
    };
  } catch (error) {
    console.error('Error calculating MeadCraterNumber:', error);
    return {
      craterNumber: increment, // Fallback to just increment if error
      highestExisting: 0,
      increment: increment
    };
  }
}