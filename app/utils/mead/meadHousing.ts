// Housing strategy implementations for Mead function
import { IMeadConfig, IMeadOperationResult } from './meadTypes';
import { MEAD_HOUSING_STRATEGIES, MEAD_CAULDRON_VAT_PATH } from './meadConstants';
import { createMeadFolder, createMeadFile } from './meadFileOperations';

export async function executeMeadHousing(config: IMeadConfig): Promise<IMeadOperationResult> {
  // Determine the base path based on housing strategy
  let targetPath = '';
  
  switch (config.housingStrategy) {
    case MEAD_HOUSING_STRATEGIES.END_SELECTED:
      targetPath = config.currentPath;
      break;
      
    case MEAD_HOUSING_STRATEGIES.CAULDRON_VAT:
      targetPath = MEAD_CAULDRON_VAT_PATH;
      break;
      
    case MEAD_HOUSING_STRATEGIES.SELECTED_COLUMN:
      if (!config.selectedColumnPath) {
        return {
          success: false,
          error: 'No column selected. Please select a column first.'
        };
      }
      targetPath = config.selectedColumnPath;
      break;
      
    case MEAD_HOUSING_STRATEGIES.SELECTED_COLUMN_ACTIVE:
      if (!config.selectedColumnActiveFolder) {
        return {
          success: false,
          error: 'No active folder in selected column. Please select a column with an active folder.'
        };
      }
      targetPath = config.selectedColumnActiveFolder;
      break;
      
    default:
      return {
        success: false,
        error: 'Invalid housing strategy'
      };
  }
  
  // Execute the action
  if (config.action === 'create new folder') {
    return await createMeadFolder(targetPath, config.filename);
  } else if (config.action === '+ new file') {
    return await createMeadFile(targetPath, config.filename, config.fileType);
  } else if (config.action === '+open') {
    // Open functionality would go here
    // For now, just return the path that would be opened
    return {
      success: true,
      path: targetPath
    };
  }
  
  return {
    success: false,
    error: 'Invalid action'
  };
}