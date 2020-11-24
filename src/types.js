const AssetType = {
  png: "PNG",
  jpg: "JPG",
  gif: "GIF",
  svg: "SVG",
  pdf: "PDF",
  eps: "EPS",
  tiff: "TIFF",
  color: "COLOR",
  textStyle: "TEXT_STYLE",
  sketchLayer: "SKETCH_LAYER",
  sketchSymbol: "SKETCH_SYMBOL",
  sketchLayerStyle: "SKETCH_LAYER_STYLE",
  sketchTextStyle: "SKETCH_TEXT_STYLE",
  // Generic
  ai: "AI",
  docx: "DOCX",
  dotx: "DOTX",
  indd: "INDD",
  keynoteTheme: "KEYNOTE_THEME",
  keynote: "KEYNOTE",
  pagesTemplate: "PAGES_TEMPLATE",
  pages: "PAGES",
  potx: "POTX",
  pptx: "PPTX",
  psd: "PSD",
};

const ItemType = {
  asset: "asset",
  heading: "heading",
  note: "inline_note",
  supportingImage: "supporting_image",
  codeSnippet: "code_snippet",
  guide: "guide",
};

module.exports = {
  ItemType,
  AssetType,
};
