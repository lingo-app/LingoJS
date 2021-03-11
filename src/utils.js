import fs from "fs";
import path from "path";
import LingoError from "./lingoError";

export function parseFilePath(filePath) {
  const extension = path.extname(filePath),
    filename = path.basename(filePath, extension);
  return { filename, extension: extension.replace(".", "") };
}

export function resolveFilePath(filePath) {
  if (filePath && filePath.startsWith(".")) {
    return path.resolve(process.cwd(), filePath);
  }
  return filePath;
}

export function getUploadData(file, data = {}) {
  let name = data.name;
  let type = data.type;
  let fileData;

  if (typeof file == "string") {
    const filePath = resolveFilePath(file);
    const { filename, extension } = parseFilePath(file);
    name = name || filename;
    type = type || extension;
    fileData = fs.createReadStream(filePath);
  } else {
    fileData = file;
  }

  if (!type) {
    throw new LingoError(
      LingoError.Code.invalidParams,
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

export function parseJSONResponse(body) {
  if (body.success === true) {
    return body.result;
  } else if (body.success === false) {
    throw LingoError.from(body.error);
  } else {
    console.error("Response is missing success flag " + body);
    throw new LingoError(LingoError.Code.unknown, "Unexpected server response");
  }
}
