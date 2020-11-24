class LingoError extends Error {
  constructor(json) {
    super(json.message || "An unexpected error occured");
    this.code = json.code || 1;
    this.details = json.details;
    this.recovery = json.recover;
  }
}

LingoError.Code = {
  unknown: 1,
  serverError: 99,
  invalidParams: 103,
  unauthorized: 401,
  permissionDenied: 403,
  objectNotFound: 404,
  rateLimited: 429,

  deprecatedAction: 900,
  deprecatedApi: 901,

  kitNotFound: 1100,
  kitAleadyExists: 1101,
  kitNotAccepted: 1102,
  versionNotFound: 1200,

  sectionNotFound: 2100,
  sectionAlreadyExists: 2101,
  sectionNotAccepted: 2102,

  assetNotFound: 3100,
  assetAlreadyExists: 3101,
  assetNotAccepted: 3102,
  assetReferenceDenied: 3106,

  fileTooLarge: 413,
  fileNotValid: 3300,
  fileNotAccepted: 3302,
  fileCutUnavailable: 3304,

  itemAlreadyExists: 3201,
  itemNotAccepted: 3202,

  featureUnavailable: 7104,
};

module.exports = LingoError;
