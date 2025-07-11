import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { logger } from '@/lib/error-logger';

interface Tbn2ImageGenerationParams {
  prompt: string;
  userId: string;
  batchFolder: string;
  fileName: string;
  aiModel: string;
  wipeMeta?: boolean;
}

interface Tbn2ImageGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function tbn2_sfunc_create_image_with_openai({
  prompt,
  userId,
  batchFolder,
  fileName,
  aiModel,
  wipeMeta = true
}: Tbn2ImageGenerationParams): Promise<Tbn2ImageGenerationResult> {
  
  try {
    // Get user's API key from api_keys_t3 table using correct field names and approach
    const supabase = createRouteHandlerClient({ cookies });
    
    // Step 1: Get matching slot for the AI model
    const { data: slotData, error: slotError } = await supabase
      .from('api_key_slots')
      .select('slot_id, slot_name')
      .ilike('slot_name', aiModel)
      .single();
    
    if (slotError || !slotData) {
      await logger.error({
        category: 'tbn2_api_key_lookup',
        message: `No slot found for AI model: ${aiModel}`,
        details: {
          userId: userId,
          aiModel: aiModel,
          error: slotError?.message || 'No matching slot found'
        }
      });
      
      return {
        success: false,
        error: `AI model "${aiModel}" is not supported. Please use a supported AI model.`
      };
    }
    
    // Step 2: Get user's API key for this slot
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys_t3')
      .select('m1datum')
      .eq('fk_user_id', userId)
      .eq('fk_slot_id', slotData.slot_id)
      .single();
    
    if (apiKeyError || !apiKeyData || !apiKeyData.m1datum) {
      await logger.error({
        category: 'tbn2_api_key_lookup',
        message: `No API key configured for ${aiModel} (slot: ${slotData.slot_name})`,
        details: {
          userId: userId,
          aiModel: aiModel,
          slotId: slotData.slot_id,
          slotName: slotData.slot_name,
          error: apiKeyError?.message || 'No API key found',
          hasApiKeyData: !!apiKeyData,
          hasM1Datum: !!(apiKeyData?.m1datum)
        }
      });
      
      return {
        success: false,
        error: `${aiModel} API key not configured for this user. Please configure your ${aiModel} API key in settings.`
      };
    }
    
    const apiKey = apiKeyData.m1datum;
    
    await logger.info({
      category: 'tbn2_api_key_lookup',
      message: `Successfully retrieved API key for ${aiModel}`,
      details: {
        userId: userId,
        aiModel: aiModel,
        slotName: slotData.slot_name,
        hasApiKey: !!apiKey
      }
    });

    // Generate image with OpenAI DALL-E
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.substring(0, 1000), // Limit prompt length
        n: 1,
        size: '1024x1024',
        model: 'dall-e-3',
        quality: 'standard',
        response_format: 'url'
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      await logger.error({
        category: 'tbn2_openai_generation',
        message: 'OpenAI API request failed',
        details: {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorData,
          prompt: prompt.substring(0, 100) + '...'
        }
      });
      
      return {
        success: false,
        error: `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`
      };
    }

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.data || !openaiData.data[0] || !openaiData.data[0].url) {
      return {
        success: false,
        error: 'Invalid response from OpenAI API'
      };
    }

    const imageUrl = openaiData.data[0].url;

    // Download the image from OpenAI
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return {
        success: false,
        error: `Failed to download image from OpenAI: ${imageResponse.status}`
      };
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    let imageBuffer = Buffer.from(imageArrayBuffer);

    // Strip metadata if requested
    if (wipeMeta) {
      try {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        
        await logger.info({
          category: 'tbn2_metadata_removal',
          message: `Stripping metadata from generated image`,
          details: {
            originalFormat: metadata.format,
            hasMetadata: !!(metadata.exif || metadata.icc || metadata.iptc || metadata.xmp),
            fileSize: imageBuffer.length,
            fileName: fileName
          }
        });
        
        // Reprocess image to strip metadata
        if (metadata.format === 'jpeg') {
          imageBuffer = Buffer.from(await image.jpeg().toBuffer());
        } else if (metadata.format === 'png') {
          imageBuffer = Buffer.from(await image.png().toBuffer());
        } else if (metadata.format === 'webp') {
          imageBuffer = Buffer.from(await image.webp().toBuffer());
        } else {
          // Default processing
          imageBuffer = Buffer.from(await image.toBuffer());
        }
        
      } catch (metadataError) {
        await logger.error({
          category: 'tbn2_metadata_removal',
          message: 'Failed to strip metadata, using original image',
          details: {
            error: metadataError instanceof Error ? metadataError.message : String(metadataError),
            fileName: fileName
          }
        });
        // Continue with original buffer if metadata stripping fails
      }
    }

    // Upload to Supabase Storage
    const storagePath = `barge1/${batchFolder}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bucket-images-b1')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true, // Allow overwriting if file exists
      });

    if (uploadError) {
      await logger.error({
        category: 'tbn2_storage_upload',
        message: 'Failed to upload image to Supabase Storage',
        details: {
          error: uploadError.message,
          storagePath: storagePath,
          fileName: fileName,
          batchFolder: batchFolder,
          bufferSize: imageBuffer.length
        }
      });
      
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`
      };
    }

    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('bucket-images-b1')
      .getPublicUrl(storagePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return {
        success: false,
        error: 'Failed to get public URL for uploaded image'
      };
    }

    await logger.info({
      category: 'tbn2_image_generation',
      message: 'Successfully generated and uploaded image',
      details: {
        storagePath: storagePath,
        publicUrl: publicUrlData.publicUrl,
        fileName: fileName,
        prompt: prompt.substring(0, 100) + '...',
        wipeMeta: wipeMeta,
        finalFileSize: imageBuffer.length
      }
    });

    return {
      success: true,
      url: publicUrlData.publicUrl
    };

  } catch (error) {
    await logger.error({
      category: 'tbn2_image_generation',
      message: 'Unexpected error during image generation',
      details: {
        error: error instanceof Error ? error.message : String(error),
        prompt: prompt.substring(0, 100) + '...',
        fileName: fileName,
        batchFolder: batchFolder
      },
      stack_trace: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during image generation'
    };
  }
}