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
  const [activeTab, setActiveTab] = useState<'status' | 'errors'>('status');
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [retryingBatches, setRetryingBatches] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient();

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="w-full max-w-[95vw] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Task Status Monitor</h1>
      
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
                <button
                  onClick={() => retryFailedImages(task.batch_id)}
                  disabled={retryingBatches.has(task.batch_id)}
                  className={`mt-4 px-4 py-2 rounded transition-colors ${
                    retryingBatches.has(task.batch_id)
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {retryingBatches.has(task.batch_id) ? 'Retrying...' : 'Retry Failed Images'}
                </button>
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
    </div>
  );
} 