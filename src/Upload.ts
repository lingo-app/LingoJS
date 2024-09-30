import fs from "fs";
import FormData from "form-data";
import _merge from "lodash/merge";
import lingo from ".";
import LingoError from "./lingoError";
import { AssetType, ItemData, ItemType } from "./types";
import { formatDate, parseFilePath, parseJSONResponse, resolveFilePath, retry } from "./utils";

export type UploadData = {
  name?: string;
  type?: AssetType;
  notes?: string;
  keywords?: string;
  dateAdded?: Date;
  dateUpdated?: Date;
};

export type AssetItem = {
  kitId: string;
  sectionId: string;
  displayOrder?: string | number;
};

const MAX_UNCHUNKED_UPLOAD_SIZE = 20000000;
const MAX_UPLOAD_CHUNK_SIZE = 10000000;

export class Upload {
  size: number;
  filePath: string;
  assetData: UploadData;

  constructor(file: string, data: UploadData) {
    const filePath = resolveFilePath(file),
      { filename, extension } = parseFilePath(file),
      name = data?.name || filename,
      type = data?.type || extension;

    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch {
      throw new LingoError(LingoError.Code.FileNotValid, `Unable to access asset file: ${file}`);
    }

    if (!type) {
      throw new LingoError(
        LingoError.Code.InvalidParams,
        "Unable to determine file type from path. Provide type in the data object or provide a filename a valid extension"
      );
    }
    // const fileData = fs.createReadStream(filePath);

    this.filePath = filePath;
    // Get the size
    const status = fs.statSync(filePath);
    this.size = status.size;

    // Merge the data
    const json = _merge({}, { name, type }, data, {
      date_added: formatDate(data?.dateAdded),
      date_updated: formatDate(data?.dateUpdated),
    });

    const fonts = ["TTF", "OTF", "WOFF", "WOFF2"];
    if (fonts.includes(json.type.toUpperCase())) {
      json.type = AssetType.TextStyle;
      _merge(json, {
        meta: {
          font: { extension: type },
        },
      });
    }
    this.assetData = json;
  }

  async upload(item?: AssetItem & { type?: ItemType; data?: ItemData }) {
    const json: Record<string, unknown> = { ...this.assetData };
    if (item) {
      json.item = {
        type: item.type ?? "asset",
        kit_uuid: item.kitId,
        section_uuid: item.sectionId,
        display_order: item.displayOrder,
        data: item.data,
      };
    }

    if (this.size > MAX_UNCHUNKED_UPLOAD_SIZE) {
      const uploadId = await this.startUploadSession();
      await this.uploadChunks(uploadId, this.size);
      await this.completeUploadSession(uploadId, this.size);
      json.upload_id = uploadId;
      return await this.callApi("POST", "/assets", {
        data: json,
      });
    } else {
      const formData = new FormData();
      const fileData = fs.createReadStream(this.filePath);
      formData.append("asset", fileData);
      formData.append("json", JSON.stringify(json));

      return await this.callApi("POST", "/assets", {
        headers: formData.getHeaders(),
        formData,
      });
    }
  }

  private async callApi(method: string, path: string, options = {}) {
    return await retry(async () => {
      return await lingo.callAPI(method, path, options);
    }, 2);
  }

  // Returns the upload ID,
  private async startUploadSession(): Promise<string> {
    const { uploadId } = await this.callApi("POST", "/upload_session/start");
    return uploadId;
  }

  private async uploadChunks(uploadId: string, size: number) {
    const chunkCount = Math.ceil(size / MAX_UPLOAD_CHUNK_SIZE);
    for (let idx = 0; idx < chunkCount; idx += 1) {
      await this.appendUploadSession(uploadId, idx + 1);
    }
  }

  // Appends a chunk to an upload session
  private async appendUploadSession(uploadId: string, chunkNumber: number) {
    const data = JSON.stringify({
        upload_id: uploadId,
        chunk_number: chunkNumber,
      }),
      startByte = MAX_UPLOAD_CHUNK_SIZE * (chunkNumber - 1),
      blob = fs.createReadStream(this.filePath, {
        start: startByte,
        end: startByte + MAX_UPLOAD_CHUNK_SIZE - 1,
      }),
      formData = new FormData();
    formData.append("chunk", blob);
    formData.append("json", data);

    return await this.callApi("POST", "/upload_session/append", {
      headers: formData.getHeaders(),
      formData,
    });
  }

  // completes and upload session
  async completeUploadSession(uploadId: string, size: number) {
    return await this.callApi("POST", "/upload_session/complete", {
      data: {
        upload_id: uploadId,
        size,
      },
    });
  }
}
