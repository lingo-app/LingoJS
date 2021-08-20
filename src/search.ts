export class SearchBuilder {
  filters = [];

  inKit(id: string, version = 0): SearchBuilder {
    this.filters.push({
      type: "kit",
      value: id,
      kit_uuid: id,
      version,
    });
    return this;
  }

  inSection(id: string, version = 0): SearchBuilder {
    this.filters.push({
      type: "section",
      value: id,
      uuid: id,
      version,
    });
    return this;
  }

  /**
   * @param type An item type, asset type or abstract type like documents or images.
   * @returns The search builder
   */
  type(type: string): SearchBuilder {
    this.filters.push({
      type: "type",
      value: type,
    });
    return this;
  }

  matchingKeyword(keyword: string): SearchBuilder {
    this.filters.push({
      type: "keyword",
      value: keyword,
    });
    return this;
  }

  withTag(tag: string): SearchBuilder {
    this.filters.push({
      type: "tag",
      value: tag,
    });
    return this;
  }

  orientation(orientation: "vertical" | "horizontal" | "square"): SearchBuilder {
    this.filters.push({
      type: "orientation",
      value: orientation,
    });
    return this;
  }

  created(relation: "before" | "after", value: Date | string | number): SearchBuilder {
    if (typeof value === "number") {
      this.filters.push({ type: relation, period: "days", length: value });
    } else if (typeof value === "string") {
      this.filters.push({ type: relation, date: value });
    } else if (value instanceof Date) {
      const d = value as Date;
      const date = [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()].join("-");
      this.filters.push({ type: relation, date });
    } else {
      throw Error("Invalid date property");
    }
    return this;
  }

  after(value: Date | string | number): SearchBuilder {
    return this.created("after", value);
  }

  before(value: Date | string | number): SearchBuilder {
    return this.created("before", value);
  }
}
