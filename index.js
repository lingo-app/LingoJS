const LingoError = require("./lingoError");
const request = require("request");

const Lingo = function() {};

Lingo.prototype.Error = LingoError;

Lingo.prototype.baseURL = "https://api.lingoapp.com/1";

function parseJSONResponse(body) {
  if (body.success === true) {
    return body.result;
  } else if (body.success === false) {
    throw new LingoError(body.error);
  } else {
    console.log("Response is missing success flag " + body);
    throw new LingoError({
      code: LingoError.Code.unknown,
      message: "Unexpected server response"
    });
  }
}

/**
 * Set your API auth credientials before using making any calls
 * @param {integer} spaceID The id of your Lingo space
 * @param {string} token An API token for your space
 */
Lingo.prototype.setup = function(spaceID, token) {
  this.auth = "Basic " + new Buffer(spaceID + ":" + token).toString("base64");
};

/**
 * Fetch all kits in your space
 * @returns {Promise} Success returns a list of kit objects
 */
Lingo.prototype.fetchKits = function() {
  return this.call("GET", "/kits").then(res => {
    return res.kits;
  });
};

/**
 * Fetch a single kit and it's versions
 * @param {uuid} id the kit uuid
 * @param {string} include optionally include versions of the kit. valid options are:
 * - `use_versions`: include the draft and recommended version (if different)
 * - `versions`: include all versions
 * - `null`: don't include any versions
 * @returns {Promise} Success returns a kit
 */
Lingo.prototype.fetchKit = function(id, include = "use_versions") {
  let path = `/kits/${id}/?options=${include}`;
  return this.call("GET", path).then(res => {
    return res.kit;
  });
};

/**
 * Fetch the outline for a kit
 * @param {uuid} id the kit uuid
 * @param {integer} version the version number of the kit to fetch
 * @returns {Promise} Success returns a list of sections and headers
 */
Lingo.prototype.fetchKitOutline = function(id, version) {
  let path = `/kits/${id}/outline?v=${version}`;
  return this.call("GET", path).then(res => {
    return res.kit_version.sections;
  });
};

/**
 * Fetch a section and optionally page through items with it
 * @param {uuid} id the section uuid
 * @param {integer} version the version number of the section to fetch
 * @param {integer} limit The max number of items to fetch
 * @param {integer} page the page of items
 * @returns {Promise} A promise resolving the section and the items matching the page/limit
 */
Lingo.prototype.fetchSection = function(id, version, page = 1, limit = 50) {
  let path = `/sections/${id}`;
  let v = version;
  let params = { qs: { v, page, limit } };
  return this.call("GET", path, params).then(res => {
    return res.section;
  });
};

/**
 * Fetch all items that fall under a given heading in a section
 * @param {uuid} sectionId the section uuid the heading is in
 * @param {uuid|string} headingId the uuid or string name of the the heading
 * @param {integer} version the version number of the section to fetch
 * @returns {Promise} A promise resolving an array of items that fall under the desired heading. Can be empty.
 *
 * Note: If using the heading string, the first heading with that string will be used. UUID is recommended.
 */
Lingo.prototype.fetchAssetsForHeading = function(
  sectionId,
  headingId,
  version
) {
  return new Promise((resolve, reject) => {
    let page = 1;
    let found = false;
    const results = [];

    function isMatch(item) {
      return (
        item.type === "heading" &&
        (item.data.content === headingId || item.uuid === headingId)
      );
    }
    const self = this;
    function fetch() {
      self
        .fetchSection(sectionId, version, page)
        .then(res => {
          const items = res.items;
          const count = items.length;
          if (count == 0) {
            return resolve(results);
          }
          for (var idx = 0; idx < count; idx++) {
            const item = items[idx];
            if (item.type == "heading" && found) {
              return resolve(results);
            } else if (isMatch(item)) {
              found = true;
            } else if (found) {
              results.push(item);
            }
          }
          page += 1;
          fetch();
        })
        .catch(err => {
          reject(err);
        });
    }
    fetch();
  });
};

/**
 * Search the items in a kit.
 * @param {uuid} kitID The uuid of the kit to search
 * @param {integer} version The version to search
 * @param {string} query A search query to filter by
 * @param {integer} page For paging resutls
 * @param {integer} limit The max number of results per page
 * @returns {Promise} Returns the results, grouped by section.
 */
Lingo.prototype.searchAssetsInKit = function(
  kitID,
  version,
  query,
  page,
  limit
) {
  const path = `/kits/${kitID}/search`;
  const v = version;
  let params = { qs: { v, query, page, limit } };
  return this.call("GET", path, params);
};

Lingo.prototype.downloadAsset = function(uuid, type = null) {
  let path = `/assets/${uuid}/download`;
  const req = this._requestParams("GET", path, {
    qs: { type },
    json: false,
    encoding: null
  });
  return new Promise(function(resolve, reject) {
    request(req, function(err, response, body) {
      if (body) {
        contentType = response.caseless.get("Content-Type");
        if (contentType.indexOf("json") >= 0) {
          try {
            const json = JSON.parse(body);
            resolve(parseJSONResponse(json));
          } catch (err) {
            reject(err);
          }
        } else {
          resolve(body);
        }
      } else {
        reject(err);
      }
    });
  });
};

Lingo.prototype._requestParams = function(method, path, more) {
  let req = {
    uri: this.baseURL + path,
    method: method,
    json: true,
    headers: {},
    ...more
  };
  req.headers.Authorization = this.auth;
  return req;
};

Lingo.prototype.call = function(method, path, more = {}) {
  const req = this._requestParams(method, path, more);
  return new Promise(function(resolve, reject) {
    request(req, function(err, response, body) {
      if (body) {
        try {
          resolve(parseJSONResponse(body));
        } catch (err) {
          reject(err);
        }
      } else {
        reject(err);
      }
    });
  });
};

module.exports = new Lingo();
