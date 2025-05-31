export interface ImageRecord {
  id: number;
  rel_users_id: number | null;
  created_at: string;
  rel_images_plans_id: number | null;
  img_file_url1: string | null;
  img_file_extension: string | null;
  img_file_size: number | null;
  width: number | null;
  height: number | null;
  prompt1: string | null;
  status: string | null;
  function_used_to_fetch_the_image: string | null;
} 