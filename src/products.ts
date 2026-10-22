import { Product, ProductList, ProductStatus } from "./types";
import { encodeUnicode } from "./utils";
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
