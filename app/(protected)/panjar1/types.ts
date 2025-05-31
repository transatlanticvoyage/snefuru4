export interface ImageRecord {
  id: string;
  rel_users_id: string;
  created_at: string;
  rel_images_plans_id: string;
  img_file_url1: string;
  img_file_extension: string;
  img_file_size: number;
  width: number;
  height: number;
  prompt1: string;
  status: string;
  function_used_to_fetch_the_image: string;
} 