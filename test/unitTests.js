/**
 * The integration tests makes actual API calls
 * This is intended for use in development environments only
 */

const assert = require("assert").strict;
const lingo = require("../src/index");

describe("Library exports", () => {
  it("Makes the Error object availble", () => {
    assert.equal(lingo.Error.Code.unknown, 1);
  });

  it("Makes the type objects availble", () => {
    assert.equal(lingo.ItemType.heading, "heading");
    assert.equal(lingo.AssetType.jpg, "JPG");
  });
});

describe("Requests params", () => {
  it("Should append query string if provided", () => {
    const { url, qs } = lingo._requestParams("GET", "/", { qs: { key: "value" } });
    assert(url.indexOf("?key=value") > 0, `Url doesn't contain query string ${url}`);
    assert(qs == undefined);
  });

  it("Should include a client header", () => {
    const { headers } = lingo._requestParams("GET", "/");
    assert(headers["x-lingo-client"] == "LingoJS");
  });
});
