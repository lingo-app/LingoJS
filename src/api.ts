import QueryString from "query-string";
import merge from "lodash/merge";

import LingoError from "./lingoError";
import {
  AssetType,
  ItemType,
  Kit,
  Section,
  Item,
  KitOutline,
  Asset,
  Changelog,
  DirectLink,
  CustomField,
} from "./types";
import { formatDate, getUploadData, parseJSONResponse, snakeize } from "./utils";
import { Search } from "./search";
import { TinyColor } from "@ctrl/tinycolor";
import { ItemData, Upload, AssetData } from "./Upload";

type KitIncludes = "use_versions" | "versions" | null;

class Lingo {
  baseURL = "https://api.lingoapp.com/1";
  private spaceId: number | string;
  private auth: string;

  /**
   * Create a new Lingo API client
   * @param spaceId The id of your Lingo space
   * @param token An API token for your space
   */
  constructor(spaceId?: number | string, token?: string) {
    if (spaceId && token) {
      this.setup(spaceId, token);
    }
  }

  /**
   * Set your API auth credentials
   * @param spaceId The id of your Lingo space
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

  async fetchCustomFields(): Promise<CustomField[]> {
    const res = await this.callAPI("GET", "/fields");
    return res.fields;
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
        (item.data.content === headingId || item.uuid === headingId || item.shortId === headingId)
      );
    }
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

  async fetchItemsInGallery(galleryId: string, version = 0, page = 1, limit = 50): Promise<Item[]> {
    const path = `/items/${galleryId}`,
      params = { qs: { v: version, page, limit, include: "items" } };
    const res = await this.callAPI("GET", path, params);
    return res.item.items;
  }

  async fetchAllItemsInGallery(galleryId: string, version = 0): Promise<Item[]> {
    const limit = 200; // API Enforces <= 200
    let page = 1,
      results = [];

    while (true) {
      const items = await this.fetchItemsInGallery(galleryId, version, page, limit);
      results = [...results, ...items];
      if (items.length < limit) {
        return results;
      }
      page += 1;
    }
  }

  /**
   * Create a new search object to build and execute a search query
   * @returns A new search object
   */
  search(): Search {
    return new Search(this.callAPI.bind(this));
  }

  /**
   * Prepare the file and get a url to download it
   *
   * @param id The uuid of the asset
   * @param options The download options (type, dimensions, dpi)
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
   * @param options The download options (type, dimensions, dpi)
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
      return Buffer.from(await res.arrayBuffer());
    }
  }

  /**
   * Fetch a list of changelog events for the asset
   * @param id The id of the asset
   * @returns a list of changelog events
   */
  async fetchAssetChangelog(id: string): Promise<Changelog<Asset>> {
    const path = `/assets/${id}/changelog`;
    const res = await this.callAPI("GET", path);
    return res.changelog;
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
   * @param kitUuid The uuid of the kit to create the section in
   * @param name The name of the section
   * @returns The new section
   */
  async createSection(kitUuid: string, name?: string): Promise<Section> {
    const res = await this.callAPI("POST", "/sections", {
      data: {
        kit_uuid: kitUuid,
        name,
      },
    });
    return res.section;
  }

  private async _createItemWithoutAsset(data: ItemData & { type: ItemType }): Promise<Item> {
    const res = await this.callAPI("POST", "/items", {
      data: snakeize(data),
    });
    return res.item;
  }

  /**
   * Create a new heading
   * @param text The text content of the heading
   * @param data The item data including the kit and section to create the item in
   * @returns The new item
   */
  async createHeading(text: string, data: ItemData): Promise<Item> {
    const _data = merge({}, data, { type: ItemType.Heading, data: { content: text } });
    return this._createItemWithoutAsset(_data);
  }

  /**
   * Create a new inline note
   * @param text The text content of the note
   * @param data The item data including the kit and section to create the item in
   * @returns The new item
   */
  async createNote(text: string, data: ItemData): Promise<Item> {
    const _data = merge({}, data, { type: ItemType.Note, data: { content: text } });
    return this._createItemWithoutAsset(_data);
  }

  /**
   * Create a new code snippet
   * @param content The text content and language of the snippet
   * @param data The item data including the kit and section to create the item in
   * @returns The new item
   */
  async createCodeSnippet(
    content: { text: string; language?: string },
    data: ItemData
  ): Promise<Item> {
    const { text, language } = content;
    const _data = merge({}, data, {
      type: ItemType.CodeSnippet,
      data: { content: text, codeLanguage: language },
    });
    return this._createItemWithoutAsset(_data);
  }

  /**
   * Create a new guide
   * @param content The text, title and file to create with the guide
   * @param data The item data including the kit and section to create the item in
   * @returns The new item
   */
  async createGuide(
    content: {
      text: string;
      title: "Do" | "Don't";
      file?: string;
    },
    data: ItemData
  ): Promise<Item> {
    const { text, title, file } = content;
    const color = { Do: "green", "Don't": "red" }[title];
    if (!color) {
      throw new LingoError(
        LingoError.Code.InvalidParams,
        "Invalid guide title. Must be Do or Don't"
      );
    }

    const _data = merge({}, data, { type: ItemType.Guide, data: { content: text, title, color } });

    if (!file) {
      // Create the text based item
      return await this._createItemWithoutAsset(
        merge(_data, { displayProperties: { displayStyle: "text_only" } })
      );
    }
    const { item } = await this._createFileAsset(
      file,
      {},
      merge(_data, { displayProperties: { displayStyle: "image" } })
    );
    return item;
  }

  /**
   * @deprecated Support content is unavailable for spaces migrated to our latest architecture. Use createBanner instead.
   * @param file A filepath for a PNG, JPG, or supported image file
   * @param item Item data specifying where to place the banner (kitId, sectionId)
   * @returns The new item
   */
  async createSupportingContent(file: string, item: ItemData): Promise<Item> {
    console.warn("Support content has been deprecated. Please use createBanner");
    const _item = merge({}, item, { type: ItemType.SupportingContent });
    const { item: newItem } = await this._createFileAsset(file, {}, _item);
    return newItem;
  }

  /**
   * Create a banner image asset. Banners are displayed full-width without metadata or download options.
   * @param file A filepath for a PNG, JPG, or supported image file
   * @param item Item data specifying where to place the banner (kitId, sectionId)
   * @returns The new item and asset
   */
  async createBanner(file: string, item: ItemData): Promise<Item> {
    const _item = merge({}, item, {
      type: ItemType.Asset,
      displayProperties: {
        size: 1,
        showMetadata: false,
        allowDownload: false,
      },
    });
    const res = this._createFileAsset(file, {}, _item);
    return (await res).item;
  }

  /**
   * Create a color asset
   * @param color A color string. See TinyColor for supported formats (hex, rgb, hsl, etc.)
   * @param data Additional asset metadata (name, notes, keywords)
   * @param item Optional item data to add the asset to a kit
   */
  async createColorAsset(
    color: string,
    data?: Omit<AssetData, "type">,
    item?: ItemData
  ): Promise<{ asset?: Asset; item?: Item }> {
    const c = new TinyColor(color);
    const hsv = c.toHsv();
    if (!c.isValid) {
      throw Error(`Invalid color: ${color}`);
    }

    const _item = item ? { ...item, type: ItemType.Asset } : undefined;
    const { dateAdded, dateUpdated, ...otherData } = data ?? {};
    const assetData = {
      ...otherData,
      dateAdded: formatDate(dateAdded),
      dateUpdated: formatDate(dateUpdated),
      item: _item,
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
      data: snakeize(assetData),
    });
    return res;
  }

  /**
   * Create a link (URL) asset
   * @param url The URL for the link asset
   * @param data Additional asset metadata (name, notes, keywords)
   * @param item Optional item data to add the asset to a kit
   */
  async createLinkAsset(
    url: string,
    data?: Omit<AssetData, "type">,
    item?: ItemData
  ): Promise<{ asset?: Asset; item?: Item }> {
    const _item = item ? { ...item, type: ItemType.Asset } : undefined;
    const { dateAdded, dateUpdated, ...otherData } = data ?? {};
    const assetData = {
      url,
      ...otherData,
      dateAdded: formatDate(dateAdded),
      dateUpdated: formatDate(dateUpdated),
      item: _item,
      type: AssetType.URL,
    };

    const res = await this.callAPI("POST", "/assets", {
      data: snakeize(assetData),
    });
    return res;
  }

  /**
   * Validate asset data to ensure it is valid for uploading
   *
   * @param file a filepath
   * @param data An object with additional optional metadata
   * @returns The validated asset metadata
   */
  async validateAsset(
    file: string,
    data?: { type?: AssetType }
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
   * @param data An object with additional optional metadata
   * @param item Optional item data to add the asset to a kit
   * ```
   * data = {
   *  name: "",
   *  notes: "",
   *  keywords: "",
   * }
   * item: {
   *    kitId: "",
   *    sectionId: "",
   *    display_order: "append|prepend|before:uuid|after:uuid
   *  }
   * ```
   *
   * @returns The new item and/or asset. If an item is provided the item will be returned, otherwise the asset will be returned
   */
  async createFileAsset(
    file: string,
    data?: AssetData,
    item?: ItemData
  ): Promise<{ item?: Item; asset?: Asset }> {
    const _item = item ? { ...item, type: ItemType.Asset } : null;
    return await this._createFileAsset(file, data, _item);
  }

  private async _createFileAsset(
    file: string,
    data?: AssetData,
    item?: ItemData & { type: ItemType }
  ): Promise<{ item?: Item; asset?: Asset }> {
    const upload = new Upload(file, data, this.callAPI.bind(this));
    return await upload.upload(item);
  }

  // MARK : Direct Links
  // -------------------------------------------------------------------------------
  /**
   *
   * @param assetId The identifier of the asset to fetch direct links for
   * @returns An array of direct links
   */
  async getDirectLinksForAsset(assetId: string): Promise<DirectLink[]> {
    const res = await this.callAPI("GET", `/assets/${assetId}/direct_links`);
    return res.directLinks;
  }

  /**
   *
   * @param assetId The asset identifier to create a direct link for
   * @param name The name of the direct link
   * @returns The newly created direct link
   */
  async createDirectLink(assetId: string, name?: string): Promise<DirectLink> {
    const res = await this.callAPI("POST", `/assets/${assetId}/direct_links`, {
      data: { name },
    });
    return res.directLink;
  }

  // MARK : Making Requests
  // -------------------------------------------------------------------------------
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  private requestParams(method: string, path: string, options?: any): any {
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

    const contentType = formData ? null : headers?.["content-type"] ?? "application/json";
    if (headers?.["content-type"]) {
      delete headers["content-type"];
    }
    return {
      url,
      method,
      body,
      headers: {
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...headers,
        "x-lingo-client": "LingoJS",
        Authorization: this.auth,
      },
      ...rest,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async callAPI(method: string, path: string, options = {}): Promise<any> {
    if (!this.auth) {
      throw new LingoError(
        LingoError.Code.Unauthorized,
        "Lingo API credentials not configured. Call setup(spaceId, token) or pass credentials to the constructor."
      );
    }
    const { url, ..._options } = this.requestParams(method, path, options);
    const response = await fetch(url, _options);

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error(text);
      throw parseError;
    }
    return parseJSONResponse(json as Record<string, unknown>);
  }
}

export default Lingo;
