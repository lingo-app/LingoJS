const fs = require("fs");
const FormData = require("form-data");
const _merge = require("lodash/merge");
const QueryString = require("query-string");
const LingoError = require("./lingoError");
const Types = require("./types");
const fetch = require("node-fetch");

function parseJSONResponse(body) {
  if (body.success === true) {
    return body.result;
  } else if (body.success === false) {
    throw new LingoError(body.error);
  } else {
    console.error("Response is missing success flag " + body);
    throw new LingoError({
      code: LingoError.Code.unknown,
      message: "Unexpected server response",
    });
  }
}

class Lingo {
  constructor() {
    this.baseURL = "https://api.lingoapp.com/1";

    this.Error = LingoError;
    this.ItemType = Types.ItemType;
    this.AssetType = Types.AssetType;
  }

  /**
   * Set your API auth credientials before using making any calls
   * @param {integer} spaceID The id of your Lingo space
   * @param {string} token An API token for your space
   */
  setup(spaceID, token) {
    this.auth = "Basic " + Buffer.from(spaceID + ":" + token).toString("base64");
    return this.name;
  }

  /**
   * Fetch all kits in your space
   * @returns A list of kit objects
   */
  async fetchKits() {
    const res = await this.call("GET", "/kits");
    return res.kits;
  }

  /**
   * Fetch a single kit and it's versions
   * @param {uuid} id the kit uuid
   * @param {string} include optionally include versions of the kit. valid options are:
   * - `use_versions`: include the draft and recommended version (if different)
   * - `versions`: include all versions
   * - `null`: don't include any versions
   * @returns {Promise} Success returns a kit
   */
  async fetchKit(id, include = "use_versions") {
    let path = `/kits/${id}/?options=${include}`;
    const res = await this.call("GET", path);
    return res.kit;
  }

  /**
   * Fetch the outline for a kit
   * @param {uuid} id the kit uuid
   * @param {integer} version the version number of the kit to fetch
   * @returns {Promise} Success returns a list of sections and headers
   */
  async fetchKitOutline(id, version = 0) {
    let path = `/kits/${id}/outline?v=${version}`;
    const res = await this.call("GET", path);
    return res.kit_version.sections;
  }

  /**
   * Fetch a section and optionally page through items with it
   * @param {uuid} id the section uuid
   * @param {integer} version the version number of the section to fetch
   * @param {integer} limit The max number of items to fetch
   * @param {integer} page the page of items
   * @returns {Promise} A promise resolving the section and the items matching the page/limit
   */
  async fetchSection(id, version = 0, page = 1, limit = 50) {
    let path = `/sections/${id}`;
    let v = version;
    let params = { qs: { v, page, limit } };
    const res = await this.call("GET", path, params);
    return res.section;
  }

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
  async fetchAllItemsInSection(id, version = 0) {
    let page = 1;
    const limit = 200; // API Enforces <= 200
    let results = [];

    const self = this;

    while (true) {
      const section = await self.fetchSection(id, version, page, limit);
      const items = section.items;
      results = [...results, ...items];
      if (items.length < limit) {
        return results;
      }
      page += 1;
    }
  }

  async fetchAssetsForHeading(sectionId, headingId, version = 0) {
    console.error("fetchAssetsForHeading() is deprecated, please use fetchItemsForHeading()");
    return await this.fetchItemsForHeading(sectionId, headingId, version);
  }

  /**
   * Fetch all items that fall under a given heading in a section
   * @param {uuid} sectionId the section uuid the heading is in
   * @param {uuid|string} headingId the uuid or string name of the the heading
   * @param {integer} version the version number of the section to fetch
   * @returns {Promise} A promise resolving an array of items that fall under the desired heading. Can be empty.
   *
   * Note: If using the heading string, the first heading with that string will be used. UUID is recommended.
   */
  async fetchItemsForHeading(sectionId, headingId, version = 0) {
    let page = 1;
    let found = false;
    const results = [];

    function isMatch(item) {
      return (
        item.type === Types.ItemType.heading &&
        (item.data.content === headingId || item.uuid === headingId)
      );
    }
    const self = this;
    while (true) {
      const section = await self.fetchSection(sectionId, version, page, 200);

      const items = section.items;
      const count = items.length;
      if (count == 0) {
        return results;
      }
      for (var idx = 0; idx < count; idx++) {
        const item = items[idx];
        if (item.type == Types.ItemType.heading && found) {
          return results;
        } else if (isMatch(item)) {
          found = true;
        } else if (found) {
          results.push(item);
        }
      }
      page += 1;
    }
  }

  /**
   * Search the items in a kit.
   * @param {uuid} kitID The uuid of the kit to search
   * @param {integer} version The version to search
   * @param {string} query A search query to filter by
   * @param {integer} page For paging resutls
   * @param {integer} limit The max number of results per page
   * @returns {Promise} Returns the results, grouped by section.
   */
  async searchAssetsInKit(kitID, version, query, page, limit) {
    const path = `/kits/${kitID}/search`;
    const v = version;
    let params = { qs: { v, query, page, limit } };
    return await this.call("GET", path, params);
  }

  async downloadAsset(uuid, type = null) {
    let path = `/assets/${uuid}/download`;
    const { url, ...options } = this._requestParams("GET", path, {
      qs: { type },
      // Overwrite the json content type
      headers: { "Content-Type": null },
    });

    const res = await fetch(url, options);
    if (res.headers.get("content-type") == "application/json") {
      const json = await res.json();
      return await parseJSONResponse(json);
    } else {
      return await res.buffer();
    }
  }

  // MARK : Creating Content
  // -------------------------------------------------------------------------------
  /**
   * Create a new kit
   * @returns The new kit
   */
  async createKit(name) {
    const res = await this.call("POST", "/kits", {
      data: {
        name,
      },
    });
    return res.kit;
  }

  /**
   * Create a new section
   * @returns The new section
   */
  async createSection(kitId, name) {
    const res = await this.call("POST", "/sections", {
      data: {
        kit_uuid: kitId,
        name,
      },
    });
    return res.section;
  }

  async _createTextItem(type, kitId, sectionId, text) {
    if (!text) {
      throw LingoError(LingoError.Code.invalidParams, "Text is required when creating a heading");
    }
    const res = await this.call("POST", "/items", {
      data: {
        section_uuid: sectionId,
        kit_uuid: kitId,
        type,
        data: {
          content: text,
        },
      },
    });
    return res.item;
  }

  /**
   * Create a new heading
   * @returns The new item
   */
  async createHeading(kitId, sectionId, text) {
    return this._createTextItem(this.ItemType.heading, kitId, sectionId, text);
  }

  /**
   * Create a new inline note
   * @returns The new item
   */
  async createNote(kitId, sectionId, text) {
    return this._createTextItem(this.ItemType.note, kitId, sectionId, text);
  }

  /**
   * Create a new inline note
   * @returns The new item
   */
  async createAsset(file, type, kitId, sectionId, data) {
    let formData = new FormData();
    let name = data.name;

    if (typeof file == "String") {
      name = file.name.replace(RegExp(`\\.${type}$`, "gi"), "");
      const f = fs.readFileSync(file);
      formData.append("asset", f);
    } else {
      formData.append("asset", file);
    }

    const json = _merge(
      {
        type,
        name,
        item: {
          type: "asset",
          kit_uuid: kitId,
          section_uuid: sectionId,
        },
      },
      data
    );
    formData.append("json", JSON.stringify(json));
    const { url, ...options } = this._requestParams("POST", "/assets", {
      headers: { "Content-Type": null },
    });

    const response = await fetch(url, options),
      _json = await response.json(),
      res = parseJSONResponse(_json);
    return res.item;
  }

  // MARK : Making Requests
  // -------------------------------------------------------------------------------
  _requestParams(method, path, options = {}) {
    const { qs, headers, data, ...rest } = options;

    let url = this.baseURL + path;
    if (qs) {
      url = [url, QueryString.stringify(qs)].join("?");
    }
    return {
      url,
      method,
      body: data ? JSON.stringify(data) : null,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        "x-lingo-client": "LingoJS",
        Authorization: this.auth,
      },
      ...rest,
    };
  }

  async call(method, path, more = {}) {
    const { url, ...options } = this._requestParams(method, path, more);
    const response = await fetch(url, options);
    const json = await response.json();
    return parseJSONResponse(json);
  }
}

const instance = new Lingo();

module.exports = instance;
