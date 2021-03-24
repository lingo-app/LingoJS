enum ErrorCode {
  Unknown = 1,
  ServerError = 99,
  InvalidParams = 103,
  Unauthorized = 401,
  PermissionDenied = 403,
  ObjectNotFound = 404,
  RateLimited = 429,

  DeprecatedAction = 900,
  DeprecatedApi = 901,

  KitNotFound = 1100,
  KitAleadyExists = 1101,
  KitNotAccepted = 1102,
  VersionNotFound = 1200,

  SectionNotFound = 2100,
  SectionAlreadyExists = 2101,
  SectionNotAccepted = 2102,

  AssetNotFound = 3100,
  AssetAlreadyExists = 3101,
  AssetNotAccepted = 3102,
  AssetReferenceDenied = 3106,

  FileTooLarge = 413,
  FileNotValid = 3300,
  FileNotAccepted = 3302,
  FileCutUnavailable = 3304,

  ItemAlreadyExists = 3201,
  ItemNotAccepted = 3202,

  FeatureUnavailable = 7104,
}

export default class LingoError extends Error {
  code: number;
  details: any;
  recovery: any;

  static Code = ErrorCode;

  constructor(code: number, message: string, details = {}, recovery = {}) {
    super(message || "An unexpected error occured");
    this.code = code || 1;
    this.details = details;
    this.recovery = recovery;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static from(json: any): LingoError {
    const { code, message, details, recovery } = json;
    return new LingoError(code, message, details, recovery);
  }
}
