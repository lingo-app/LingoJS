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
  // Motion
  MOV = "MOV",
  MP4 = "MP4",
  LOTTIE = "LOTTIE",
}

export type Status = "active" | "deleted";
export type PrivacyLevel = "public" | "private" | "password";

export enum ItemType {
  Asset = "asset",
  Heading = "heading",
  Note = "inline_note",
  SupportingContent = "supporting_image",
  CodeSnippet = "code_snippet",
  Guide = "guide",
}

export interface Kit {
  name: string;
  description: string;
  kitId: string;
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
  kitId: string;
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
  sections: [KitOutlineSection];
}

export interface KitOutlineHeading {
  id: string;
  shortId: string;
  displayOrder: number;
  name: string;
  version: number;
}

export interface KitOutlineSection {
  id: string;
  shortId: string;
  name: string;
  version: number;
  counts: {
    assets: number;
    items: number;
  };
  displayOrder: number;
  headers: [KitOutlineHeading];
}

export interface Section {
  id: string;
  shortId: string;
  name: string;
  kitId: string;
  version: number;
  status: Status;
  displayOrder: number;
  counts: { assets: number; items: number };
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
  items: Item[];
}

export interface Item {
  id: string;
  shortId: string;
  kitId: string;
  sectionId: string;
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
    background?: string;
    codeLanguage?: string;
    displayStyle?: string;
    title?: string;
    color?: string;
  };
}

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
  assetProcessing?: "complete" | "processing" | "error";
  filecuts?: AssetFilecuts;
  font: {
    displayName: string;
    extension: string;
    family: string;
    fontName: string;
    source: "file" | "google-fonts";
    stylesheetUrl: string;
    variant: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

export interface Asset {
  id: string;
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
}

export interface SearchResult {
  total: number;
  offset: number;
  limit: number;
  results: {
    type: "item" | "section" | "kit" | "asset";
    object: Item | Kit | Section | Asset;
  }[];
}

type ChangeData = { new: undefined; previous: unknown };
export interface ChangelogEvent {
  event: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  // Nested data will only have new/previous fields for the lowest level
  data: Record<string, ChangeData | Record<string, ChangeData>>;
}
