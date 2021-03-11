"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _formData = _interopRequireDefault(require("form-data"));

var _merge2 = _interopRequireDefault(require("lodash/merge"));

var _queryString = _interopRequireDefault(require("query-string"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _lingoError = _interopRequireDefault(require("./lingoError"));

var _types = require("./types");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Lingo = /*#__PURE__*/function () {
  function Lingo() {
    _classCallCheck(this, Lingo);

    this.baseURL = "https://api.lingoapp.com/1";
    this.Error = _lingoError["default"];
    this.ItemType = _types.ItemType;
    this.AssetType = _types.AssetType;
  }
  /**
   * Set your API auth credientials before using making any calls
   * @param {integer} spaceID The id of your Lingo space
   * @param {string} token An API token for your space
   */


  _createClass(Lingo, [{
    key: "setup",
    value: function setup(spaceID, token) {
      this.auth = "Basic " + Buffer.from(spaceID + ":" + token).toString("base64");
      return this.name;
    }
    /**
     * Fetch all kits in your space
     * @returns A list of kit objects
     */

  }, {
    key: "fetchKits",
    value: function () {
      var _fetchKits = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var res;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.call("GET", "/kits");

              case 2:
                res = _context.sent;
                return _context.abrupt("return", res.kits);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fetchKits() {
        return _fetchKits.apply(this, arguments);
      }

      return fetchKits;
    }()
    /**
     * Fetch a single kit and it's versions
     * @param {uuid} id the kit uuid
     * @param {string} include optionally include versions of the kit. valid options are:
     * - `use_versions`: include the draft and recommended version (if different)
     * - `versions`: include all versions
     * - `null`: don't include any versions
     * @returns {Promise} Success returns a kit
     */

  }, {
    key: "fetchKit",
    value: function () {
      var _fetchKit = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id) {
        var include,
            path,
            res,
            _args2 = arguments;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                include = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : "use_versions";
                path = "/kits/".concat(id, "/?options=").concat(include);
                _context2.next = 4;
                return this.call("GET", path);

              case 4:
                res = _context2.sent;
                return _context2.abrupt("return", res.kit);

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fetchKit(_x) {
        return _fetchKit.apply(this, arguments);
      }

      return fetchKit;
    }()
    /**
     * Fetch the outline for a kit
     * @param {uuid} id the kit uuid
     * @param {integer} version the version number of the kit to fetch
     * @returns {Promise} Success returns a list of sections and headers
     */

  }, {
    key: "fetchKitOutline",
    value: function () {
      var _fetchKitOutline = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
        var version,
            path,
            res,
            _args3 = arguments;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                version = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : 0;
                path = "/kits/".concat(id, "/outline?v=").concat(version);
                _context3.next = 4;
                return this.call("GET", path);

              case 4:
                res = _context3.sent;
                return _context3.abrupt("return", res.kit_version.sections);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function fetchKitOutline(_x2) {
        return _fetchKitOutline.apply(this, arguments);
      }

      return fetchKitOutline;
    }()
    /**
     * Fetch a section and optionally page through items with it
     * @param {uuid} id the section uuid
     * @param {integer} version the version number of the section to fetch
     * @param {integer} limit The max number of items to fetch
     * @param {integer} page the page of items
     * @returns {Promise} A promise resolving the section and the items matching the page/limit
     */

  }, {
    key: "fetchSection",
    value: function () {
      var _fetchSection = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
        var version,
            page,
            limit,
            path,
            v,
            params,
            res,
            _args4 = arguments;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                version = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : 0;
                page = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : 1;
                limit = _args4.length > 3 && _args4[3] !== undefined ? _args4[3] : 50;
                path = "/sections/".concat(id);
                v = version;
                params = {
                  qs: {
                    v: v,
                    page: page,
                    limit: limit
                  }
                };
                _context4.next = 8;
                return this.call("GET", path, params);

              case 8:
                res = _context4.sent;
                return _context4.abrupt("return", res.section);

              case 10:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function fetchSection(_x3) {
        return _fetchSection.apply(this, arguments);
      }

      return fetchSection;
    }()
    /**
     * Utility function to fetch all items in a section, automatically paging if needed.
     *
     * The API limits fetches to 200. This function recursively calls fetchSection until all items have been retrieved.
     * To page manually, use `fetchSection`
     *
     * @param {uuid} id the section uuid
     * @param {integer} version the version number of the section to fetch
     * @param {integer} limit The max number of items to fetch
     * @returns {Promise} A promise resolving the section and the items matching the page/limit
     */

  }, {
    key: "fetchAllItemsInSection",
    value: function () {
      var _fetchAllItemsInSection = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id) {
        var version,
            page,
            limit,
            results,
            self,
            section,
            items,
            _args5 = arguments;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                version = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : 0;
                page = 1;
                limit = 200; // API Enforces <= 200

                results = [];
                self = this;

              case 5:
                if (!true) {
                  _context5.next = 16;
                  break;
                }

                _context5.next = 8;
                return self.fetchSection(id, version, page, limit);

              case 8:
                section = _context5.sent;
                items = section.items;
                results = [].concat(_toConsumableArray(results), _toConsumableArray(items));

                if (!(items.length < limit)) {
                  _context5.next = 13;
                  break;
                }

                return _context5.abrupt("return", results);

              case 13:
                page += 1;
                _context5.next = 5;
                break;

              case 16:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function fetchAllItemsInSection(_x4) {
        return _fetchAllItemsInSection.apply(this, arguments);
      }

      return fetchAllItemsInSection;
    }()
  }, {
    key: "fetchAssetsForHeading",
    value: function () {
      var _fetchAssetsForHeading = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(sectionId, headingId) {
        var version,
            _args6 = arguments;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                version = _args6.length > 2 && _args6[2] !== undefined ? _args6[2] : 0;
                console.error("fetchAssetsForHeading() is deprecated, please use fetchItemsForHeading()");
                _context6.next = 4;
                return this.fetchItemsForHeading(sectionId, headingId, version);

              case 4:
                return _context6.abrupt("return", _context6.sent);

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function fetchAssetsForHeading(_x5, _x6) {
        return _fetchAssetsForHeading.apply(this, arguments);
      }

      return fetchAssetsForHeading;
    }()
    /**
     * Fetch all items that fall under a given heading in a section
     * @param {uuid} sectionId the section uuid the heading is in
     * @param {uuid|string} headingId the uuid or string name of the the heading
     * @param {integer} version the version number of the section to fetch
     * @returns {Promise} A promise resolving an array of items that fall under the desired heading. Can be empty.
     *
     * Note: If using the heading string, the first heading with that string will be used. UUID is recommended.
     */

  }, {
    key: "fetchItemsForHeading",
    value: function () {
      var _fetchItemsForHeading = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(sectionId, headingId) {
        var version,
            page,
            found,
            results,
            isMatch,
            self,
            section,
            items,
            count,
            idx,
            item,
            _args7 = arguments;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                isMatch = function _isMatch(item) {
                  return item.type === Types.ItemType.heading && (item.data.content === headingId || item.uuid === headingId);
                };

                version = _args7.length > 2 && _args7[2] !== undefined ? _args7[2] : 0;
                page = 1;
                found = false;
                results = [];
                self = this;

              case 6:
                if (!true) {
                  _context7.next = 28;
                  break;
                }

                _context7.next = 9;
                return self.fetchSection(sectionId, version, page, 200);

              case 9:
                section = _context7.sent;
                items = section.items;
                count = items.length;

                if (!(count == 0)) {
                  _context7.next = 14;
                  break;
                }

                return _context7.abrupt("return", results);

              case 14:
                idx = 0;

              case 15:
                if (!(idx < count)) {
                  _context7.next = 25;
                  break;
                }

                item = items[idx];

                if (!(item.type == Types.ItemType.heading && found)) {
                  _context7.next = 21;
                  break;
                }

                return _context7.abrupt("return", results);

              case 21:
                if (isMatch(item)) {
                  found = true;
                } else if (found) {
                  results.push(item);
                }

              case 22:
                idx++;
                _context7.next = 15;
                break;

              case 25:
                page += 1;
                _context7.next = 6;
                break;

              case 28:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function fetchItemsForHeading(_x7, _x8) {
        return _fetchItemsForHeading.apply(this, arguments);
      }

      return fetchItemsForHeading;
    }()
    /**
     * Search the items in a kit.
     * @param {uuid} kitID The uuid of the kit to search
     * @param {integer} version The version to search
     * @param {string} query A search query to filter by
     * @param {integer} page For paging resutls
     * @param {integer} limit The max number of results per page
     * @returns {Promise} Returns the results, grouped by section.
     */

  }, {
    key: "searchAssetsInKit",
    value: function () {
      var _searchAssetsInKit = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(kitID, version, query, page, limit) {
        var path, v, params;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                path = "/kits/".concat(kitID, "/search");
                v = version;
                params = {
                  qs: {
                    v: v,
                    query: query,
                    page: page,
                    limit: limit
                  }
                };
                _context8.next = 5;
                return this.call("GET", path, params);

              case 5:
                return _context8.abrupt("return", _context8.sent);

              case 6:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function searchAssetsInKit(_x9, _x10, _x11, _x12, _x13) {
        return _searchAssetsInKit.apply(this, arguments);
      }

      return searchAssetsInKit;
    }()
  }, {
    key: "downloadAsset",
    value: function () {
      var _downloadAsset = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(uuid) {
        var type,
            path,
            _this$_requestParams,
            url,
            options,
            res,
            json,
            _args9 = arguments;

        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                type = _args9.length > 1 && _args9[1] !== undefined ? _args9[1] : null;
                path = "/assets/".concat(uuid, "/download");
                _this$_requestParams = this._requestParams("GET", path, {
                  qs: {
                    type: type
                  },
                  // Overwrite the json content type
                  headers: {
                    "Content-Type": null
                  }
                }), url = _this$_requestParams.url, options = _objectWithoutProperties(_this$_requestParams, ["url"]);
                _context9.next = 5;
                return (0, _nodeFetch["default"])(url, options);

              case 5:
                res = _context9.sent;

                if (!(res.headers.get("content-type") == "application/json")) {
                  _context9.next = 15;
                  break;
                }

                _context9.next = 9;
                return res.json();

              case 9:
                json = _context9.sent;
                _context9.next = 12;
                return (0, _utils.parseJSONResponse)(json);

              case 12:
                return _context9.abrupt("return", _context9.sent);

              case 15:
                _context9.next = 17;
                return res.buffer();

              case 17:
                return _context9.abrupt("return", _context9.sent);

              case 18:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function downloadAsset(_x14) {
        return _downloadAsset.apply(this, arguments);
      }

      return downloadAsset;
    }() // MARK : Creating Content
    // -------------------------------------------------------------------------------

  }, {
    key: "supportedContentTypes",
    value: function () {
      var _supportedContentTypes = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
        var itemType,
            _args10 = arguments;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                itemType = _args10.length > 0 && _args10[0] !== undefined ? _args10[0] : null;

              case 1:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }));

      function supportedContentTypes() {
        return _supportedContentTypes.apply(this, arguments);
      }

      return supportedContentTypes;
    }()
    /**
     * Create a new kit
     * @returns The new kit
     */

  }, {
    key: "createKit",
    value: function () {
      var _createKit = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(name) {
        var res;
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this.call("POST", "/kits", {
                  data: {
                    name: name
                  }
                });

              case 2:
                res = _context11.sent;
                return _context11.abrupt("return", res.kit);

              case 4:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function createKit(_x15) {
        return _createKit.apply(this, arguments);
      }

      return createKit;
    }()
    /**
     * Create a new section
     * @returns The new section
     */

  }, {
    key: "createSection",
    value: function () {
      var _createSection = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(kitId, name) {
        var res;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return this.call("POST", "/sections", {
                  data: {
                    kit_uuid: kitId,
                    name: name
                  }
                });

              case 2:
                res = _context12.sent;
                return _context12.abrupt("return", res.section);

              case 4:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function createSection(_x16, _x17) {
        return _createSection.apply(this, arguments);
      }

      return createSection;
    }()
  }, {
    key: "_createTextItem",
    value: function () {
      var _createTextItem2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(type, kitId, sectionId, text) {
        var res;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                if (text) {
                  _context13.next = 2;
                  break;
                }

                throw new _lingoError["default"](_lingoError["default"].Code.invalidParams, "Text is required when creating a heading");

              case 2:
                _context13.next = 4;
                return this.call("POST", "/items", {
                  data: {
                    section_uuid: sectionId,
                    kit_uuid: kitId,
                    type: type,
                    data: {
                      content: text
                    }
                  }
                });

              case 4:
                res = _context13.sent;
                return _context13.abrupt("return", res.item);

              case 6:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function _createTextItem(_x18, _x19, _x20, _x21) {
        return _createTextItem2.apply(this, arguments);
      }

      return _createTextItem;
    }()
    /**
     * Create a new heading
     * @returns The new item
     */

  }, {
    key: "createHeading",
    value: function () {
      var _createHeading = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(kitId, sectionId, text) {
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt("return", this._createTextItem(this.ItemType.heading, kitId, sectionId, text));

              case 1:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function createHeading(_x22, _x23, _x24) {
        return _createHeading.apply(this, arguments);
      }

      return createHeading;
    }()
    /**
     * Create a new inline note
     * @returns The new item
     */

  }, {
    key: "createNote",
    value: function () {
      var _createNote = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(kitId, sectionId, text) {
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                return _context15.abrupt("return", this._createTextItem(this.ItemType.note, kitId, sectionId, text));

              case 1:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function createNote(_x25, _x26, _x27) {
        return _createNote.apply(this, arguments);
      }

      return createNote;
    }()
    /**
     * Create a new asset from a file
     * @param {File|Path} file A file or filepath
     * @param {String} type The type of the asset, must be one of AssetType
     * @param {UUID} kitId The id of the kit to create the asset in
     * @param {UUID} sectionId The id of the section to create the asset in
     * @param {Object} data An oject with additional optional metadata
     * ```
     * data = {
     *  name: "",
     *  notes: "",
     *  keywords: "",
     *  date_created: "",
     *  item: {
     *    display_order: "append|prepend|before:uuid|after:uuid
     *  }
     * }
     * ```
     *
     * @returns The new item and asset
     */

  }, {
    key: "createAsset",
    value: function () {
      var _createAsset = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(file, kitId, sectionId) {
        var data,
            formData,
            _getUploadData,
            fileData,
            metadata,
            json,
            _this$_requestParams2,
            url,
            options,
            response,
            _json,
            res,
            _args16 = arguments;

        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                data = _args16.length > 3 && _args16[3] !== undefined ? _args16[3] : {};
                formData = new _formData["default"]();
                _getUploadData = (0, _utils.getUploadData)(file, data), fileData = _getUploadData.file, metadata = _getUploadData.metadata;
                json = (0, _merge2["default"])({}, metadata, data, {
                  item: {
                    type: "asset",
                    kit_uuid: kitId,
                    section_uuid: sectionId
                  }
                });
                formData.append("asset", fileData);
                formData.append("json", JSON.stringify(json));
                _this$_requestParams2 = this._requestParams("POST", "/assets", {
                  headers: formData.getHeaders(),
                  formData: formData
                }), url = _this$_requestParams2.url, options = _objectWithoutProperties(_this$_requestParams2, ["url"]);
                _context16.next = 9;
                return (0, _nodeFetch["default"])(url, options);

              case 9:
                response = _context16.sent;
                _context16.next = 12;
                return response.json();

              case 12:
                _json = _context16.sent;
                res = (0, _utils.parseJSONResponse)(_json);
                return _context16.abrupt("return", res.item);

              case 15:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function createAsset(_x28, _x29, _x30) {
        return _createAsset.apply(this, arguments);
      }

      return createAsset;
    }() // MARK : Making Requests
    // -------------------------------------------------------------------------------

  }, {
    key: "_requestParams",
    value: function _requestParams(method, path) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var qs = options.qs,
          headers = options.headers,
          data = options.data,
          formData = options.formData,
          rest = _objectWithoutProperties(options, ["qs", "headers", "data", "formData"]);

      var url = this.baseURL + path;

      if (qs) {
        url = [url, _queryString["default"].stringify(qs)].join("?");
      } // Prepare the body


      if (formData && data) {
        throw new _lingoError["default"](_lingoError["default"].Code.unknown, "LingoJS Error: cannot add formdata and json to a request.");
      }

      var body = formData;

      if (data) {
        if (_typeof(data) !== "object") {
          throw new _lingoError["default"](_lingoError["default"].Code.unknown, "LingoJS Error: request data should be an object.");
        }

        body = JSON.stringify(data);
      }

      return _objectSpread({
        url: url,
        method: method,
        body: body,
        headers: _objectSpread(_objectSpread({
          "Content-Type": "application/json"
        }, headers), {}, {
          "x-lingo-client": "LingoJS",
          Authorization: this.auth
        })
      }, rest);
    }
  }, {
    key: "call",
    value: function () {
      var _call = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(method, path) {
        var more,
            _this$_requestParams3,
            url,
            options,
            response,
            json,
            _args17 = arguments;

        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                more = _args17.length > 2 && _args17[2] !== undefined ? _args17[2] : {};
                _this$_requestParams3 = this._requestParams(method, path, more), url = _this$_requestParams3.url, options = _objectWithoutProperties(_this$_requestParams3, ["url"]);
                _context17.next = 4;
                return (0, _nodeFetch["default"])(url, options);

              case 4:
                response = _context17.sent;
                _context17.next = 7;
                return response.json();

              case 7:
                json = _context17.sent;
                return _context17.abrupt("return", (0, _utils.parseJSONResponse)(json));

              case 9:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function call(_x31, _x32) {
        return _call.apply(this, arguments);
      }

      return call;
    }()
  }]);

  return Lingo;
}();

var _default = Lingo;
exports["default"] = _default;