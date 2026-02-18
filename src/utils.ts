import fs from "fs";
import path from "path";
import LingoError from "./lingoError";
import btoa from "btoa";
import { ItemData } from "./Upload";
import { ItemType } from "./types";

function isUUID(str: string) {
  const uuidPattern = "^(X{8}-X{4}-4X{3}-[89abAB]X{3}-X{12})".replace(/X/g, "[0-9A-F]");
  const match = str.match(uuidPattern) || [];
  return match && match[1];
}

export function parseIdentifier(identifier: string): string {
  if (!identifier) return identifier;
  // UUID
  if (isUUID(identifier)) return identifier;
  // Parse named short id
  return identifier.split("-").pop();
}

export function prepareItemData(
  itemData: ItemData,
  type: ItemType
): ItemData & { type: ItemType; itemUuid: string } {
  if (!itemData) return undefined;
  const { galleryUuid, ...rest } = itemData;
  return {
    type,
    itemUuid: galleryUuid,
    ...rest,
  };
}

export function parseFilePath(filePath: string): { filename: string; extension: string } {
  const extension = path.extname(filePath),
    filename = path.basename(filePath, extension);
  return { filename, extension: extension.replace(".", "") };
}

export function resolveFilePath(filePath: string): string {
  if (filePath && filePath.startsWith(".")) {
    return path.resolve(process.cwd(), filePath);
  }
  return filePath;
}

type UploadData = {
  name: string;
  type: string;
};

export function getUploadData(
  file: string,
  data?: Partial<UploadData>
): { file: fs.ReadStream; metadata: UploadData } {
  const filePath = resolveFilePath(file),
    { filename, extension } = parseFilePath(file),
    name = data?.name || filename,
    type = data?.type || extension;

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch {
    throw new LingoError(LingoError.Code.FileNotValid, `Unable to access asset file: ${file}`);
  }
  const fileData = fs.createReadStream(filePath);

  if (!type) {
    throw new LingoError(
      LingoError.Code.InvalidParams,
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

type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? `_${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `${Head}${CamelToSnake<Tail>}`
  : S;

type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
  : S;

type SnakeKeys<T> =
  T extends Array<infer U>
    ? SnakeKeys<U>[]
    : T extends object
      ? { [K in keyof T as K extends string ? CamelToSnake<K> : K]: SnakeKeys<T[K]> }
      : T;

type CamelKeys<T> =
  T extends Array<infer U>
    ? CamelKeys<U>[]
    : T extends object
      ? { [K in keyof T as K extends string ? SnakeToCamel<K> : K]: CamelKeys<T[K]> }
      : T;

function transformKeys(object: unknown, convertKey: (str: string) => string): unknown {
  if (!object) return object;
  if (Array.isArray(object)) {
    return object.map(val => transformKeys(val, convertKey));
  }
  if (typeof object === "object") {
    return Object.keys(object).reduce(
      (acc, key) => {
        acc[convertKey(key)] = transformKeys((object as Record<string, unknown>)[key], convertKey);
        return acc;
      },
      {} as Record<string, unknown>
    );
  }
  return object;
}

const toCamelCase = (str: string): string =>
  str.replace(/([-_][a-z0-9])/g, group => group.toUpperCase().replace("-", "").replace("_", ""));

const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

function camelize<T>(object: T): CamelKeys<T> {
  return transformKeys(object, toCamelCase) as CamelKeys<T>;
}

export function snakeify<T>(object: T): SnakeKeys<T> {
  return transformKeys(object, toSnakeCase) as SnakeKeys<T>;
}

export function formatDate(date?: Date): number {
  if (!date) return undefined;
  return date.getTime() / 1000;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseJSONResponse(body: Record<string, unknown>): any {
  if (body.success === true) {
    return camelize(body.result);
  } else if (body.success === false) {
    throw LingoError.from(body.error);
  } else {
    console.error("Response is missing success flag " + body);
    throw new LingoError(LingoError.Code.Unknown, "Unexpected server response");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encodeUnicode(value: any): string {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  let str = value;
  if (typeof value !== "string") str = JSON.stringify(str);
  function toSolidBytes(_match, p1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return String.fromCharCode(`0x${p1}` as any);
  }
  const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, toSolidBytes);
  return btoa(binary);
}

export async function retry<T>(action: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i + 1 > retries) {
        throw error;
      }
    }
  }
}
