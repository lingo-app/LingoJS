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
  Product = "product",
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
  kitUuid: string;
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
  assetUuid?: string;
  asset?: Asset;
  productUuid?: string;
  /** Included for `product` items when fetching a section */
  product?: Product;
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
    },
  ];
  presets: [
    {
      description: string;
      size: string;
      type: string;
    },
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
  assetProcessingDetails?: {
    code: number;
    message: string;
  };
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
  assetUuid: string;
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

export type ContentType = {
  assetType: string;
  fileExtension: string;
  maxSize: number;
  category: string;
  aliases: string[];
  displayName: string;
  replacements: string[] | null;
  eligibleForDirectLinks: boolean;
  eligibleForCustomPreviews: boolean;
};

// MARK : Products
// -------------------------------------------------------------------------------
export type ProductStatus = "active" | "archived" | "deleted";
export type VariantAvailability = "draft" | "hidden" | "coming_soon" | "available" | "retired";
export type FieldValueSource = null | "override" | "inherited";

export type ProductFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "boolean"
  | "name"
  | "description"
  | "sku"
  | "price"
  | "asset"
  | "images"
  | "cannabis_subcategory"
  | "phenotype"
  | "taste"
  | "mood"
  | "ingredients"
  | "terpenes";

export interface ProductTypeFieldOption {
  uuid: string;
  value: string;
  label: string;
  displayOrder: number;
}

export interface ProductTypeField {
  id: number;
  uuid: string;
  productTypeUuid: string;
  name: string;
  /** Slug used as the key in `Product.fields` and `Variant.fields` */
  identifier: string;
  fieldType: ProductFieldType;
  required: boolean;
  status: Status;
  displayOrder: number;
  options: ProductTypeFieldOption[];
  config: Record<string, unknown>;
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
}

export interface ProductType {
  id: number;
  uuid: string;
  spaceId: number;
  name: string;
  description: string | null;
  status: Status;
  counts: { fields: number; products: number };
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
  fields?: ProductTypeField[];
}

export interface Market {
  id: number;
  uuid: string;
  spaceId: number;
  name: string;
  notes: string | null;
  status: Status;
  displayOrder: number;
  counts: { products: number };
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
}

export type SelectedOption = { uuid: string | null; value: string; label: string };

/** Number values are fixed-point strings matching the field's configured decimals */
export type ScalarFieldValue = {
  value: string | number | boolean | null;
  source: FieldValueSource;
};
export type SelectFieldValue = { option: SelectedOption | null; source: FieldValueSource };
export type MultiselectFieldValue = { options: SelectedOption[]; source: FieldValueSource };
export type AssetFieldValue = {
  assets: { assetUuid: string; displayOrder: number; inherited: boolean; asset: Asset | null }[];
  source: FieldValueSource;
};
export type ProductFieldValue =
  | ScalarFieldValue
  | SelectFieldValue
  | MultiselectFieldValue
  | AssetFieldValue;

/** Keyed by `ProductTypeField.identifier` */
export type ProductFields = Record<string, ProductFieldValue>;

export interface Variant {
  id: number;
  uuid: string;
  spaceId: number;
  productUuid: string;
  status: Status;
  availability: VariantAvailability;
  /** Display labels keyed by option field name, e.g. `{ Size: "1g" }`; typed values live in `fields` */
  optionValues: Record<string, string>;
  fields: ProductFields;
  marketUuid: string | null;
  computedMarketUuid: string | null;
  displayOrder: number;
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
}

export interface Product {
  id: number;
  uuid: string;
  spaceId: number;
  /** Set on the frozen copy of a product baked into a published kit version */
  sourceUuid: string | null;
  productTypeUuid: string;
  name: string | null;
  status: ProductStatus;
  counts: { variants: number; activeVariants: number; options: number; markets: number };
  fields: ProductFields;
  /** The fields whose values drive this product's variants, in order */
  options: { fieldUuid: string }[];
  marketUuid: string | null;
  creatorId: number;
  dateAdded: string;
  dateUpdated: string;
  productType?: ProductType;
  previewAsset?: Asset | null;
  variants?: Variant[];
  markets?: Market[];
  /** Variants that satisfied a name or field filter, included when filtering */
  matchedVariants?: { uuid: string; optionValues: Record<string, string> }[];
}

/** A field value to write: the serialized shape, or a bare value (`"Red"`, `"22.50"`, `true`, `["s", "m"]`) */
export type ProductFieldInput =
  | ProductFieldValue
  | string
  | number
  | boolean
  | null
  | string[]
  | { assetUuid: string }[];

/** Keyed by field identifier or uuid */
export type ProductFieldsInput = Record<string, ProductFieldInput>;

export interface ProductCreateData {
  productTypeUuid: string;
  fields: ProductFieldsInput;
  marketUuid?: string;
}

/** A variant to write. Fields are the complete set of overrides; omit one to inherit it. */
export interface VariantData {
  uuid?: string;
  fields?: ProductFieldsInput;
  availability?: VariantAvailability;
  marketUuid?: string | null;
  displayOrder?: number;
}

export interface ProductUpdateData {
  fields?: ProductFieldsInput;
  marketUuid?: string | null;
  status?: "active" | "archived";
  /** The fields that drive variants, in order */
  options?: { fieldUuid: string }[];
  /** The complete variant list; variants left out are deleted */
  variants?: VariantData[];
}

export interface ProductList {
  products: Product[];
  total: number;
}

export interface ProductTypeList {
  productTypes: ProductType[];
  total: number;
}

export interface MarketList {
  markets: Market[];
  total: number;
}
