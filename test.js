const lingo = require("./index");
const assert = require("assert");
const config = require("./test_config");

lingo.baseURL = "https://api-test.lingoapp.com/1";

let validConfig = (config.spaceID,
config.apiToken,
config.kitID,
config.sectionID);
assert(validConfig, "missing config attributes requires to run tests");

it("Should fail to authenticate with invalid space", () => {
  lingo.setup(0, config.apiToken);
  return lingo
    .fetchKits()
    .then(res => {
      assert(false, "Request unexpectedly succeeded");
    })
    .catch(err => {
      assert(err.code === 401);
      return Promise.resolve();
    });
});

it("Should fail to authenticate with invalid api token", () => {
  lingo.setup(config.spaceID, "invalid-api-key");
  return lingo
    .fetchKits()
    .then(res => {
      assert(false, "Request unexpectedly succeeded");
    })
    .catch(err => {
      assert(err.code === 401);
      return Promise.resolve();
    });
});

function setup() {
  lingo.setup(config.spaceID, config.apiToken);
}

it("Should fetch kits", () => {
  setup();
  return lingo.fetchKits().then(res => {
    assert(res.length, "expected kits");
    assert(res[0].kit_uuid, "expected the kit to have a uuid");
  });
});

it("Should fetch kit with versions", () => {
  setup();
  return lingo
    .fetchKit("invalid-kit-uuid")
    .then(res => {
      assert(false, "Request unexpectedly succeeded");
    })
    .catch(err => {
      assert(err.code === 1100, `Expected error code 1100, got ${err.code}`);
      return Promise.resolve();
    });
});

it("Should fail to find missing kit", () => {
  setup();
  return lingo.fetchKit(config.kitID).then(kit => {
    assert(kit.versions.length > 0, "expected versions");
  });
});

it("Should fetch kit outline", () => {
  setup();
  return lingo.fetchKitOutline(config.kitID, 0).then(outline => {
    assert(outline.length > 0, "expected versions");
  });
});

it("Should fetch section and items", () => {
  setup();
  return lingo.fetchSection(config.sectionID, 0).then(section => {
    assert(section.uuid === config.sectionID, "expected sections");
    assert(section.items.length > 0, "expected items");
  });
});

it("Should fetch search results", () => {
  setup();
  return lingo
    .searchAssetsInKit(config.kitID, 0, (query = "logo"))
    .then(results => {
      assert(results, "expected sections");
      assert(results.query === "logo", "expected query to match");
      assert(results.sections, "expected results");
    });
});

it("Should fail to download invalid asset", () => {
  setup();
  return lingo
    .downloadAsset("invalid-asset-uuid")
    .then(res => {
      assert(false, "Request unexpectedly succeeded");
    })
    .catch(err => {
      assert(err.code === 3100, `Expected error code 3100, got ${err.code}`);
      return Promise.resolve();
    });
});

it("Should download asset file", () => {
  setup();
  return lingo.downloadAsset(config.assetID).then(result => {
    assert(result instanceof Buffer, "expected file buffer");
  });
});

it("Should fetch assets under header by id", () => {
  setup();
  return lingo
    .fetchAssetsForHeading(config.sectionID, config.headingID, 0)
    .then(result => {
      assert(result.length === 2, "Unexpected item count under heading");
    });
});

it("Should fetch assets under header by name", () => {
  setup();
  return lingo
    .fetchAssetsForHeading(config.sectionID, config.headingName, 0)
    .then(result => {
      assert(result.length === 2, "Unexpected item count under heading");
      return result;
    });
});
