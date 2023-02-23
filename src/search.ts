import lingo from ".";
import { SearchResult } from "./types";
import { encodeUnicode } from "./utils";

type QueryContext = "global" | "library";
type QueryType = "content" | "jump_to" | "assets" | "tags";
type Sort = "relevance" | "type" | "alpha" | "recent";

/**
 * The search ass is used to build and execute search queries.
 *
 * You can build a query then call `fetch` multiple times calling either `nextPage` or updating the offset manually to fetch multiple pages of results.
 *
 * ## Example
 * ```
 * async function fetchAllLogos() {
 *   const search = lingo.search().matchingKeyword("logo").ofType("SVG");
 *   const results: Item[] = [];
 *   while (true) {
 *     const result = await search.fetch();
 *     const newItems = result.results.map(match => match.object as Item);
 *     results.push(...newItems);
 *     if (newItems.length < result.limit) {
 *       return results;
 *     }
 *     search.nextPage();
 *   }
 * }
 * ```
 */
export class Search {
  _filters = [];
  _context: QueryContext = "global";
  _queryType: QueryType = "content";
  _sort: string;
  _offset = 0;
  _limit = 50;

  /**
   * Execute the search request. This can be called multiple times on the same Search object.
   * @returns A primise which resolves with the results
   */
  async fetch(): Promise<SearchResult> {
    const path = "/search",
      params = encodeUnicode({
        context: this._context,
        type: this._queryType,
        filters: this._filters,
        sort: this._sort,
        limit: this._limit,
        offset: this._offset,
      });
    return await lingo.callAPI("GET", path, { qs: { query: params } });
  }

  // Context
  /*-------------------------------------------------------------------------------*/

  // Query Type
  /*-------------------------------------------------------------------------------*/
  /**
   * Search all assets in the library
   * @returns The chainable search object
   */
  assets(): Search {
    this._context = "library";
    this._queryType = "assets";
    return this;
  }

  /**
   * Search all tags in the library
   * @returns The chainable search object
   */
  tags(): Search {
    this._context = "library";
    this._queryType = "tags";
    return this;
  }
  /**
   * Restrict results to content such as notes, guides, and assets. (default)
   * @returns The chainable search object
   */
  content(): Search {
    this._context = "global";
    this._queryType = "content";
    return this;
  }
  /**
   * Restrict results to kits
   * @returns The chainable search object
   */
  kits(): Search {
    this._context = "global";
    this._queryType = "jump_to";
    return this.ofType("kit");
  }
  /**
   * Restrict results to sections
   * @returns The chainable search object
   */
  sections(): Search {
    this._context = "global";
    this._queryType = "jump_to";
    return this.ofType("section");
  }

  /**
   * Restrict results to headings
   * @returns The chainable search object
   */
  headings(): Search {
    this._context = "global";
    this._queryType = "jump_to";
    return this.ofType("heading");
  }

  // Options
  /*-------------------------------------------------------------------------------*/
  /**
   *
   * @param sort A property to sort by (relevance, type, alpha or recent)
   * @param reverse If the sort should be reversed
   * @returns The chainable search object
   */
  sortBy(sort: Sort, reverse = false): Search {
    if (sort == "relevance" && reverse) {
      throw Error("Relevance sort cannot be reversed");
    }
    this._sort = reverse ? `-${sort}` : sort;
    return this;
  }

  limit(value: number): Search {
    this._limit = value;
    return this;
  }

  offset(value: number): Search {
    this._offset = value;
    return this;
  }

  /**
   * Adjust the offset to the next page based on the current limit
   * @returns The chainable search object
   */
  nextPage(): Search {
    return this.offset(this._offset + this._limit);
  }

  // Filters
  /*-------------------------------------------------------------------------------*/

  /**
   * Restricts results to a give kit. If called multiple times the query will use an OR operator for all provided kits.
   * @param id The id of a kit
   * @param version The version of a kit to search (defaults to the recommended version)
   * @returns The chainable search object
   */
  inKit(id: string, version = 0): Search {
    this._filters.push({
      type: "kit",
      kit_uuid: id,
      version,
    });
    return this;
  }

  /**
   * * Restricts results to a given section. If called multiple times the query will use an OR operator for all provided sections.
   * @param id The id of a section
   * @param version The version of the section to search (defaults)
   * @returns The chainable search object
   */
  // TODO:
  /*
  inSection(id: string, version = 0): Search {
    this._filters.push({
      type: "section",
      value: id,
      uuid: id,
      version,
    });
    return this;
  }
  */

  /**
   * Restrict content results to a particular type
   *
   * This can be an item type like `guide` or `notes`, an asset type such as `SVG`, or an abstract type like `documents` or `animations`.
   *
   * @param type The desired type of results
   * @returns The chainable search object
   */
  ofType(type: string): Search {
    this._filters.push({
      type: "type",
      value: type,
    });
    return this;
  }

  /**
   * Filter results that match a given keyword. Keywords are matched again the name, notes/description and tags.
   * @param keyword A keyword
   * @returns The chainable search object
   */
  matchingKeyword(keyword: string): Search {
    this._filters.push({
      type: "keyword",
      value: keyword,
    });
    return this;
  }

  /**
   * Similar to `matchingKeyword` but only performs exact matches on asset tags
   * @param tag
   * @returns The chainable search object
   */
  withTag(tag: string): Search {
    this._filters.push({
      type: "tag",
      value: tag,
    });
    return this;
  }

  /**
   * Restrict asset results to a desired orientation
   * @param orientation An orientation
   * @returns The chainable search object
   */
  orientation(orientation: "vertical" | "horizontal" | "square"): Search {
    this._filters.push({
      type: "orientation",
      value: orientation,
    });
    return this;
  }

  /**
   * Find results created on a specific date or within a date range. Provide either `execlty` or `before` and `after` to specify a range.
   * @param exactly File assets created on a specific date
   * @param before File assets created before a date
   * @param after File assets created after a date
   * @returns The chainable search object
   */
  createdAt(dates: {
    before?: string | Date;
    after?: string | Date;
    exactly?: string | Date;
  }): Search {
    function formatDate(date: string | Date): string {
      if (date instanceof Date) {
        const d = date as Date;
        return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()].join("-");
      }
      return date;
    }

    if (dates.exactly) {
      this._filters = this._filters.filter(f => f.type !== "date");
      this._filters.push({
        type: "date",
        operator_values: {
          eq: formatDate(dates.exactly),
        },
      });
    } else if (dates.before || dates.after) {
      this._filters = this._filters.filter(f => f.type !== "date");
      this._filters.push({
        type: "date",
        operator_values: {
          gte: formatDate(dates.after),
          lte: formatDate(dates.before),
        },
      });
    }

    return this;
  }

  private created(relation: "before" | "after", value: Date | string | number): Search {
    if (typeof value === "number") {
      this._filters.push({ type: relation, period: "day", length: value });
    } else if (typeof value === "string") {
      this._filters.push({ type: relation, date: value });
    } else if (value instanceof Date) {
      const d = value as Date;
      const date = [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()].join("-");
      this._filters.push({ type: relation, date });
    } else {
      throw Error("Invalid date property");
    }
    return this;
  }

  /**
   * Find results created after a given date.
   * @param value A Date object, a date string (yyyy-mm-dd), or a number of days previous to now
   * @returns The chainable search object
   *
   * @deprecated Use `createdAt` instead
   */
  after(value: Date | string | number): Search {
    return this.created("after", value);
  }

  /**

   * Find results created before a given date.
   * @param value A Date object, a date string (yyyy-mm-dd), or a number of days previous to now
   * @returns The chainable search object
   *
   * @deprecated Use `createdAt` instead
   */
  before(value: Date | string | number): Search {
    return this.created("before", value);
  }
}
