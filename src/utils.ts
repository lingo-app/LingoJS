import fs from "fs";
import path from "path";
import LingoError from "./lingoError";

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
  name?: string;
  type?: string;
};

export function getUploadData(
  file: string,
  data?: UploadData
): { file: fs.ReadStream; metadata: UploadData } {
  const filePath = resolveFilePath(file),
    { filename, extension } = parseFilePath(file),
    name = data?.name || filename,
    type = data?.type || extension,
    fileData = fs.createReadStream(filePath);

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
function normalizeResponse(object) {
  const convertKey = str =>
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
