const lingo = require("./src/index");
const assert = require("assert");
const config = require("./test_config");

let validConfig =
  (config.spaceID,
  config.apiToken,
  config.kitID,
  config.sectionID,
  config.baseURL);
assert(validConfig, "missing config attributes requires to run tests");

lingo.baseURL = config.baseURL;

describe("Authentication failures", () => {
  it("Should fail to authenticate with invalid space", async () => {
    lingo.setup(0, config.apiToken);
    try {
      await lingo.fetchKits();
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert(err.code === lingo.Error.Code.unauthorized);
    }
  });

  it("Should fail to authenticate with invalid api token", async () => {
    lingo.setup(config.spaceID, "invalid-api-key");
    try {
      await lingo.fetchKits();
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert(err.code === lingo.Error.Code.unauthorized);
    }
  });
});

describe("Authenticated requests", () => {
  beforeEach(() => {
    lingo.setup(config.spaceID, config.apiToken);
  });

  it("Should fetch kits", async () => {
    let res = await lingo.fetchKits();
    assert(res.length, "expected kits");
    assert(res[0].kit_uuid, "expected the kit to have a uuid");
  });

  it("Should fail to find non-existent kit", async () => {
    try {
      await lingo.fetchKit("invalid-kit-uuid");
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert(
        err.code === lingo.Error.Code.kitNotFound,
        `Expected error code 1100, got ${err.code}`
      );
    }
  });

  it("Should fetch kit with versions", async () => {
    const kit = await lingo.fetchKit(config.kitID);
    assert(kit.versions.length > 0, "expected versions");
  });

  it("Should fetch kit outline", async () => {
    const outline = await lingo.fetchKitOutline(config.kitID, 0);
    assert(outline.length > 0, "expected versions");
  });

  it("Should fetch section and items", async () => {
    const section = await lingo.fetchSection(config.sectionID, 0);
    assert(section.uuid === config.sectionID, "expected sections");
    assert(section.items.length > 0, "expected items");
  });

  it("Should fetch search results", async () => {
    const results = await lingo.searchAssetsInKit(
      config.kitID,
      0,
      (query = "logo")
    );

    assert(results, "expected sections");
    assert(results.query === "logo", "expected query to match");
    assert(results.sections, "expected results");
  });

  it("Should fail to download invalid asset", async () => {
    try {
      await lingo.downloadAsset("invalid-asset-uuid");
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert(
        err.code === lingo.Error.Code.assetNotFound,
        `Expected error code 3100, got ${err.code}`
      );
    }
  });

  it("Should download asset file", async () => {
    const result = await lingo.downloadAsset(config.assetID);
    assert(result instanceof Buffer, "expected file buffer");
  });

  it("Should fetch items in section with autopage", async () => {
    const section = await lingo.fetchSection(config.sectionID, 0, 1, 0);
    const items = await lingo.fetchAllItemsInSection(
      section.uuid,
      section.version
    );
    assert(
      items.length === section.counts.items,
      `Unexpected item count with auto paging ${items.length} / ${section.counts.items}`
    );
  });

  it("Should fetch items under header by id: deprecated", async () => {
    const result = await lingo.fetchAssetsForHeading(
      config.sectionID,
      config.headingID,
      0
    );

    assert(result.length === 2, "Unexpected item count under heading");
  });

  it("Should fetch items under header by id", async () => {
    const result = await lingo.fetchItemsForHeading(
      config.sectionID,
      config.headingID,
      0
    );

    assert(result.length === 2, "Unexpected item count under heading");
  });

  it("Should fetch assets under header by name", async () => {
    const result = await lingo.fetchItemsForHeading(
      config.sectionID,
      config.headingName,
      0
    );
    assert(result.length === 2, "Unexpected item count under heading");
  });
});
