/**
 * The integration tests makes actual API calls
 * This is intended for use in development environments only
 */

import { ReadStream } from "fs";
import { strict as assert } from "assert";
import lingo, { AssetType, ItemType, LingoError } from "../src/index";
import {
  getUploadData,
  parseFilePath,
  resolveFilePath,
  parseJSONResponse,
  retry,
} from "../src/utils";

describe("Library exports", () => {
  it("Makes the Error object availble", () => {
    expect(LingoError.Code.Unknown).toEqual(1);
  });

  it("Makes the type objects availble", () => {
    expect(ItemType.Heading).toEqual("heading");
    expect(AssetType.JPG).toEqual("JPG");
  });
});

describe("Retry", () => {
  it("Should not retry if retries is 0", async () => {
    const action = jest.fn();
    action.mockImplementation(() => {
      throw new Error("Fail");
    });

    expect(async () => {
      await retry(action, 0);
    }).rejects.toThrow();
    expect(action).toHaveBeenCalledTimes(1);
  });
  it("Should throw after reties", async () => {
    const action = jest.fn();
    action.mockImplementation(() => {
      throw new Error("Fail");
    });

    expect(async () => await retry(action, 2)).rejects.toThrow();
    expect(action).toHaveBeenCalledTimes(3);
  });

  it("Should throw after max retries", async () => {
    let count = 0;
    const action = jest.fn();
    action.mockImplementation(() => {
      count++;
      if (count > 1) {
        return "Success";
      } else {
        throw new Error("Fail");
      }
    });

    const result = await retry(action, 2);
    expect(action).toHaveBeenCalledTimes(2);
    expect(result).toEqual("Success");
  });
});
describe("File utils", () => {
  const fileName = "Logo.svg";

  it("should parse the file url", () => {
    const { filename, extension } = parseFilePath("/path/to/" + fileName);
    expect(filename).toEqual("Logo");
    expect(extension).toEqual("svg");
  });

  it("should return path if already resolved", () => {
    const expected = process.cwd() + "/" + fileName;
    const filePath = resolveFilePath(expected);
    expect(filePath).toEqual(expected);
  });

  it("should resolve relative path to cwd", () => {
    const filePath = resolveFilePath("./" + fileName);
    const expected = process.cwd() + "/" + fileName;
    expect(filePath).toEqual(expected);
  });

  it("should resolve relative path with directory", () => {
    const filePath = resolveFilePath("./files/" + fileName);
    const expected = process.cwd() + "/files/" + fileName;
    expect(filePath).toEqual(expected);
  });

  it("should resolve relative path with parent directory", () => {
    const filePath = resolveFilePath("../" + fileName);
    const dir = process.cwd().split("/");
    dir.pop();
    const expected = dir.join("/") + "/" + fileName;
    expect(filePath).toEqual(expected);
  });

  it("should load file and determine upload data", () => {
    const filePath = __dirname + "/" + fileName;
    const { file, metadata } = getUploadData(filePath);
    assert(file instanceof ReadStream, `Expected file to be a buffer ${file}`);
    expect(metadata).toEqual({
      name: "Logo",
      type: "svg",
    });
  });

  it("should validate the file", async () => {
    const filePath = __dirname + "/" + "Logo.svg";
    const { name, type } = await lingo.validateAsset(filePath);
    expect(name).toEqual("Logo");
    expect(type).toEqual("svg");
  });

  it("should fail to validate the invalid file", async () => {
    const filePath = __dirname + "/not-" + fileName;
    try {
      // console.log("Checking file");
      await lingo.validateAsset(filePath);
      // console.log("Checked");
      throw new Error("Expected to fail");
    } catch (e) {
      // console.log("Catch", e);
      assert.match(e.message, /Unable to access asset file/);
      // console.log("Done");
      // faile  d as expected
    }
  });
});

describe("JSON response parsing", () => {
  it("Should throw if success is false", () => {
    assert.throws(() =>
      parseJSONResponse({ success: false, error: { code: 0, message: "Uh Oh!" } })
    );
  });
  it("Should throw if invalid response", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    assert.throws(() => parseJSONResponse({}));
  });

  it("Should camel case keys", () => {
    const res = parseJSONResponse({
      success: true,
      result: { object_id: 1, data: { object_name: "Lingo" } },
    });
    assert.deepEqual(res, { objectId: 1, data: { objectName: "Lingo" } });
  });

  it("Should maintain uuids", () => {
    const res = parseJSONResponse({
      success: true,
      result: { uuid: "321", data: { parent_uuid: "123" } },
    });
    assert.deepEqual(res, { uuid: "321", data: { parentUuid: "123" } });
  });
});

describe("Requests params", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestParams = (lingo as any).requestParams.bind(lingo);

  it("Should append query string if provided", () => {
    const { url } = requestParams("GET", "/", { qs: { key: "value" } });
    assert(url.indexOf("?key=value") > 0, `Url doesn't contain query string ${url}`);
  });

  it("error if data and formData are provided", () => {
    assert.throws(() => requestParams("GET", "/", { data: {}, formData: {} }));
  });

  it("Should stringify json data", () => {
    const data = { key: "value" };
    const { body } = requestParams("GET", "/", { data });
    assert.equal(body, JSON.stringify(data));
  });

  it("Should include a client header", () => {
    const { headers } = requestParams("GET", "/");
    assert.equal(headers["x-lingo-client"], "LingoJS");
  });
});

describe("Search", () => {
  it("Should be a content query by default", () => {
    const search = lingo.search();
    assert.equal(search._queryType, "content");
  });

  it("Should filter to kits", () => {
    const search = lingo.search().kits();
    assert.equal(search._filters[0].type, "type");
    assert.equal(search._filters[0].value, "kit");
    assert.equal(search._queryType, "jump_to");
  });

  it("Should filter to sections", () => {
    const search = lingo.search().sections();
    assert.equal(search._filters[0].type, "type");
    assert.equal(search._filters[0].value, "section");
    assert.equal(search._queryType, "jump_to");
  });

  it("Should filter to headings", () => {
    const search = lingo.search().headings();
    assert.equal(search._filters[0].type, "type");
    assert.equal(search._filters[0].value, "heading");
    assert.equal(search._queryType, "jump_to");
  });

  it("Should set sort by", () => {
    const search = lingo.search().sortBy("recent");
    assert.equal(search._sort, "recent");
  });

  it("Should set sort by reverse", () => {
    const search = lingo.search().sortBy("recent", true);
    assert.equal(search._sort, "-recent");
  });

  it("Should not allow reverse relevance", () => {
    assert.throws(() => lingo.search().sortBy("relevance", true));
  });

  it("Should set limit and offset", () => {
    const search = lingo.search().limit(50).offset(100);
    assert.equal(search._offset, 100);
    assert.equal(search._limit, 50);
  });

  it("Should adjust offset to next page", () => {
    const search = lingo.search().nextPage();
    assert.equal(search._offset, 50);
  });

  it("Should add kit filter", () => {
    const search = lingo.search().inKit("abc", 0);
    assert.deepEqual(search._filters[0], { type: "kit", kit_uuid: "abc", version: 0 });
  });

  it("Should add type filter", () => {
    const search = lingo.search().ofType("SVG");
    assert.deepEqual(search._filters[0], { type: "type", value: "SVG" });
  });

  it("Should add keyword filter", () => {
    const search = lingo.search().matchingKeyword("Logo");
    assert.deepEqual(search._filters[0], { type: "keyword", value: "Logo" });
  });

  it("Should add tag filter", () => {
    const search = lingo.search().withTag("brand");
    assert.deepEqual(search._filters[0], { type: "tag", value: "brand" });
  });

  it("Should add orientation filter", () => {
    const search = lingo.search().orientation("vertical");
    assert.deepEqual(search._filters[0], { type: "orientation", value: "vertical" });
  });

  it("Should add after filter with Date", () => {
    const search = lingo.search().after(new Date());
    assert.equal(search._filters[0].type, "after");
    assert.match(search._filters[0].date, /\d\d\d\d-\d\d?-\d\d?/);
  });

  it("Should add after filter with string", () => {
    const search = lingo.search().after("2020-05-20");
    assert.equal(search._filters[0].type, "after");
    assert.equal(search._filters[0].date, "2020-05-20");
  });

  it("Should add after filter relative number of days", () => {
    const search = lingo.search().after(30);
    expect(search._filters[0].type).toEqual("after");
    expect(search._filters[0].period).toEqual("day");
    expect(search._filters[0].length).toEqual(30);
  });

  it("Should add before filter with Date", () => {
    const search = lingo.search().before(new Date());
    assert.equal(search._filters[0].type, "before");
    assert.match(search._filters[0].date, /\d\d\d\d-\d\d?-\d\d?/);
  });

  it("Should add before filter with string", () => {
    const search = lingo.search().before("2020-05-20");
    assert.equal(search._filters[0].type, "before");
    assert.equal(search._filters[0].date, "2020-05-20");
  });

  it("Should add before filter relative number of days", () => {
    const search = lingo.search().before(30);
    assert.equal(search._filters[0].type, "before");
    assert.equal(search._filters[0].period, "day");
    assert.equal(search._filters[0].length, 30);
  });
});
