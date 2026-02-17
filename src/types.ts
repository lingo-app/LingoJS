export enum AssetType {
  PNG = "PNG",
  JPG = "JPG",
  GIF = "GIF",
  SVG = "SVG",
  PDF = "PDF",
  EPS = "EPS",
  TIFF = "TIFF",
  Color = "COLOR",
  TextStyle = "TEXT_STYLE",
  // Sketch
  SketchLayer = "SKETCH_LAYER",
  SketchSymbol = "SKETCH_SYMBOL",
  SketchLayerStyle = "SKETCH_LAYER_STYLE",
  SketchTextStyle = "SKETCH_TEXT_STYLE",
  // Documents
  TXT = "TXT",
  DOCX = "DOCX",
  DOTX = "DOTX",
  INDD = "INDD",
  KeynoteTheme = "KEYNOTE_THEME",
  Keynote = "KEYNOTE",
  PagesTemplate = "PAGES_TEMPLATE",
  Pages = "PAGES",
  POTX = "POTX",
  PPTX = "PPTX",

  // Design
  AI = "AI",
  PSD = "PSD",
  // Raster
  HEIC = "HEIC",
  WEBP = "WEBP",

  // Motion
  MOV = "MOV",
  MP4 = "MP4",
  AVI = "AVI",
  LOTTIE = "LOTTIE",

  // Audio
  MP3 = "MP3",
  WAV = "WAV",
  M4A = "M4A",

  // 3D
  STL = "STL",
  OBJ = "OBJ",

  ZIP = "ZIP",

  URL = "URL",
}

export type Status = "active" | "deleted";
export type PrivacyLevel = "public" | "private" | "password";

export enum ItemType {
  Asset = "asset",
  Heading = "heading",
  Note = "inline_note",
  CodeSnippet = "code_snippet",
  Guide = "guide",
  Gallery = "gallery",
  /** Support content is deprecated, use asset type with displayProperties instead */
  SupportingContent = "supporting_image",
}

export interface Kit {
  name: string;
  description: string;
  kitUuid: string;
  spaceId: number;
  shortId: string;
  useVersion: number;
  status: Status;
  privacy: PrivacyLevel;
  dateAdded: string;
  dateUpdated: string;
  images: { cover: string };
  versions: KitVersion[];
}

export interface KitVersion {
  kitUuId: string;
  status: Status;
  version: number;
  versionIdentifer: string;
  notes: string;
  counts: {
    assets: number;
    items: number;
    sections: number;
  };
  dateAdded: string;
  dateUpdated: string;
}

export interface KitOutline extends KitVersion {
  sections: KitOutlineSection[];
}

export interface KitOutlineHeading {
  uuid: string;
  shortId: string;
  displayOrder: number;
  name: string;
  version: number;
}

export interface KitOutlineSection {
  uuid: string;
  shortId: string;
  name: string;
  version: number;
  counts: {
    assets: number;
    items: number;
  };
  displayOrder: number;
  headers: KitOutlineHeading[];
}

export interface Section {
  uuid: string;
  shortId: string;
  name: string;
  kitUuid: string;
  version: number;
  status: Status;
  displayOrder: number;
  counts: { assets: number; items: number };
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
  items: Item[];
}

// MARK : Item
// -------------------------------------------------------------------------------
export interface Item {
  uuid: string;
  shortId: string;
  kitUuid: string;
  sectionUuid: string;
  displayOrder: number;
  version: number;
  status: Status | "trashed";
  type: ItemType;
  dateAdded: string;
  dateUpdated: string;
  assetId?: string;
  asset?: Asset;
  data: {
    content?: string;
    codeLanguage?: string;
    title?: string;
    color?: string;

    // Galleries
    dateRefreshed?: string;
    viewName?: string;
    name?: string;
    viewId?: number;
    assets?: number;
    itemProcessing?: "pending" | "complete";

    /** Deprecated */
    background?: string;
    /** Deprecated */
    displayStyle?: string;
  };
  displayProperties: {
    size?: 1 | 2 | 3 | 4 | 5 | 6;
    imageAlignment?: "top" | "leading" | "trailing";
    showMetadata?: boolean;
    allowDownload?: boolean;
    caption?: string;
    cardBackgroundColor?: string;
    autoplay?: boolean;
    displayStyle?: "image" | "text_only";
  };
}

// MARK : Custom Fields
// -------------------------------------------------------------------------------
export enum CustomFieldTypes {
  "text" = "text",
  "number" = "number",
  "date" = "date",
  "checklist" = "checklist",
  "select" = "select",
}

export enum CustomFieldOperation {
  "add" = "add",
  "remove" = "remove",
  "set" = "set",
}

export type CustomFieldOption = {
  id?: number; // Options created on the client do not yet have an ID value
  name: string;
  status: "active" | "deleted";
  selected?: boolean;
};

export type CustomField = {
  id: number;
  type: CustomFieldTypes;
  spaceId: number;
  name: string;
  status: "active" | "deleted";
  public: boolean;
  displayOrder: number;
  options?: CustomFieldOption[];
  value?: string | number;
};

export type AssetCustomFields = {
  [key: string]: string[] | string | number;
};

// MARK : Asset
// -------------------------------------------------------------------------------

export type AssetProcesssingDetails = {
  code: number;
  message: string;
};

export interface Color {
  alpha: number; // 0 - 100
  brightness: number; // 0 - 100
  coverage: number; // 0 - 100
  hue: number; // 0 - 360
  name: string;
  saturation: number; // 0 - 100
}

export type AssetFilecuts = {
  availableTypes: [
    {
      enabled: boolean;
      resizable: boolean;
      setDpi: boolean;
      type: string;
    }
  ];
  presets: [
    {
      description: string;
      size: string;
      type: string;
    }
  ];
};

export type AssetMeta = {
  filecuts?: AssetFilecuts;
  backgroundColor?: string;
  font: {
    displayName: string;
    extension: string;
    family: string;
    fontName: string;
    source: "file" | "google-fonts";
    stylesheetUrl: string;
    variant: string;
  };
  assetProcessingDetails?: AssetProcesssingDetails;
  assetProcessing: "processing" | "complete" | "error";
  content?: {
    url?: string;
    description?: string;
    title?: string;
    siteName?: string;
    favicon?: string;
    fld?: string;
  };
  preview?: {
    dimensions: string;
    fileType: string;
    id: string;
  };
  duration?: number;
  figma?: {
    url: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

export interface Asset {
  uuid: string;
  type: AssetType;
  name: string;
  notes: string;
  dimensions: string; // WxH
  size: number; // bytes
  meta: AssetMeta;
  keywords: string;
  colors: Color[];
  fileHash: string;
  fileId: string;
  dateAdded: string;
  dateUpdated: string;
  fileUpdated: string;
  permalink: string;
  thumbnails: {
    24: string;
    292: string;
    480: string;
    1232: string;
  };
  fields: AssetCustomFields;
  versionedFields?: CustomField[];
}

export type DirectLink = {
  id: number;
  assetId: string;
  spaceId: number;
  name: string;
  url: string;
  dateAdded: string;
  dateUpdated: string;
};

export interface SearchResult {
  total: number;
  offset: number;
  limit: number;
  results: {
    type: "item" | "section" | "kit" | "asset";
    object: Item | Kit | Section | Asset;
  }[];
}

export type Change<T> = { new: T; previous: T };

type ChangeData<T> = {
  [key in keyof T]?: T[key] extends object ? ChangeData<T[key]> : Change<T[key]>;
};

export interface ChangelogEvent<T> {
  event: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  data: T;
}

export type Changelog<T> = [ChangelogEvent<T>, ...ChangelogEvent<ChangeData<T>>[]];
