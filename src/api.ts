import FormData from "form-data";
import _merge from "lodash/merge";
import QueryString from "query-string";
import fetch from "node-fetch";

import LingoError from "./lingoError";
import { AssetType, ItemType, Kit, Section, Item, KitOutline, Asset } from "./types";
import { getUploadData, parseJSONResponse } from "./utils";
import { Search } from "./search";
import { TinyColor } from "@ctrl/tinycolor";

type KitIncludes = "use_versions" | "versions" | null;
type AssetItem = {
  kitId: string;
  sectionId: string;
  displayOrder?: string | number;
};
type ItemData = {
  content?: string;
  title?: string;
  code_language?: string;
  display_style?: string;
  color?: string;
};

class Lingo {
  baseURL = "https://api.lingoapp.com/1";
  private spaceId: number | string;
  private auth: string;
  /**
   * Set your API auth credientials before using making any calls
   * @param spaceID The id of your Lingo space
   * @param token An API token for your space
   */
  setup(spaceId: number | string, token: string): void {
    this.spaceId = spaceId;
    this.auth = "Basic " + Buffer.from(spaceId + ":" + token).toString("base64");
  }

  /**
   * Fetch all kits in your space
   * @returns A list of kit objects
   */
  async fetchKits(): Promise<Kit[]> {
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
  async fetchKit(id: string, include: KitIncludes = "use_versions"): Promise<Kit> {
    const path = `/kits/${id}/?options=${include}`;
    const res = await this.callAPI("GET", path);
    return res.kit;
  }

  /**
   * Fetch the outline for a kit
   * @param id the kit uuid
   * @param version the version number of the kit to fetch
   * @returns Success returns a version including a list of sections and headers
   */
  async fetchKitOutline(id: string, version = 0): Promise<KitOutline> {
    const path = `/kits/${id}/outline?v=${version}`;
    const res = await this.callAPI("GET", path);
    return res.kitVersion;
  }

  /**
   * Fetch a section and optionally page through items with it
   * @param sectionId the section uuid
   * @param version the version number of the section to fetch
   * @param limit The max number of items to fetch
   * @param page the page of items
   * @returns A promise resolving the section and the items matching the page/limit
   */
  async fetchSection(sectionId: string, version = 0, page = 1, limit = 50): Promise<Section> {
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
  async fetchAllItemsInSection(sectionId: string, version = 0): Promise<Item[]> {
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

  /**
   * Fetch all items that fall under a given heading in a section
   * @param sectionId the section id the heading is in
   * @param headingId the uuid or string name of the the heading
   * @param version the version number of the section to fetch
   * @returns A promise resolving an array of items that fall under the desired heading. Can be empty.
   *
   * Note: If using the heading string, the first heading with that string will be used. sectionID is recommended to target a specific heading.
   */
  async fetchItemsForHeading(sectionId: string, headingId: string, version = 0): Promise<Item[]> {
    let page = 1;
    let found = false;
    const results = [];

    function isMatch(item: Item) {
      return (
        item.type === ItemType.Heading &&
        (item.data.content === headingId || item.id === headingId || item.shortId === headingId)
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
   * Create a new search object to build and execute a search query
   * @returns A new search object
   */
  search(): Search {
    return new Search();
  }

  /**
   * Prepare the file and get a url to download it
   *
   * @param id The uuid of the asset
   * @param type The type of filecut to donwload, defaults to original
   * @returns A url to download the prepared file
   */
  async getAssetDownloadUrl(
    id: string,
    options?: { type?: string; dimensions?: string; dpi?: number }
  ): Promise<string> {
    const path = `/assets/${id}/download`;
    const res = await this.callAPI("GET", path, {
      qs: { ...options, response: "json" },
    });
    return res.url;
  }

  /**
   *
   * @param id The id of the asset
   * @param type The type of filecut to donwload, defaults to original
   * @returns A buffer with the file data
   */
  async downloadAsset(
    id: string,
    options?: { type?: string; dimensions?: string; dpi?: number }
  ): Promise<Buffer> {
    const downloadUrl = await this.getAssetDownloadUrl(id, options);
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
  async createKit(name: string): Promise<Kit> {
    const res = await this.callAPI("POST", "/kits", {
      data: {
        name,
      },
    });
    return res.kit as Kit;
  }

  /**
   * Create a new section
   *
   * @param kitId The uuid of the kit to create the section in
   * @param name The name of the section
   * @returns The new section
   */
  async createSection(kitId: string, name?: string): Promise<Section> {
    const res = await this.callAPI("POST", "/sections", {
      data: {
        kit_uuid: kitId,
        name,
      },
    });
    return res.section;
  }

  private async _createItemWithoutAsset(
    type: string,
    context: {
      kitId: string;
      sectionId: string;
      displayOrder?: string | number;
    },
    data: ItemData
  ): Promise<Item> {
    const res = await this.callAPI("POST", "/items", {
      data: {
        section_uuid: context.sectionId,
        kit_uuid: context.kitId,
        display_order: context.displayOrder,
        type,
        data,
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
  async createHeading(data: {
    content: string;
    kitId: string;
    sectionId: string;
    displayOrder?: string | number;
  }): Promise<Item> {
    const { kitId, sectionId, displayOrder } = data;
    return this._createItemWithoutAsset(
      ItemType.Heading,
      { kitId, sectionId, displayOrder },
      { content: data.content }
    );
  }

  /**
   * Create a new inline note
   * @param kitId The id of the kit to create the item in
   * @param sectionId The id of the section to create the item in (must be in kit)
   * @param text The text content of the note
   * @returns The new item
   */
  async createNote(data: {
    content: string;
    kitId: string;
    sectionId: string;
    displayOrder?: string | number;
  }): Promise<Item> {
    const { kitId, sectionId, displayOrder } = data;
    return this._createItemWithoutAsset(
      ItemType.Note,
      { kitId, sectionId, displayOrder },
      { content: data.content }
    );
  }

  /**
   * Create a new inline note
   * @param kitId The id of the kit to create the item in
   * @param sectionId The id of the section to create the item in (must be in kit)
   * @param text The text content of the note
   * @returns The new item
   */
  async createCodeSnippet(data: {
    kitId: string;
    sectionId: string;
    displayOrder?: string | number;
    content: string;
    language?: string;
  }): Promise<Item> {
    const { kitId, sectionId, content, language, displayOrder } = data;
    return this._createItemWithoutAsset(
      ItemType.CodeSnippet,
      { kitId, sectionId, displayOrder },
      {
        content,
        code_language: language,
      }
    );
  }

  /**
   * Create a new inline note
   * @param kitId The id of the kit to create the item in
   * @param sectionId The id of the section to create the item in (must be in kit)
   * @param text The text content of the note
   * @returns The new item
   */
  async createGuide(data: {
    kitId: string;
    sectionId: string;
    displayOrder?: string | number;
    content: string;
    title: "Do" | "Don't";
    file?: string;
  }): Promise<Item> {
    const { kitId, sectionId, content, title, file, displayOrder } = data;
    const color = { Do: "green", "Don't": "red" }[title];
    if (!color) {
      throw new LingoError(
        LingoError.Code.InvalidParams,
        "Invalid guide title. Must be Do or Don't"
      );
    }

    if (!file) {
      return await this._createItemWithoutAsset(
        ItemType.Guide,
        { kitId, sectionId, displayOrder },
        {
          content,
          title,
          color,
          display_style: "text_only",
        }
      );
    }
    const { item } = await this._createFileAsset(file, {
      item: {
        kitId,
        sectionId,
        displayOrder,
        type: ItemType.Guide,
        data: {
          content,
          color,
          title,
          display_style: "image",
        },
      },
    });
    return item;
  }

  /**
   * Create a new inline note
   * @param kitId The id of the kit to create the item in
   * @param sectionId The id of the section to create the item in (must be in kit)
   * @param file a filepath
   * @returns The new item
   */
  async createSupportingContent(position: {
    file: string;
    kitId: string;
    sectionId: string;
    displayOrder?: string | number;
  }): Promise<Item> {
    const { kitId, sectionId, file, displayOrder } = position;
    const itemData = { kitId, sectionId, displayOrder, type: ItemType.SupportingContent };

    const { item } = await this._createFileAsset(file, { item: itemData });
    return item;
  }

  /**
   *
   * @param color A color string, See TinyColor for supported formats
   * @param context
   * @param data
   */
  async createColorAsset(
    color: string,
    data?: {
      name?: string;
      notes?: string;
      item?: AssetItem;
    }
  ): Promise<{ asset?: Asset; item?: Item }> {
    const c = new TinyColor(color);
    const hsv = c.toHsv();
    if (!c.isValid) {
      throw Error(`Invalid color: ${color}`);
    }

    const item = data?.item
      ? {
          section_uuid: data.item.sectionId,
          kit_uuid: data.item.kitId,
          display_order: data.item.displayOrder,
          type: "asset",
        }
      : undefined;

    const assetData = {
      ...data,
      item,
      type: AssetType.Color,
      colors: [
        {
          hue: hsv.h,
          saturation: hsv.s * 100,
          brightness: hsv.v * 100,
          alpha: hsv.a * 100,
          coverage: 100,
        },
      ],
    };

    const res = await this.callAPI("POST", "/assets", {
      data: assetData,
    });
    return res;
  }

  /**
   * Validate asset data to ensure it is valid for uploading
   *
   * @param file a filepath
   * @param data An oject with additional optional metadata
   * @returns The
   */
  async validateAsset(
    file: string,
    data: { type?: AssetType }
  ): Promise<{ type: string; filepath: string; name: string }> {
    try {
      const { file: stream, metadata } = getUploadData(file, data);
      return Promise.resolve({ ...metadata, filepath: stream.path as string });
    } catch {
      throw new LingoError(LingoError.Code.FileNotValid, `Unable to access asset file: ${file}`);
    }
  }

  /**
   * Create a new asset from a file
   * @param file A filepath
   * @param data An oject with additional optional metadata
   * ```
   * data = {
   *  name: "",
   *  notes: "",
   *  keywords: "",
   *  item: {
   *    kitId: "",
   *    sectionId: "",
   *    display_order: "append|prepend|before:uuid|after:uuid
   *  }
   * }
   * ```
   *
   * @returns The new item and/or asset. If context is provided the item will be returned, otherwise the asset will be returned
   */
  async createFileAsset(
    file: string,
    data?: {
      name?: string;
      type?: AssetType;
      notes?: string;
      item: AssetItem;
    }
  ): Promise<{ item?: Item; asset?: Asset }> {
    return await this._createFileAsset(file, data);
  }

  private async _createFileAsset(
    file: string,
    data?: {
      name?: string;
      type?: AssetType;
      notes?: string;
      item: AssetItem & { type?: ItemType; data?: ItemData };
    }
  ) {
    const { file: fileData, metadata } = getUploadData(file, data),
      json = _merge({}, metadata, data);

    const fonts = ["TTF", "OTF", "WOFF", "WOFF2"];
    if (fonts.includes(metadata.type)) {
      json.type = AssetType.TextStyle;
    }

    if (data?.item) {
      json.item = {
        type: data.item.type ?? "asset",
        kit_uuid: data.item.kitId,
        section_uuid: data.item.sectionId,
        display_order: data.item.displayOrder,
        data: data.item.data,
      };
    }

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
      res = parseJSONResponse(_json as Record<string, unknown>);
    return res;
  }

  // MARK : Making Requests
  // -------------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async callAPI(method: string, path: string, options = {}): Promise<any> {
    const { url, ..._options } = this.requestParams(method, path, options);
    const response = await fetch(url, _options);
    const json = await response.json();
    return parseJSONResponse(json as Record<string, unknown>);
  }
}

export default Lingo;
