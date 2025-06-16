// Tebnar2 TypeScript interfaces and types

export interface Tebnar2ImagePlan {
  id: string;
  rel_users_id: string;
  rel_images_plans_batches_id: string | null;
  created_at: string;
  int1?: number | null;
  fk_image1_id: string | null;
  int2?: number | null;
  fk_image2_id: string | null;
  int3?: number | null;
  fk_image3_id: string | null;
  int4?: number | null;
  fk_image4_id: string | null;
  e_zpf_img_code: string | null;
  e_width: number | null;
  e_height: number | null;
  e_associated_content1: string | null;
  e_file_name1: string | null;
  e_more_instructions1: string | null;
  e_prompt1: string | null;
  e_ai_tool1: string | null;
}

export interface Tebnar2Image {
  id: string;
  rel_users_id: string;
  created_at: string;
  url?: string;
  file_name?: string;
  file_size?: number;
  metadata?: any;
}

export interface Tebnar2Batch {
  id: string;
  rel_users_id: string;
  name: string | null;
  note1: string | null;
  created_at: string;
}

export interface Tebnar2GridCell {
  row: number;
  col: number;
}

export interface Tebnar2ColumnSettings {
  width: string;
  minWidth: string;
  maxWidth: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface Tebnar2HeaderCellSettings {
  width: string;
  minWidth: string;
  maxWidth: string;
}

export interface Tebnar2ThrottleSettings {
  enabled: boolean;
  delayBetweenImages: number;
  delayBetweenPlans: number;
}

export interface Tebnar2MainElementStyling {
  layout: {
    width: string;
    maxWidth: string;
    minWidth: string;
    height: string;
    minHeight: string;
    maxHeight: string;
  };
  margins: {
    margin: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    marginBlock: string;
    marginInline: string;
  };
  padding: {
    padding: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    paddingBlock: string;
    paddingInline: string;
  };
}

export interface Tebnar2TableStyling {
  container: {
    width: string;
    height: string;
    overflow: string;
    border: string;
    borderRadius: string;
    backgroundColor: string;
    boxShadow: string;
    margin: string;
    padding: string;
  };
  table: {
    width: string;
    tableLayout: 'auto' | 'fixed';
    borderCollapse: 'separate' | 'collapse';
    borderSpacing: string;
    fontSize: string;
    fontFamily: string;
    backgroundColor: string;
    border: string;
  };
}

export interface Tebnar2RowSettings {
  height: string;
  minHeight: string;
  maxHeight: string;
}

export interface Tebnar2State {
  grid: string[][];
  selected: Tebnar2GridCell;
  plans: Tebnar2ImagePlan[];
  loading: boolean;
  error: string | null;
  gridData: string[][];
  submitLoading: boolean;
  submitResult: string | null;
  batches: Tebnar2Batch[];
  selectedBatchId: string;
  qtyPerPlan: number;
  aiModel: string;
  makeImagesLoading: boolean;
  makeImagesResult: string | null;
  currentPage: number;
  pageSize: number;
  imagesById: Record<string, Tebnar2Image>;
  generateZip: boolean;
  wipeMeta: boolean;
  throttle1: Tebnar2ThrottleSettings;
  fetchingImages: Set<string>;
  loadingPreset: boolean;
  presetData: string[][] | null;
  lastClickTime: Record<string, number>;
}

export type Tebnar2ColumnKey = keyof Tebnar2ImagePlan | 'image1-preview' | 'image2-preview' | 'image3-preview' | 'image4-preview';

export interface Tebnar2ComponentProps {
  // Add component-specific props as needed
}

// Utility types
export type Tebnar2AlignType = 'left' | 'center' | 'right';
export type Tebnar2FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type Tebnar2TextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase';
export type Tebnar2VerticalAlign = 'top' | 'middle' | 'bottom' | 'baseline';
export type Tebnar2Overflow = 'visible' | 'hidden' | 'scroll' | 'auto';
export type Tebnar2TextOverflow = 'clip' | 'ellipsis';
export type Tebnar2WhiteSpace = 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';
export type Tebnar2WordBreak = 'normal' | 'break-all' | 'keep-all' | 'break-word';
export type Tebnar2BoxSizing = 'content-box' | 'border-box';
export type Tebnar2Position = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
export type Tebnar2Cursor = 'default' | 'pointer' | 'text' | 'help';