'use client';

import { useState, useEffect } from 'react';

interface KarmaWizardSession {
  session_id: string;
  session_name: string;
  rel_gcon_piece_id: string;
  user_id: string;
  cached_sitespren_base_note: string | null;
  steps_completed: number;
  step_left_off_at: number;
  total_steps_planned: number;
  session_status: string;
  wizard_config: any;
  cached_gcon_data: any;
  cached_sitespren_data: any;
  api_usage_log: any;
  error_log: any;
  completion_percentage: number | null;
  estimated_time_remaining: string | null;
  session_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  last_activity_at: string | null;
}

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingRecord?: KarmaWizardSession | null;
  userInternalId: string | null;
}

export default function CreateEditModal({
  isOpen,
  onClose,
  onSubmit,
  editingRecord,
  userInternalId
}: CreateEditModalProps) {
  const [formData, setFormData] = useState({
    session_name: '',
    rel_gcon_piece_id: '',
    cached_sitespren_base_note: '',
    steps_completed: 0,
    step_left_off_at: 1,
    total_steps_planned: 4,
    session_status: 'active',
    wizard_config: '{}',
    cached_gcon_data: '{}',
    cached_sitespren_data: '{}',
    api_usage_log: '[]',
    error_log: '[]',
    completion_percentage: null as number | null,
    estimated_time_remaining: '',
    session_notes: '',
    completed_at: null as string | null,
    last_activity_at: null as string | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        session_name: editingRecord.session_name || '',
        rel_gcon_piece_id: editingRecord.rel_gcon_piece_id || '',
        cached_sitespren_base_note: editingRecord.cached_sitespren_base_note || '',
        steps_completed: editingRecord.steps_completed || 0,
        step_left_off_at: editingRecord.step_left_off_at || 1,
        total_steps_planned: editingRecord.total_steps_planned || 4,
        session_status: editingRecord.session_status || 'active',
        wizard_config: JSON.stringify(editingRecord.wizard_config || {}, null, 2),
        cached_gcon_data: JSON.stringify(editingRecord.cached_gcon_data || {}, null, 2),
        cached_sitespren_data: JSON.stringify(editingRecord.cached_sitespren_data || {}, null, 2),
        api_usage_log: JSON.stringify(editingRecord.api_usage_log || [], null, 2),
        error_log: JSON.stringify(editingRecord.error_log || [], null, 2),
        completion_percentage: editingRecord.completion_percentage,
        estimated_time_remaining: editingRecord.estimated_time_remaining || '',
        session_notes: editingRecord.session_notes || '',
        completed_at: editingRecord.completed_at,
        last_activity_at: editingRecord.last_activity_at
      });
    } else {
      // Reset form for new record
      setFormData({
        session_name: '',
        rel_gcon_piece_id: '',
        cached_sitespren_base_note: '',
        steps_completed: 0,
        step_left_off_at: 1,
        total_steps_planned: 4,
        session_status: 'active',
        wizard_config: '{}',
        cached_gcon_data: '{}',
        cached_sitespren_data: '{}',
        api_usage_log: '[]',
        error_log: '[]',
        completion_percentage: null,
        estimated_time_remaining: '',
        session_notes: '',
        completed_at: null,
        last_activity_at: null
      });
    }
    setErrors({});
  }, [editingRecord]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.session_name.trim()) {
      newErrors.session_name = 'Session name is required';
    }
    if (!formData.rel_gcon_piece_id.trim()) {
      newErrors.rel_gcon_piece_id = 'Gcon piece ID is required';
    }

    // Number validations
    if (formData.steps_completed < 0) {
      newErrors.steps_completed = 'Steps completed cannot be negative';
    }
    if (formData.step_left_off_at < 1) {
      newErrors.step_left_off_at = 'Step left off at must be at least 1';
    }
    if (formData.total_steps_planned < 1) {
      newErrors.total_steps_planned = 'Total steps planned must be at least 1';
    }
    if (formData.completion_percentage !== null && (formData.completion_percentage < 0 || formData.completion_percentage > 100)) {
      newErrors.completion_percentage = 'Completion percentage must be between 0 and 100';
    }

    // JSON validations
    try {
      JSON.parse(formData.wizard_config);
    } catch {
      newErrors.wizard_config = 'Invalid JSON format';
    }

    try {
      JSON.parse(formData.cached_gcon_data);
    } catch {
      newErrors.cached_gcon_data = 'Invalid JSON format';
    }

    try {
      JSON.parse(formData.cached_sitespren_data);
    } catch {
      newErrors.cached_sitespren_data = 'Invalid JSON format';
    }

    try {
      JSON.parse(formData.api_usage_log);
    } catch {
      newErrors.api_usage_log = 'Invalid JSON format';
    }

    try {
      JSON.parse(formData.error_log);
    } catch {
      newErrors.error_log = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData: any = {
      session_name: formData.session_name,
      rel_gcon_piece_id: formData.rel_gcon_piece_id,
      cached_sitespren_base_note: formData.cached_sitespren_base_note || null,
      steps_completed: formData.steps_completed,
      step_left_off_at: formData.step_left_off_at,
      total_steps_planned: formData.total_steps_planned,
      session_status: formData.session_status,
      wizard_config: JSON.parse(formData.wizard_config),
      cached_gcon_data: JSON.parse(formData.cached_gcon_data),
      cached_sitespren_data: JSON.parse(formData.cached_sitespren_data),
      api_usage_log: JSON.parse(formData.api_usage_log),
      error_log: JSON.parse(formData.error_log),
      completion_percentage: formData.completion_percentage,
      estimated_time_remaining: formData.estimated_time_remaining || null,
      session_notes: formData.session_notes || null
    };

    // Add timestamp fields for new records
    if (!editingRecord) {
      const now = new Date().toISOString();
      submitData.last_activity_at = now;
      
      if (formData.session_status === 'completed') {
        submitData.completed_at = now;
      }
    } else {
      // For updates, only set completed_at if status is changing to completed
      if (formData.session_status === 'completed' && !formData.completed_at) {
        submitData.completed_at = new Date().toISOString();
      } else if (formData.session_status !== 'completed') {
        submitData.completed_at = null;
      } else {
        submitData.completed_at = formData.completed_at;
      }
      
      submitData.last_activity_at = formData.last_activity_at;
    }

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingRecord ? 'Edit Karma Wizard Session' : 'Create New Karma Wizard Session'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Session Name *
              </label>
              <input
                type="text"
                value={formData.session_name}
                onChange={(e) => handleChange('session_name', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter session name"
              />
              {errors.session_name && <p className="text-red-500 text-sm mt-1">{errors.session_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Gcon Piece ID *
              </label>
              <input
                type="text"
                value={formData.rel_gcon_piece_id}
                onChange={(e) => handleChange('rel_gcon_piece_id', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter gcon piece UUID"
              />
              {errors.rel_gcon_piece_id && <p className="text-red-500 text-sm mt-1">{errors.rel_gcon_piece_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Steps Completed
              </label>
              <input
                type="number"
                min="0"
                value={formData.steps_completed}
                onChange={(e) => handleChange('steps_completed', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.steps_completed && <p className="text-red-500 text-sm mt-1">{errors.steps_completed}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Step Left Off At
              </label>
              <input
                type="number"
                min="1"
                value={formData.step_left_off_at}
                onChange={(e) => handleChange('step_left_off_at', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.step_left_off_at && <p className="text-red-500 text-sm mt-1">{errors.step_left_off_at}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Total Steps Planned
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_steps_planned}
                onChange={(e) => handleChange('total_steps_planned', parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.total_steps_planned && <p className="text-red-500 text-sm mt-1">{errors.total_steps_planned}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Session Status
              </label>
              <select
                value={formData.session_status}
                onChange={(e) => handleChange('session_status', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Completion Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.completion_percentage || ''}
                onChange={(e) => handleChange('completion_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0-100"
              />
              {errors.completion_percentage && <p className="text-red-500 text-sm mt-1">{errors.completion_percentage}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Estimated Time Remaining
              </label>
              <input
                type="text"
                value={formData.estimated_time_remaining}
                onChange={(e) => handleChange('estimated_time_remaining', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1 hour 30 minutes"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cached Sitespren Base Note
            </label>
            <textarea
              value={formData.cached_sitespren_base_note}
              onChange={(e) => handleChange('cached_sitespren_base_note', e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Session Notes
            </label>
            <textarea
              value={formData.session_notes}
              onChange={(e) => handleChange('session_notes', e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Wizard Config (JSON)
              </label>
              <textarea
                value={formData.wizard_config}
                onChange={(e) => handleChange('wizard_config', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={4}
              />
              {errors.wizard_config && <p className="text-red-500 text-sm mt-1">{errors.wizard_config}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cached Gcon Data (JSON)
              </label>
              <textarea
                value={formData.cached_gcon_data}
                onChange={(e) => handleChange('cached_gcon_data', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={4}
              />
              {errors.cached_gcon_data && <p className="text-red-500 text-sm mt-1">{errors.cached_gcon_data}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cached Sitespren Data (JSON)
              </label>
              <textarea
                value={formData.cached_sitespren_data}
                onChange={(e) => handleChange('cached_sitespren_data', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={4}
              />
              {errors.cached_sitespren_data && <p className="text-red-500 text-sm mt-1">{errors.cached_sitespren_data}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                API Usage Log (JSON Array)
              </label>
              <textarea
                value={formData.api_usage_log}
                onChange={(e) => handleChange('api_usage_log', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={4}
              />
              {errors.api_usage_log && <p className="text-red-500 text-sm mt-1">{errors.api_usage_log}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Error Log (JSON Array)
              </label>
              <textarea
                value={formData.error_log}
                onChange={(e) => handleChange('error_log', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={3}
              />
              {errors.error_log && <p className="text-red-500 text-sm mt-1">{errors.error_log}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editingRecord ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}