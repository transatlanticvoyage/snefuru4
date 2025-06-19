-- Create custom_colors table for admin custom styling system
CREATE TABLE IF NOT EXISTS custom_colors (
  color_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(50) NOT NULL UNIQUE,
  hex_value VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_colors_color_code ON custom_colors(color_code);
CREATE INDEX IF NOT EXISTS idx_custom_colors_created_at ON custom_colors(created_at);

-- Add some sample data
INSERT INTO custom_colors (color_name, color_code, hex_value) VALUES
('Primary Blue', 'primary-blue', '#3b82f6'),
('Success Green', 'success-green', '#10b981'),
('Warning Orange', 'warning-orange', '#f59e0b'),
('Danger Red', 'danger-red', '#ef4444'),
('Secondary Gray', 'secondary-gray', '#6b7280')
ON CONFLICT (color_code) DO NOTHING;