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
  status: 'running' | 'completed' | 'failed';
  created_at: string;
  error?: string;
}

export default function StatusJar1() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

            // Calculate completion status
            const completedPlans = plans.filter(plan => 
              plan.fk_image1_id && plan.fk_image2_id && 
              plan.fk_image3_id && plan.fk_image4_id
            ).length;

            return {
              id: batch.id,
              batch_id: batch.id,
              total_plans: totalPlans || 0,
              completed_plans: completedPlans,
              total_images: (totalPlans || 0) * 4, // Assuming 4 images per plan
              completed_images: completedImages,
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
      // Get all plans in the batch
      const { data: plans, error: plansError } = await supabase
        .from('images_plans')
        .select('*')
        .eq('rel_images_plans_batches_id', batchId);

      if (plansError) throw plansError;

      // For each plan, check if any images are missing
      for (const plan of plans) {
        const missingImages = [];
        if (!plan.fk_image1_id) missingImages.push(1);
        if (!plan.fk_image2_id) missingImages.push(2);
        if (!plan.fk_image3_id) missingImages.push(3);
        if (!plan.fk_image4_id) missingImages.push(4);

        if (missingImages.length > 0) {
          // Call the image generation function for missing images
          const { func_create_plans_make_images_1 } = await import('../../bin32/tebnar1/utils/cfunc_create_plans_make_images_1');
          await func_create_plans_make_images_1({
            records: [plan],
            qty: missingImages.length,
            aiModel: 'openai', // You might want to store this in the plan
            generateZip: false,
            wipeMeta: false
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry images');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="w-full max-w-[95vw] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Task Status Monitor</h1>
      
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold">Batch {task.batch_id}</h2>
                <p className="text-sm text-gray-500">
                  Created: {new Date(task.created_at).toLocaleString()}
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
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Retry Failed Images
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
    </div>
  );
} 