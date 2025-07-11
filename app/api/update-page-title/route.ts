import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filePath, newTitle, xpageId } = await request.json();

    if (!filePath || !newTitle || !xpageId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }

    // Convert relative path to absolute path
    const absolutePath = path.join(process.cwd(), filePath);

    // Read the current file content
    let fileContent;
    try {
      fileContent = await fs.readFile(absolutePath, 'utf8');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: `File not found: ${filePath}` 
      });
    }

    // For testing, we'll look for specific patterns to replace
    let updatedContent = fileContent;
    let replaced = false;

    // Pattern 1: Look for existing document.title assignments
    const titlePatterns = [
      /document\.title\s*=\s*['"`][^'"`]*['"`];?/g,
      /document\.title\s*=\s*staticMetadata\?\.\w+\s*\|\|\s*['"`][^'"`]*['"`];?/g,
    ];

    for (const pattern of titlePatterns) {
      if (pattern.test(fileContent)) {
        updatedContent = fileContent.replace(pattern, `document.title = '${newTitle}';`);
        replaced = true;
        break;
      }
    }

    // Pattern 2: If no direct assignment found, look for useEffect with title setting
    if (!replaced) {
      const useEffectPattern = /useEffect\(\(\) => \{[\s\S]*?document\.title[\s\S]*?\}, \[\]\);/;
      if (useEffectPattern.test(fileContent)) {
        updatedContent = fileContent.replace(useEffectPattern, 
          `useEffect(() => {\n    document.title = '${newTitle}';\n  }, []);`
        );
        replaced = true;
      }
    }

    // Pattern 3: Remove any dynamic cache imports and XPAGE_ID references
    if (replaced) {
      // Remove xpage cache import
      updatedContent = updatedContent.replace(
        /import\s+xpageCache\s+from\s+['"`][@/]*app\/metadata\/xpage-cache\.json['"`];?\n?/g,
        ''
      );

      // Remove XPAGE_ID constant and staticMetadata logic
      updatedContent = updatedContent.replace(
        /const\s+XPAGE_ID\s*=\s*\d+;\s*\n?\s*const\s+staticMetadata\s*=\s*\([^)]+\)\[[^\]]+\];?\s*\n?/g,
        ''
      );

      // Clean up any remaining cache-related logic
      updatedContent = updatedContent.replace(
        /\/\/\s*Set\s+document\s+title[\s\S]*?setTitle\([^)]+\);\s*\n?/g,
        ''
      );
    }

    if (!replaced) {
      return NextResponse.json({ 
        success: false, 
        error: `No title pattern found in ${filePath}` 
      });
    }

    // Write the updated content back to the file
    try {
      await fs.writeFile(absolutePath, updatedContent, 'utf8');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to write file: ${error}` 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${filePath} with title: ${newTitle}`,
      xpageId 
    });

  } catch (error) {
    console.error('Error updating page title:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}