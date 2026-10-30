import {
  Product,
  ProductCreateData,
  ProductFieldsInput,
  ProductList,
  ProductStatus,
  ProductTypeCreateData,
  ProductTypeField,
  ProductTypeFieldData,
  ProductTypeFieldUpdateData,
  ProductTypeUpdateData,
  ProductUpdateData,
  VariantData,
} from "./types";
import { encodeUnicode, snakeify } from "./utils";
import { CallAPI } from "./search";

export type ProductSort =
  | "name"
  | "product_type"
  | "date_added"
  | "date_updated"
  | "options"
  | "variants"
  | "markets";

type EmptyOperator = "is_set" | "is_empty";
type TextOperator = "contains" | EmptyOperator;
type NumberOperator = "eq" | "gt" | "gte" | "lt" | "lte" | EmptyOperator;
type DateOperator = "eq" | "before" | "after" | EmptyOperator;
type SelectOperator = "in" | EmptyOperator;

const MAX_LIMIT = 200;

/**
 * Builds and executes a product listing query.
 *
 * ## Example
 * ```
 * const { products, total } = await lingo
 *   .products()
 *   .ofType(productTypeUuid)
 *   .whereText(colorFieldUuid, "contains", "Blue")
 *   .includeVariants()
 *   .fetch();
 * ```
 */
export class ProductQuery {
  private _callAPI: CallAPI;
  _filters: Record<string, unknown>[] = [];
  _status: ProductStatus | undefined;
  _productTypeUuid: string | undefined;
  _sort: string | undefined;
  _includeVariants = false;
  _page = 1;
  _limit = 50;

  constructor(callAPI: CallAPI) {
    this._callAPI = callAPI;
  }

  /**
   * Execute the query. Can be called repeatedly, e.g. after `nextPage`.
   */
  async fetch(): Promise<ProductList> {
    const qs: Record<string, string | number> = { page: this._page, limit: this._limit };
    if (this._status) qs.status = this._status;
    if (this._productTypeUuid) qs.product_type_uuid = this._productTypeUuid;
    if (this._sort) qs.sort = this._sort;
    if (this._includeVariants) qs.include = "variants";
    if (this._filters.length) qs.filters = encodeUnicode(this._filters);
    const res = await this._callAPI("GET", "/products", { qs });
    return { products: res.products, total: res.total };
  }

  /**
   * Fetch every matching product, paging automatically.
   */
  async fetchAll(): Promise<Product[]> {
    const limit = this._limit;
    const page = this._page;
    this._limit = MAX_LIMIT;
    this._page = 1;
    let results: Product[] = [];
    try {
      while (true) {
        const { products } = await this.fetch();
        results = [...results, ...products];
        if (products.length < MAX_LIMIT) return results;
        this._page += 1;
      }
    } finally {
      this._limit = limit;
      this._page = page;
    }
  }

  // Options
  /*-------------------------------------------------------------------------------*/

  /** Only products of the given product type */
  ofType(productTypeUuid: string): ProductQuery {
    this._productTypeUuid = productTypeUuid;
    return this;
  }

  /** Only active (default) or archived products */
  status(status: "active" | "archived"): ProductQuery {
    this._status = status;
    return this;
  }

  /** Include each product's variants in the response */
  includeVariants(include = true): ProductQuery {
    this._includeVariants = include;
    return this;
  }

  sortBy(sort: ProductSort, reverse = false): ProductQuery {
    this._sort = reverse ? `-${sort}` : sort;
    return this;
  }

  page(value: number): ProductQuery {
    this._page = value;
    return this;
  }

  /** The number of products per page, up to 200 */
  limit(value: number): ProductQuery {
    this._limit = Math.min(value, MAX_LIMIT);
    return this;
  }

  nextPage(): ProductQuery {
    return this.page(this._page + 1);
  }

  // Filters
  /*-------------------------------------------------------------------------------*/

  /** Products whose name, or any variant's name, contains the text */
  matchingName(value: string): ProductQuery {
    this._filters.push({ type: "name", value });
    return this;
  }

  /** Products assigned to a market, or with no market when `null` is passed */
  inMarket(marketUuid: string | null): ProductQuery {
    this._filters.push(
      marketUuid === null
        ? { type: "market", is_null: true }
        : { type: "market", market_uuid: marketUuid }
    );
    return this;
  }

  whereText(fieldUuid: string, operator: TextOperator, value?: string): ProductQuery {
    this._filters.push({ type: "field-text", field_uuid: fieldUuid, operator, value });
    return this;
  }

  /** Send numbers as strings to avoid float precision loss. Use `between` with `value2`. */
  whereNumber(
    fieldUuid: string,
    operator: NumberOperator | "between",
    value?: string | number,
    value2?: string | number
  ): ProductQuery {
    this._filters.push({ type: "field-number", field_uuid: fieldUuid, operator, value, value2 });
    return this;
  }

  whereBoolean(fieldUuid: string, value: boolean | EmptyOperator): ProductQuery {
    const token: Record<string, unknown> = { type: "field-boolean", field_uuid: fieldUuid };
    if (typeof value === "boolean") {
      token.operator = "eq";
      token.value = value;
    } else {
      token.operator = value;
    }
    this._filters.push(token);
    return this;
  }

  /** Dates are ISO strings (yyyy-mm-dd). Use `between` with `value2`. */
  whereDate(
    fieldUuid: string,
    operator: DateOperator | "between",
    value?: string,
    value2?: string
  ): ProductQuery {
    this._filters.push({ type: "field-date", field_uuid: fieldUuid, operator, value, value2 });
    return this;
  }

  whereSelect(fieldUuid: string, operator: SelectOperator, optionUuids?: string[]): ProductQuery {
    this._filters.push({
      type: "field-select",
      field_uuid: fieldUuid,
      operator,
      option_uuids: optionUuids,
    });
    return this;
  }

  /** `match` controls whether any or all of the options must be selected */
  whereMultiselect(
    fieldUuid: string,
    operator: SelectOperator,
    optionUuids?: string[],
    match: "any" | "all" = "any"
  ): ProductQuery {
    this._filters.push({
      type: "field-multiselect",
      field_uuid: fieldUuid,
      operator,
      option_uuids: optionUuids,
      match,
    });
    return this;
  }
}

// Write payloads
/*-------------------------------------------------------------------------------*/

type Body = Record<string, unknown>;

function assign(body: Body, key: string, value: unknown): void {
  if (value !== undefined) body[key] = value;
}

/** Field values pass through verbatim except asset entries, which the API reads as `asset_uuid` */
function fieldsBody(fields?: ProductFieldsInput): Body | undefined {
  if (!fields) return undefined;
  const result: Body = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === "object" && "assets" in value && Array.isArray(value.assets)) {
      result[key] = {
        ...value,
        assets: value.assets.map(asset => ({
          asset_uuid: asset.assetUuid,
          display_order: asset.displayOrder,
          inherited: asset.inherited,
        })),
      };
    } else if (Array.isArray(value) && value.length && typeof value[0] === "object") {
      result[key] = (value as { assetUuid: string }[]).map(asset => ({
        asset_uuid: asset.assetUuid,
      }));
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function variantBody(data: VariantData): Body {
  const body: Body = {};
  assign(body, "uuid", data.uuid);
  assign(body, "fields", fieldsBody(data.fields));
  assign(body, "availability", data.availability);
  assign(body, "market_uuid", data.marketUuid);
  assign(body, "display_order", data.displayOrder);
  return body;
}

export function productBody(data: ProductCreateData | ProductUpdateData): Body {
  const body: Body = {};
  const create = data as ProductCreateData;
  const update = data as ProductUpdateData;
  assign(body, "product_type_uuid", create.productTypeUuid);
  assign(body, "fields", fieldsBody(data.fields));
  assign(body, "market_uuid", data.marketUuid);
  assign(body, "status", update.status);
  assign(
    body,
    "options",
    update.options?.map(option => ({ field_uuid: option.fieldUuid }))
  );
  assign(body, "variants", update.variants?.map(variantBody));
  return body;
}

const FIELD_KEYS = [
  "uuid",
  "name",
  "identifier",
  "fieldType",
  "required",
  "displayOrder",
  "options",
  "config",
] as const;

/** Picks the writable keys, so a fetched field can be sent back as is */
export function fieldBody(
  data: ProductTypeFieldData | ProductTypeFieldUpdateData | ProductTypeField
): Body {
  const field: Body = {};
  for (const key of FIELD_KEYS) {
    const value = (data as Record<string, unknown>)[key];
    if (value === undefined) continue;
    field[key] =
      key === "options" && Array.isArray(value)
        ? value.map(option =>
            typeof option === "string"
              ? option
              : { uuid: option.uuid, value: option.value, label: option.label }
          )
        : value;
  }
  return snakeify(field) as Body;
}

export function productTypeBody(data: ProductTypeCreateData | ProductTypeUpdateData): Body {
  const body: Body = {};
  assign(body, "name", data.name);
  assign(body, "description", data.description);
  assign(body, "fields", data.fields?.map(fieldBody));
  return body;
}
