"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseFilePath = parseFilePath;
exports.resolveFilePath = resolveFilePath;
exports.getUploadData = getUploadData;
exports.parseJSONResponse = parseJSONResponse;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _lingoError = _interopRequireDefault(require("./lingoError"));

var _types = require("./types");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function parseFilePath(filePath) {
  var extension = _path["default"].extname(filePath),
      filename = _path["default"].basename(filePath, extension);

  return {
    filename: filename,
    extension: extension.replace(".", "")
  };
}

function resolveFilePath(filePath) {
  if (filePath && filePath.startsWith(".")) {
    return _path["default"].resolve(process.cwd(), filePath);
  }

  return filePath;
}

function getUploadData(file) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var name = data.name;
  var type = data.type;
  var fileData;

  if (typeof file == "string") {
    var filePath = resolveFilePath(file);

    var _parseFilePath = parseFilePath(file),
        filename = _parseFilePath.filename,
        extension = _parseFilePath.extension;

    name = name || filename;
    type = type || extension;
    fileData = _fs["default"].createReadStream(filePath);
  } else {
    fileData = file;
  }

  if (!type) {
    throw new _lingoError["default"](_lingoError["default"].Code.invalidParams, "Unable to determine file type from path. Provide type in the data object or provide a filename a valid extension");
  }

  type = type.toUpperCase();

  if (!Object.values(_types.AssetType).includes(type)) {
    throw new _lingoError["default"](_lingoError["default"].Code.invalidParams, "Invalid file type ".concat(type));
  }

  return {
    file: fileData,
    metadata: {
      name: name,
      type: type
    }
  };
}

function parseJSONResponse(body) {
  if (body.success === true) {
    return body.result;
  } else if (body.success === false) {
    throw _lingoError["default"].from(body.error);
  } else {
    console.error("Response is missing success flag " + body);
    throw new _lingoError["default"](_lingoError["default"].Code.unknown, "Unexpected server response");
  }
}