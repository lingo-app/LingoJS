"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  LingoError: true
};
Object.defineProperty(exports, "LingoError", {
  enumerable: true,
  get: function get() {
    return _lingoError["default"];
  }
});
exports["default"] = void 0;

require("regenerator-runtime/runtime");

var _api = _interopRequireDefault(require("./api"));

var _types = require("./types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});

var _lingoError = _interopRequireDefault(require("./lingoError"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = new _api["default"]();

exports["default"] = _default;