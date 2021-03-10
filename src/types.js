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
  // Sketchw
  sketchLayer: "SKETCH_LAYER",
  sketchSymbol: "SKETCH_SYMBOL",
  sketchLayerStyle: "SKETCH_LAYER_STYLE",
  sketchTextStyle: "SKETCH_TEXT_STYLE",
  // Documents
  txt: "TXT",
  docx: "DOCX",
  dotx: "DOTX",
  indd: "INDD",
  keynoteTheme: "KEYNOTE_THEME",
  keynote: "KEYNOTE",
  pagesTemplate: "PAGES_TEMPLATE",
  pages: "PAGES",
  potx: "POTX",
  pptx: "PPTX",
  // Design
  ai: "AI",
  psd: "PSD",
  // Motion
  mov: "MOV",
  mp4: "MP4",
  lottie: "LOTTIE",
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
