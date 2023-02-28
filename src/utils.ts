import fs from "fs";
import path from "path";
import LingoError from "./lingoError";
import btoa from "btoa";

export function parseFilePath(filePath: string): { filename: string; extension: string } {
  const extension = path.extname(filePath),
    filename = path.basename(filePath, extension);
  return { filename, extension: extension.replace(".", "") };
}

export function resolveFilePath(filePath: string): string {
  if (filePath && filePath.startsWith(".")) {
    return path.resolve(process.cwd(), filePath);
  }
  return filePath;
}

type UploadData = {
  name: string;
  type: string;
};

export function getUploadData(
  file: string,
  data?: Partial<UploadData>
): { file: fs.ReadStream; metadata: UploadData } {
  const filePath = resolveFilePath(file),
    { filename, extension } = parseFilePath(file),
    name = data?.name || filename,
    type = data?.type || extension;

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch {
    throw new LingoError(LingoError.Code.FileNotValid, `Unable to access asset file: ${file}`);
  }
  const fileData = fs.createReadStream(filePath);

  if (!type) {
    throw new LingoError(
      LingoError.Code.InvalidParams,
      "Unable to determine file type from path. Provide type in the data object or provide a filename a valid extension"
    );
  }

  return {
    file: fileData,
    metadata: {
      name,
      type,
    },
  };
}

/**
 * Normalizes response data into a more javascript friendly format by camelcaseing snake case to camel case and replacing some keys.
 *
 * @param object Any object
 * @returns The object with normalized object keys
 */
function normalizeResponse(object: unknown) {
  const convertKey = (str: string): string =>
    str
      .replace("uuid", "id")
      .replace(/([-_][a-z0-9])/g, group => group.toUpperCase().replace("-", "").replace("_", ""));
  if (!object) return object;
  if (Array.isArray(object)) {
    return object.map(val => normalizeResponse(val));
  }
  if (typeof object === "object") {
    return Object.keys(object).reduce((acc, key) => {
      acc[convertKey(key)] = normalizeResponse(object[key]);
      return acc;
    }, {});
  }
  return object;
}

export function formatDate(date?: Date): number {
  if (!date) return undefined;
  return date.getTime() / 1000;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseJSONResponse(body: Record<string, unknown>): any {
  if (body.success === true) {
    return normalizeResponse(body.result);
  } else if (body.success === false) {
    throw LingoError.from(body.error);
  } else {
    console.error("Response is missing success flag " + body);
    throw new LingoError(LingoError.Code.Unknown, "Unexpected server response");
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function encodeUnicode(value: any): string {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  let str = value;
  if (typeof value !== "string") str = JSON.stringify(str);
  function toSolidBytes(_match, p1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return String.fromCharCode(`0x${p1}` as any);
  }
  const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, toSolidBytes);
  return btoa(binary);
}
