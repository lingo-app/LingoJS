import FormData from "form-data";
import _merge from "lodash/merge";
import QueryString from "query-string";
import fetch from "node-fetch";

import LingoError from "./lingoError";
import { AssetType, ItemType } from "./types";
import { getUploadData, parseJSONResponse } from "./utils";

class Lingo {
  baseURL = "https://api.lingoapp.com/1";
  private auth: string;
  /**
   * Set your API auth credientials before using making any calls
   * @param spaceID The id of your Lingo space
   * @param token An API token for your space
   */
  setup(spaceID: number | string, token: string): void {
    this.auth = "Basic " + Buffer.from(spaceID + ":" + token).toString("base64");
  }

  /**
   * Fetch all kits in your space
   * @returns A list of kit objects
   */
  async fetchKits(): Promise<any[]> {
    const res = await this.callAPI("GET", "/kits");
    return res.kits;
  }

  /**
   * Fetch a single kit and it's versions
   * @param id the kit uuid
   * @param include optionally include versions of the kit. valid options are:
   * - `use_versions`: include the draft and recommended version (if different)
   * - `versions`: include all versions
   * - `null`: don't include any versions
   * @returns Success returns a kit
   */
  async fetchKit(id: string, include = "use_versions"): Promise<any> {
    const path = `/kits/${id}/?options=${include}`;
    const res = await this.callAPI("GET", path);
    return res.kit;
  }

  /**
   * Fetch the outline for a kit
   * @param id the kit uuid
   * @param version the version number of the kit to fetch
   * @returns Success returns a list of sections and headers
   */
  async fetchKitOutline(id: string, version = 0): Promise<any[]> {
    const path = `/kits/${id}/outline?v=${version}`;
    const res = await this.callAPI("GET", path);
    return res.kit_version.sections;
  }

  /**
   * Fetch a section and optionally page through items with it
   * @param sectionId the section uuid
   * @param version the version number of the section to fetch
   * @param limit The max number of items to fetch
   * @param page the page of items
   * @returns A promise resolving the section and the items matching the page/limit
   */
  async fetchSection(sectionId: string, version = 0, page = 1, limit = 50): Promise<any> {
    const path = `/sections/${sectionId}`,
      params = { qs: { v: version, page, limit } };
    const res = await this.callAPI("GET", path, params);
    return res.section;
  }

  /**
   * Utility function to fetch all items in a section, automatically paging if needed.
   *
   * The API limits fetches to 200. This function recursively calls fetchSection until all items have been retrieved.
   * To page manually, use `fetchSection`
   *
   * @param sectionId the section uuid
   * @param version the version number of the section to fetch
   * @param limit The max number of items to fetch
   * @returns A promise resolving the section and the items matching the page/limit
   */
  async fetchAllItemsInSection(sectionId: string, version = 0): Promise<any[]> {
    const limit = 200; // API Enforces <= 200
    let page = 1,
      results = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const section = await this.fetchSection(sectionId, version, page, limit);
      const items = section.items;
      results = [...results, ...items];
      if (items.length < limit) {
        return results;
      }
      page += 1;
    }
  }

  async fetchAssetsForHeading(sectionId: string, headingId: string, version = 0): Promise<any[]> {
    console.error("fetchAssetsForHeading() is deprecated, please use fetchItemsForHeading()");
    return await this.fetchItemsForHeading(sectionId, headingId, version);
  }

  /**
   * Fetch all items that fall under a given heading in a section
   * @param sectionId the section uuid the heading is in
   * @param headingId the uuid or string name of the the heading
   * @param version the version number of the section to fetch
   * @returns A promise resolving an array of items that fall under the desired heading. Can be empty.
   *
   * Note: If using the heading string, the first heading with that string will be used. UUID is recommended.
   */
  async fetchItemsForHeading(sectionId: string, headingId: string, version = 0): Promise<any[]> {
    let page = 1;
    let found = false;
    const results = [];

    function isMatch(item: { uuid: string; type: ItemType; data?: { content?: string } }) {
      return (
        item.type === ItemType.Heading &&
        (item.data.content === headingId || item.uuid === headingId)
      );
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const section = await this.fetchSection(sectionId, version, page, 200);

      const items = section.items;
      const count = items.length;
      if (count == 0) {
        return results;
      }
      for (let idx = 0; idx < count; idx++) {
        const item = items[idx];
        if (item.type == ItemType.Heading && found) {
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
   * @param kitID The uuid of the kit to search
   * @param version The version to search
   * @param query A search query to filter by
   * @param page For paging resutls
   * @param limit The max number of results per page
   * @returns Returns the results, grouped by section.
   */
  async searchAssetsInKit(
    kitID: string,
    version: number,
    query: string,
    page?: number,
    limit?: number
  ): Promise<any> {
    const path = `/kits/${kitID}/search`,
      params = { qs: { v: version, query, page, limit } };
    return await this.callAPI("GET", path, params);
  }

  /**
   * Prepare the file and get a url to download it
   *
   * @param id The uuid of the asset
   * @param type The type of filecut to donwload, defaults to original
   * @returns A url to download the prepared file
   */
  async getAssetDownloadUrl(id: string, type?: string): Promise<string> {
    const path = `/assets/${id}/download`;
    const res = await this.callAPI("GET", path, {
      qs: { type, response: "json" },
    });
    return res.url;
  }

  /**
   *
   * @param id The uuid of the asset
   * @param type The type of filecut to donwload, defaults to original
   * @returns A buffer with the file data
   */
  async downloadAsset(id: string, type?: string): Promise<Buffer> {
    const downloadUrl = await this.getAssetDownloadUrl(id, type);
    const res = await fetch(downloadUrl);
    if (res.status != 200) {
      // Most likely an s3 error
      const errStr = await res.text();
      throw new LingoError(LingoError.Code.Unknown, "An error occurred downloading the asset", {
        rawError: errStr,
      });
    } else {
      return await res.buffer();
    }
  }

  // MARK : Creating Content
  // -------------------------------------------------------------------------------

  /**
   * Create a new kit
   * @param name The name of the kit
   * @returns The new kit
   */
  async createKit(name: string): Promise<any> {
    const res = await this.callAPI("POST", "/kits", {
      data: {
        name,
      },
    });
    return res.kit;
  }

  /**
   * Create a new section
   *
   * @param kitId The uuid of the kit to create the section in
   * @param name The name of the section
   * @returns The new section
   */
  async createSection(kitId: string, name?: string): Promise<any> {
    const res = await this.callAPI("POST", "/sections", {
      data: {
        kit_uuid: kitId,
        name,
      },
    });
    return res.section;
  }

  private async _createTextItem(
    type: string,
    kitId: string,
    sectionId: string,
    text?: string
  ): Promise<any> {
    if (!text) {
      throw new LingoError(
        LingoError.Code.InvalidParams,
        "Text is required when creating a heading"
      );
    }
    const res = await this.callAPI("POST", "/items", {
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
   * @param kitId The id of the kit to create the item in
   * @param sectionId The id of the section to create the item in (must be in kit)
   * @param text The text content of the heading
   * @returns The new item
   */
  async createHeading(kitId: string, sectionId: string, text: string): Promise<any> {
    return this._createTextItem(ItemType.Heading, kitId, sectionId, text);
  }

  /**
   * Create a new inline note
   * @param kitId The id of the kit to create the item in
   * @param sectionId The id of the section to create the item in (must be in kit)
   * @param text The text content of the note
   * @returns The new item
   */
  async createNote(kitId: string, sectionId: string, text: string): Promise<any> {
    return this._createTextItem(ItemType.Note, kitId, sectionId, text);
  }

  /**
   * Create a new asset from a file
   * @param file A filepath
   * @param kitId The id of the kit to create the asset in
   * @param sectionId The id of the section to create the asset in
   * @param data An oject with additional optional metadata
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
  async createAsset(
    file: string,
    kitId: string,
    sectionId: string,
    data?: { name?: string; type?: AssetType; notes?: string }
  ): Promise<any> {
    const { file: fileData, metadata } = getUploadData(file, data),
      json = _merge({}, metadata, data, {
        item: {
          type: "asset",
          kit_uuid: kitId,
          section_uuid: sectionId,
        },
      });
    const formData = new FormData();
    formData.append("asset", fileData);
    formData.append("json", JSON.stringify(json));
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    const { url, ...options } = this.requestParams("POST", "/assets", {
      headers: formData.getHeaders(),
      formData,
    });

    const response = await fetch(url, options),
      _json = await response.json(),
      res = parseJSONResponse(_json);
    return res.item;
  }

  // MARK : Making Requests
  // -------------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  requestParams(method: string, path: string, options?: any): any {
    const { qs, headers, data, formData, ...rest } = options || {};

    let url = this.baseURL + path;
    if (qs) {
      url = [url, QueryString.stringify(qs)].join("?");
    }

    // Prepare the body
    if (formData && data) {
      throw new LingoError(
        LingoError.Code.Unknown,
        "LingoJS Error: cannot add formdata and json to a request."
      );
    }
    let body = formData;
    if (data) {
      if (typeof data !== "object") {
        throw new LingoError(
          LingoError.Code.Unknown,
          "LingoJS Error: request data should be an object."
        );
      }
      body = JSON.stringify(data);
    }

    return {
      url,
      method,
      body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        "x-lingo-client": "LingoJS",
        Authorization: this.auth,
      },
      ...rest,
    };
  }

  async callAPI(method: string, path: string, options = {}): Promise<any> {
    const { url, ..._options } = this.requestParams(method, path, options);
    const response = await fetch(url, _options);
    const json = await response.json();
    return parseJSONResponse(json);
  }
}

export default Lingo;
