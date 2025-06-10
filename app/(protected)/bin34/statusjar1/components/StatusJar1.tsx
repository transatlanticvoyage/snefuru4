"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface TaskStatus {
  id: string;
  batch_id: string;
  total_plans: number;
  completed_plans: number;
  total_images: number;
  completed_images: number;
  qty_images_per_plan: number;
  status: 'running' | 'completed' | 'failed';
  created_at: string;
  error?: string;
}

export default function StatusJar1() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'errors' | 'background'>('status');
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [retryingBatches, setRetryingBatches] = useState<Set<string>>(new Set());
  const [backgroundSettings, setBackgroundSettings] = useState({
    enabled: false,
    delayBetweenImages: 2000, // milliseconds
    delayBetweenPlans: 1000,
    maxConcurrentJobs: 1,
    retryAttempts: 3,
    autoRetry: true
  });
  const [backgroundStatus, setBackgroundStatus] = useState({
    isRunning: false,
    queueLength: 0,
    currentJob: null,
    completedJobs: 0,
    failedJobs: 0
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [endingProcess, setEndingProcess] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [processingAllJobs, setProcessingAllJobs] = useState(false);
  const [processAllProgress, setProcessAllProgress] = useState({ current: 0, total: 0 });
  const supabase = createClientComponentClient();

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/background-jobs/load-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            setBackgroundSettings(data.settings);
          }
        } else {
          // If loading fails, just use default settings
          console.warn('Failed to load settings, using defaults');
        }
      } catch (err) {
        console.warn('Failed to load settings, using defaults:', err);
      }
    };

    if (user?.id) {
      loadSettings();
    }
  }, [user]);

  // Fetch tasks and their status
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.id) return;
      
      try {
        // Get user's DB id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (userError) throw userError;

        // Fetch all batches for this user
        const { data: batches, error: batchesError } = await supabase
          .from('images_plans_batches')
          .select('id, created_at')
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false });

        if (batchesError) throw batchesError;

        // Fetch background job status (always check, not just when enabled)
        const statusResponse = await fetch('/api/background-jobs/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setBackgroundStatus(statusData.status);
          }
        }

        // Fetch error logs - get recent failed images
        const { data: failedImages, error: failedImagesError } = await supabase
          .from('images')
          .select(`
            id,
            created_at,
            status,
            prompt1,
            function_used_to_fetch_the_image,
            rel_images_plans_id,
            images_plans!inner(rel_images_plans_batches_id)
          `)
          .eq('rel_users_id', userData.id)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!failedImagesError && failedImages) {
          setErrorLogs(failedImages);
        }

        // Also check for incomplete plans (missing expected images)
        const { data: allPlans, error: allPlansError } = await supabase
          .from('images_plans')
          .select(`
            id,
            created_at,
            fk_image1_id,
            fk_image2_id,
            fk_image3_id,
            fk_image4_id,
            rel_images_plans_batches_id,
            e_prompt1,
            e_file_name1
          `)
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!allPlansError && allPlans) {
          // Find plans with missing images and add them to error logs
          const incompletePlans = allPlans.filter(plan => {
            const imageCount = [plan.fk_image1_id, plan.fk_image2_id, plan.fk_image3_id, plan.fk_image4_id].filter(Boolean).length;
            // If any image slot is missing, it's incomplete
            return imageCount === 0 || (plan.fk_image1_id && !plan.fk_image2_id) || (plan.fk_image2_id && !plan.fk_image3_id) || (plan.fk_image3_id && !plan.fk_image4_id);
          });

          const planErrors = incompletePlans.map(plan => ({
            id: `plan-${plan.id}`,
            created_at: plan.created_at,
            status: 'incomplete_plan',
            prompt1: plan.e_prompt1 || 'No prompt',
            function_used_to_fetch_the_image: 'plan_processing',
            rel_images_plans_id: plan.id,
            images_plans: { rel_images_plans_batches_id: plan.rel_images_plans_batches_id },
            missing_images: [plan.fk_image1_id, plan.fk_image2_id, plan.fk_image3_id, plan.fk_image4_id].map((img, idx) => img ? null : `image${idx + 1}`).filter(Boolean)
          }));

          setErrorLogs(prev => [...(failedImages || []), ...planErrors]);
        }

        // For each batch, get the task status
        const taskStatuses: TaskStatus[] = await Promise.all(
          batches.map(async (batch) => {
            // Get total plans in this batch
            const { count: totalPlans } = await supabase
              .from('images_plans')
              .select('id', { count: 'exact', head: true })
              .eq('rel_images_plans_batches_id', batch.id);

            // Get completed plans (those with all required images)
            const { data: plans, error: plansError } = await supabase
              .from('images_plans')
              .select('fk_image1_id, fk_image2_id, fk_image3_id, fk_image4_id')
              .eq('rel_images_plans_batches_id', batch.id);

            if (plansError) throw plansError;

            // Count completed images
            const completedImages = plans.reduce((acc, plan) => {
              return acc + [
                plan.fk_image1_id,
                plan.fk_image2_id,
                plan.fk_image3_id,
                plan.fk_image4_id
              ].filter(Boolean).length;
            }, 0);

            // Calculate the intended qty per plan by looking at the highest number of images in any plan
            let qtyImagesPerPlan = 1;
            if (plans.length > 0) {
              qtyImagesPerPlan = Math.max(...plans.map(plan => {
                return [
                  plan.fk_image1_id,
                  plan.fk_image2_id,
                  plan.fk_image3_id,
                  plan.fk_image4_id
                ].filter(Boolean).length;
              }));
              // If no images exist yet, try to infer from the first plan that has any image slots filled
              if (qtyImagesPerPlan === 0) {
                for (const plan of plans) {
                  const imageSlots = [
                    plan.fk_image1_id !== null,
                    plan.fk_image2_id !== null,
                    plan.fk_image3_id !== null,
                    plan.fk_image4_id !== null
                  ];
                  const lastFilledIndex = imageSlots.lastIndexOf(true);
                  if (lastFilledIndex >= 0) {
                    qtyImagesPerPlan = Math.max(qtyImagesPerPlan, lastFilledIndex + 1);
                  }
                }
                // If still 0, default to 4 as a reasonable assumption
                if (qtyImagesPerPlan === 0) qtyImagesPerPlan = 4;
              }
            }

            // Calculate completion status
            const completedPlans = plans.filter(plan => {
              const imageCount = [
                plan.fk_image1_id,
                plan.fk_image2_id,
                plan.fk_image3_id,
                plan.fk_image4_id
              ].filter(Boolean).length;
              return imageCount >= qtyImagesPerPlan;
            }).length;

            return {
              id: batch.id,
              batch_id: batch.id,
              total_plans: totalPlans || 0,
              completed_plans: completedPlans,
              total_images: (totalPlans || 0) * qtyImagesPerPlan,
              completed_images: completedImages,
              qty_images_per_plan: qtyImagesPerPlan,
              status: completedPlans === totalPlans ? 'completed' : 'running',
              created_at: batch.created_at
            };
          })
        );

        setTasks(taskStatuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    // Set up polling every 5 seconds
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  // Function to retry failed images
  const retryFailedImages = async (batchId: string) => {
    try {
      setError(null); // Clear any previous errors
      setRetryingBatches(prev => new Set([...prev, batchId])); // Mark batch as retrying
      
      // Get all plans in the batch
      const { data: plans, error: plansError } = await supabase
        .from('images_plans')
        .select('*')
        .eq('rel_images_plans_batches_id', batchId);

      if (plansError) throw plansError;

      let totalMissingImages = 0;
      let retriedPlans = 0;

      // For each plan, check if any images are missing
      for (const plan of plans) {
        const missingImages = [];
        if (!plan.fk_image1_id) missingImages.push(1);
        if (!plan.fk_image2_id) missingImages.push(2);
        if (!plan.fk_image3_id) missingImages.push(3);
        if (!plan.fk_image4_id) missingImages.push(4);

        if (missingImages.length > 0) {
          totalMissingImages += missingImages.length;
          retriedPlans++;
          
          // Call the API route directly instead of importing the client function
          const response = await fetch('/api/sfunc_create_plans_make_images_1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              records: [plan], 
              qty: missingImages.length, 
              aiModel: 'openai',
              generateZip: false,
              wipeMeta: false
            }),
          });
          
          const result = await response.json();
          if (!result.success) {
            console.error(`Failed to retry images for plan ${plan.id}:`, result.message);
          }

          // Add a small delay between plans to avoid overwhelming the API
          if (retriedPlans < plans.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      setError(`Retry completed for batch ${batchId}. Attempted to regenerate ${totalMissingImages} images across ${retriedPlans} plans. Check the status for updates.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry images');
    } finally {
      setRetryingBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(batchId);
        return newSet;
      });
    }
  };

  // Function to queue missing images for background processing
  const queueMissingImages = async (batchId: string) => {
    try {
      // Get all plans in the batch
      const { data: plans, error: plansError } = await supabase
        .from('images_plans')
        .select('*')
        .eq('rel_images_plans_batches_id', batchId);

      if (plansError) throw plansError;

      // Determine the intended qty per plan by looking at the highest number of images in any plan
      let qtyImagesPerPlan = 1;
      if (plans.length > 0) {
        qtyImagesPerPlan = Math.max(...plans.map(plan => {
          return [
            plan.fk_image1_id,
            plan.fk_image2_id,
            plan.fk_image3_id,
            plan.fk_image4_id
          ].filter(Boolean).length;
        }));
        
        // If no images exist yet, try to infer from the first plan that has any image slots filled
        if (qtyImagesPerPlan === 0) {
          for (const plan of plans) {
            const imageSlots = [
              plan.fk_image1_id !== null,
              plan.fk_image2_id !== null,
              plan.fk_image3_id !== null,
              plan.fk_image4_id !== null
            ];
            const lastFilledIndex = imageSlots.lastIndexOf(true);
            if (lastFilledIndex >= 0) {
              qtyImagesPerPlan = Math.max(qtyImagesPerPlan, lastFilledIndex + 1);
            }
          }
          // If still 0, default to 4 as a reasonable assumption
          if (qtyImagesPerPlan === 0) qtyImagesPerPlan = 4;
        }
      }

      // Get batch details for folder structure
      const { data: batchRow } = await supabase
        .from('images_plans_batches')
        .select('created_at')
        .eq('id', batchId)
        .single();

      let batchDate = 'unknown_date';
      let batchSeq = 1;
      if (batchRow && batchRow.created_at) {
        const dateObj = new Date(batchRow.created_at);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        batchDate = `${yyyy}_${mm}_${dd}`;
        
        // Get user's DB id for counting batches
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user?.id)
          .single();
          
        if (userData) {
          const { count } = await supabase
            .from('images_plans_batches')
            .select('id', { count: 'exact', head: true })
            .eq('rel_users_id', userData.id)
            .gte('created_at', `${yyyy}-${mm}-${dd}T00:00:00.000Z`)
            .lte('created_at', `${yyyy}-${mm}-${dd}T23:59:59.999Z`);
          batchSeq = (count || 1);
        }
      }
      const batchFolder = `${batchDate} - ${batchSeq}`;

      let jobsQueued = 0;
      let duplicateJobs = 0;
      let incompleteParPlans = 0;
      let totalMissingImages = 0;
      
      // For each plan, queue missing images only up to the intended qty
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];
        const seq = i + 1;
        let baseFileName = plan.e_file_name1 && typeof plan.e_file_name1 === 'string' && plan.e_file_name1.trim() ? plan.e_file_name1.trim() : `image_${seq}.png`;
        baseFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const planFolder = `${seq} - ${baseFileName}`;
        
        // Calculate how many images this plan currently has
        const currentImageCount = [
          plan.fk_image1_id,
          plan.fk_image2_id,
          plan.fk_image3_id,
          plan.fk_image4_id
        ].filter(Boolean).length;
        
        // Only process plans that are incomplete
        if (currentImageCount < qtyImagesPerPlan) {
          incompleteParPlans++;
          
          // Find missing slots up to the intended qty
          const missingSlots = [];
          for (let slot = 1; slot <= qtyImagesPerPlan; slot++) {
            const imageFieldName = `fk_image${slot}_id`;
            if (!plan[imageFieldName]) {
              missingSlots.push(slot);
            }
          }

          totalMissingImages += missingSlots.length;

          for (const slot of missingSlots) {
            let imageFileName = baseFileName;
            if (slot > 1) {
              const extIdx = baseFileName.lastIndexOf('.');
              if (extIdx > 0) {
                imageFileName = baseFileName.slice(0, extIdx) + `-${slot}` + baseFileName.slice(extIdx);
              } else {
                imageFileName = baseFileName + `-${slot}`;
              }
            }

            // Queue the job
            const response = await fetch('/api/background-jobs/add-job', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jobType: 'generate_image',
                data: {
                  plan,
                  imageSlot: slot,
                  batchFolder: `${batchFolder}/${planFolder}`,
                  fileName: imageFileName
                },
                priority: 5 - slot // Higher priority for earlier image slots
              })
            });

            const result = await response.json();
            if (result.success) {
              jobsQueued++;
            } else if (result.isDuplicate) {
              duplicateJobs++;
            } else {
              console.error('Failed to queue job:', result.message);
            }
          }
        }
      }

      let message = `Queuing complete for batch ${batchId}: `;
      message += `${jobsQueued} new jobs queued`;
      if (duplicateJobs > 0) {
        message += `, ${duplicateJobs} jobs already existed`;
      }
      message += ` (${incompleteParPlans} incomplete plans, ${totalMissingImages} missing images total, ${qtyImagesPerPlan} images per plan intended)`;
      
      setError(message);
      
      // Refresh background status to show updated queue length
      const statusResponse = await fetch('/api/background-jobs/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.success) {
          setBackgroundStatus(statusData.status);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue missing images');
    }
  };

  // Function to start background processing
  const startBackgroundProcessing = async () => {
    try {
      const response = await fetch('/api/background-jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: backgroundSettings })
      });

      const result = await response.json();
      if (result.success) {
        setError(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start background processing');
    }
  };

  // Function to clear completed and failed jobs
  const clearCompletedJobs = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user?.id)
        .single();
        
      if (userData) {
        await supabase
          .from('background_jobs')
          .delete()
          .eq('user_id', userData.id)
          .in('status', ['completed', 'failed']);
        
        setError('Cleared completed and failed jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear jobs');
    }
  };

  // Function to clear all pending jobs
  const clearPendingJobs = async () => {
    try {
      const response = await fetch('/api/background-jobs/clear-pending', {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setError(result.message);
      } else {
        setError(result.message || 'Failed to clear pending jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear pending jobs');
    }
  };

  // Function to save settings
  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      setError(null);
      
      const response = await fetch('/api/background-jobs/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: backgroundSettings })
      });

      const result = await response.json();
      if (result.success) {
        setError('Settings saved successfully!');
      } else {
        if (result.message.includes('column') || result.message.includes('does not exist')) {
          setError('Database column missing. Please add "background_processing_settings" JSONB column to users table in Supabase dashboard.');
        } else {
          setError(result.message || 'Failed to save settings');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Function to end a process
  const endProcess = async (batchId: string) => {
    try {
      setEndingProcess(batchId);
      setError(null);
      
      const response = await fetch('/api/background-jobs/end-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });

      const result = await response.json();
      if (result.success) {
        setError(`Process ended for batch ${batchId}`);
        // Refresh tasks to show updated status
        // The useEffect will automatically refresh the data
      } else {
        setError(result.message || 'Failed to end process');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end process');
    } finally {
      setEndingProcess(null);
      setShowConfirmDialog(null);
    }
  };

  // Function to show confirmation dialog
  const handleEndProcessClick = (batchId: string) => {
    setShowConfirmDialog(batchId);
  };

  // Function to handle confirmation
  const handleConfirmEndProcess = () => {
    if (showConfirmDialog) {
      endProcess(showConfirmDialog);
    }
  };

  // Function to cancel confirmation
  const handleCancelEndProcess = () => {
    setShowConfirmDialog(null);
  };

  // Function to process all jobs in queue
  const processAllJobs = async () => {
    try {
      setProcessingAllJobs(true);
      setError(null);
      
      const totalJobs = backgroundStatus.queueLength;
      setProcessAllProgress({ current: 0, total: totalJobs });
      
      if (totalJobs === 0) {
        setError('No jobs in queue to process');
        return;
      }

      // Process jobs in batches to avoid overwhelming the system
      let processedCount = 0;
      const batchSize = backgroundSettings.maxConcurrentJobs || 1;
      
      while (processedCount < totalJobs) {
        try {
          const response = await fetch('/api/background-jobs/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: backgroundSettings })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
          }

          const result = await response.json();
          if (result.success) {
            processedCount += result.processedJobs || 0;
            setProcessAllProgress({ current: processedCount, total: totalJobs });
            
            // Update background status
            try {
              const statusResponse = await fetch('/api/background-jobs/status');
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.success) {
                  setBackgroundStatus(statusData.status);
                }
              }
            } catch (statusError) {
              console.warn('Failed to update status:', statusError);
              // Don't stop processing for status update failures
            }
            
            // Break if no more jobs were processed
            if ((result.processedJobs || 0) === 0) {
              break;
            }
            
            // Add delay between batches to avoid overwhelming the system
            if (processedCount < totalJobs) {
              await new Promise(resolve => setTimeout(resolve, backgroundSettings.delayBetweenImages));
            }
          } else {
            throw new Error(result.message || 'Failed to process jobs batch');
          }
        } catch (fetchError) {
          // Handle fetch-specific errors with more helpful messages
          const error = fetchError as Error;
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check if your development server is running.');
          } else if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Connection failed: Server may be down or unreachable. Please verify your development server is running on the correct port.');
          } else {
            throw error;
          }
        }
      }
      
      setError(`Processing complete! Successfully processed ${processedCount} jobs total.`);
    } catch (err) {
      console.error('Process all jobs error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to process all jobs';
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('Network')) {
          errorMessage = `Connection Error: ${err.message}`;
        } else if (err.message.includes('Server error')) {
          errorMessage = `Server Error: ${err.message}`;
        } else {
          errorMessage = `Processing Error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setProcessingAllJobs(false);
      setProcessAllProgress({ current: 0, total: 0 });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-[95vw] mx-auto p-4">
      {/* Fixed Error/Success Message Area */}
      {error && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm font-medium shadow-lg ${
          error.includes('successfully') || error.includes('Settings saved') || error.includes('completed') 
            ? 'bg-green-100 text-green-700 border-b border-green-200' 
            : 'bg-red-100 text-red-700 border-b border-red-200'
        }`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Add top margin when error is showing */}
      <div className={error ? 'mt-12' : ''}>
        <h1 className="text-2xl font-bold mb-6">Task Status Monitor Page Here</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Task Status
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'errors'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Error Logs ({errorLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'background'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Background Processing Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Batch {task.batch_id}</h2>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty per plan: {task.qty_images_per_plan} images
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Plans Progress</span>
                      <span className="text-sm text-gray-500">
                        {task.completed_plans} / {task.total_plans}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(task.completed_plans / task.total_plans) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Images Progress</span>
                      <span className="text-sm text-gray-500">
                        {task.completed_images} / {task.total_images}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(task.completed_images / task.total_images) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {task.status !== 'completed' && (
                  <div className="mt-4 space-x-2">
                    <button
                      onClick={() => retryFailedImages(task.batch_id)}
                      disabled={retryingBatches.has(task.batch_id)}
                      className={`px-4 py-2 rounded transition-colors ${
                        retryingBatches.has(task.batch_id)
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {retryingBatches.has(task.batch_id) ? 'Retrying...' : 'Retry Failed Images'}
                    </button>
                    <button
                      onClick={() => queueMissingImages(task.batch_id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Queue for Background
                    </button>
                    <button
                      onClick={() => handleEndProcessClick(task.batch_id)}
                      disabled={endingProcess === task.batch_id}
                      className={`px-4 py-2 rounded transition-colors ${
                        endingProcess === task.batch_id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {endingProcess === task.batch_id ? 'Ending...' : 'End Process'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No tasks found
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium">Recent Error Logs</h3>
                <p className="text-sm text-gray-500">Failed or problematic image generation attempts</p>
              </div>
              <div className="divide-y divide-gray-200">
                {errorLogs.map((log, index) => (
                  <div key={log.id || index} className="px-4 py-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            log.status === 'incomplete_plan' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            Status: {log.status === 'incomplete_plan' ? 'Missing Images' : log.status || 'unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Model: {log.function_used_to_fetch_the_image || 'unknown'}
                        </p>
                        <p className="text-sm text-gray-800 mt-1">
                          Prompt: {log.prompt1 || 'No prompt available'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Batch: {log.images_plans?.rel_images_plans_batches_id || 'unknown'}
                        </p>
                        {log.missing_images && (
                          <p className="text-xs text-orange-600 mt-1">
                            Missing: {log.missing_images.join(', ')}
                          </p>
                        )}
                        {log.status === 'incomplete_plan' && (
                          <p className="text-xs text-blue-600 mt-1">
                            Plan ID: {log.rel_images_plans_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {errorLogs.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No error logs found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="space-y-4">
            {/* Background Processing Settings Form */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Background Processing Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Enabled</span>
                  <input
                    type="checkbox"
                    checked={backgroundSettings.enabled}
                    onChange={(e) => setBackgroundSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-indigo-600"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Delay Between Images</span>
                  <input
                    type="number"
                    value={backgroundSettings.delayBetweenImages}
                    onChange={(e) => setBackgroundSettings(prev => ({ ...prev, delayBetweenImages: Number(e.target.value) }))}
                    className="form-input w-20"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Delay Between Plans</span>
                  <input
                    type="number"
                    value={backgroundSettings.delayBetweenPlans}
                    onChange={(e) => setBackgroundSettings(prev => ({ ...prev, delayBetweenPlans: Number(e.target.value) }))}
                    className="form-input w-20"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Max Concurrent Jobs</span>
                  <input
                    type="number"
                    value={backgroundSettings.maxConcurrentJobs}
                    onChange={(e) => setBackgroundSettings(prev => ({ ...prev, maxConcurrentJobs: Number(e.target.value) }))}
                    className="form-input w-20"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Retry Attempts</span>
                  <input
                    type="number"
                    value={backgroundSettings.retryAttempts}
                    onChange={(e) => setBackgroundSettings(prev => ({ ...prev, retryAttempts: Number(e.target.value) }))}
                    className="form-input w-20"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Auto Retry</span>
                  <input
                    type="checkbox"
                    checked={backgroundSettings.autoRetry}
                    onChange={(e) => setBackgroundSettings(prev => ({ ...prev, autoRetry: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-indigo-600"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className={`px-4 py-2 rounded transition-colors ${
                    savingSettings
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>

            {/* Background Status */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Background Processing Status</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Is Running</span>
                  <span className="text-sm text-gray-500">{backgroundStatus.isRunning ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Queue Length</span>
                  <span className="text-sm text-gray-500">{backgroundStatus.queueLength}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Current Job</span>
                  <span className="text-sm text-gray-500">{backgroundStatus.currentJob || 'None'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Completed Jobs</span>
                  <span className="text-sm text-gray-500">{backgroundStatus.completedJobs}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Failed Jobs</span>
                  <span className="text-sm text-gray-500">{backgroundStatus.failedJobs}</span>
                </div>
                
                {/* Progress Bar for Processing All Jobs */}
                {processingAllJobs && processAllProgress.total > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-600">Processing All Jobs</span>
                      <span className="text-sm text-gray-500">
                        {processAllProgress.current} / {processAllProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${processAllProgress.total > 0 ? (processAllProgress.current / processAllProgress.total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(processAllProgress.total > 0 ? (processAllProgress.current / processAllProgress.total) * 100 : 0)}% Complete
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Background Processing Controls */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Background Processing Controls</h3>
              <div className="space-x-2">
                <button
                  onClick={startBackgroundProcessing}
                  disabled={!backgroundSettings.enabled}
                  className={`px-4 py-2 rounded transition-colors ${
                    !backgroundSettings.enabled
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Process Queue
                </button>
                <button
                  onClick={processAllJobs}
                  disabled={processingAllJobs || backgroundStatus.queueLength === 0}
                  className={`px-4 py-2 rounded transition-colors ${
                    processingAllJobs || backgroundStatus.queueLength === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {processingAllJobs 
                    ? 'Processing...' 
                    : `Process All (${backgroundStatus.queueLength}) Jobs Now`
                  }
                </button>
                <button
                  onClick={clearCompletedJobs}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Clear Completed Jobs
                </button>
                <button
                  onClick={clearPendingJobs}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Clear All Pending Jobs
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {!backgroundSettings.enabled && 'Enable background processing to use continuous queue processing.'}
              </p>
            </div>
          </div>
        )}
        
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-medium mb-4">Confirm End Process</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to end the process for batch {showConfirmDialog}? 
                This will stop all ongoing operations for this task.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={handleCancelEndProcess}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmEndProcess}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 