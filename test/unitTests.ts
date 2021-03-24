/**
 * The integration tests makes actual API calls
 * This is intended for use in development environments only
 */
import { ReadStream } from "fs";
import { strict as assert } from "assert";
import lingo, { AssetType, ItemType, LingoError } from "../src/index";
import { getUploadData, parseFilePath, resolveFilePath } from "../src/utils";

describe("Library exports", () => {
  it("Makes the Error object availble", () => {
    assert.equal(LingoError.Code.Unknown, 1);
  });

  it("Makes the type objects availble", () => {
    assert.equal(ItemType.Heading, "heading");
    assert.equal(AssetType.JPG, "JPG");
  });
});

describe("File utils", () => {
  const fileName = "Beer.svg";

  it("should parse the file url", () => {
    const { filename, extension } = parseFilePath("/path/to/" + fileName);
    assert.equal(filename, "Beer");
    assert.equal(extension, "svg");
  });

  it("should return path if already resolved", () => {
    const expected = process.cwd() + "/" + fileName;
    const filePath = resolveFilePath(expected);
    assert.equal(filePath, expected);
  });

  it("should resolve relative path to cwd", () => {
    const filePath = resolveFilePath("./" + fileName);
    const expected = process.cwd() + "/" + fileName;
    assert.equal(filePath, expected);
  });

  it("should resolve relative path with directory", () => {
    const filePath = resolveFilePath("./files/" + fileName);
    const expected = process.cwd() + "/files/" + fileName;
    assert.equal(filePath, expected);
  });

  it("should resolve relative path with parent directory", () => {
    const filePath = resolveFilePath("../" + fileName);
    const dir = process.cwd().split("/");
    dir.pop();
    const expected = dir.join("/") + "/" + fileName;
    assert.equal(filePath, expected);
  });

  it("should load file and determine upload data", () => {
    const filePath = __dirname + "/" + fileName;
    const { file, metadata } = getUploadData(filePath);
    assert(file instanceof ReadStream, `Expected file to be a buffer ${file}`);
    assert.deepEqual(metadata, {
      name: "Beer",
      type: "svg",
    });
  });
});

describe("Requests params", () => {
  it("Should append query string if provided", () => {
    const { url } = lingo.requestParams("GET", "/", { qs: { key: "value" } });
    assert(url.indexOf("?key=value") > 0, `Url doesn't contain query string ${url}`);
  });

  it("error if data and formData are provided", () => {
    assert.throws(() => lingo.requestParams("GET", "/", { data: {}, formData: {} }));
  });

  it("Should strigify json data", () => {
    const data = { key: "value" };
    const { body } = lingo.requestParams("GET", "/", { data });
    assert.equal(body, JSON.stringify(data));
  });

  it("Should include a client header", () => {
    const { headers } = lingo.requestParams("GET", "/");
    assert(headers["x-lingo-client"] == "LingoJS");
  });
});
