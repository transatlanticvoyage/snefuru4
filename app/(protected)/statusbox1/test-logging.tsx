"use client";
import { useState } from 'react';
import { logger } from '@/lib/error-logger';

export default function TestLogging() {
  const [testing, setTesting] = useState(false);

  const seedSampleLogs = async () => {
    setTesting(true);
    
    try {
      // Log various types of errors
      await logger.error({
        category: 'image_generation',
        message: 'Failed to generate image: OpenAI API rate limit exceeded',
        details: {
          prompt: 'A beautiful sunset over mountains',
          model: 'dall-e-3',
          errorCode: 'rate_limit_exceeded',
          retryAfter: 60
        },
        plan_id: 'plan_123456',
        batch_id: 'batch_789012'
      });

      await logger.error({
        category: 'background_processor',
        message: 'Background job failed: Network timeout',
        details: {
          timeout: 30000,
          endpoint: '/api/generate-image',
          attempts: 3
        },
        job_id: 'job_456789',
        stack_trace: `Error: Network timeout
    at fetch (/app/lib/api.js:45:12)
    at processJob (/app/api/background-jobs/process.js:123:8)
    at async runJobQueue (/app/api/background-jobs/process.js:89:5)`
      });

      await logger.warning({
        category: 'database',
        message: 'Slow database query detected',
        details: {
          query: 'SELECT * FROM images_plans WHERE rel_users_id = ?',
          duration: 2500,
          threshold: 1000
        }
      });

      await logger.warning({
        category: 'image_generation',
        message: 'Image quality may be reduced due to prompt complexity',
        details: {
          promptLength: 500,
          maxRecommended: 300,
          model: 'dall-e-2'
        },
        plan_id: 'plan_234567'
      });

      await logger.info({
        category: 'background_processor',
        message: 'Background job queue processing started',
        details: {
          queueLength: 15,
          maxConcurrent: 3,
          estimatedTime: '5 minutes'
        }
      });

      await logger.info({
        category: 'user_action',
        message: 'User initiated batch image generation',
        details: {
          batchSize: 10,
          imageQty: 4,
          model: 'openai'
        },
        batch_id: 'batch_345678'
      });

      await logger.debug({
        category: 'performance',
        message: 'Image generation completed',
        details: {
          duration: 1250,
          imageSize: '1024x1024',
          format: 'png'
        },
        plan_id: 'plan_345678'
      });

      await logger.error({
        category: 'api_error',
        message: 'Supabase connection failed',
        details: {
          operation: 'insert',
          table: 'images',
          error: 'Connection timeout after 10000ms'
        },
        stack_trace: `SupabaseError: Connection timeout
    at createClient (/node_modules/@supabase/supabase-js/dist/index.js:234:15)
    at /app/api/database/insert.js:12:8`
      });

      await logger.warning({
        category: 'system',
        message: 'High memory usage detected',
        details: {
          memoryUsage: '85%',
          threshold: '80%',
          action: 'garbage collection triggered'
        }
      });

      await logger.debug({
        category: 'background_processor',
        message: 'Job retry scheduled',
        details: {
          jobId: 'job_789012',
          attempt: 2,
          nextRetry: new Date(Date.now() + 60000).toISOString(),
          backoffMs: 60000
        },
        job_id: 'job_789012'
      });

      alert('Sample error logs created successfully! Check the StatusBox1 page to see them.');
    } catch (error) {
      alert('Failed to create sample logs: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">Test Logging System</h3>
      <p className="text-sm text-yellow-700 mb-4">
        Click the button below to generate sample error logs for testing the error logging system.
        This will create various types of logs (errors, warnings, info, debug) with different categories.
      </p>
      <button
        onClick={seedSampleLogs}
        disabled={testing}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          testing
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        {testing ? 'Creating Sample Logs...' : '🧪 Generate Sample Error Logs'}
      </button>
    </div>
  );
} 