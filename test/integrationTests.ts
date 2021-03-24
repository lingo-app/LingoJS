/**
 * The integration tests makes actual API calls
 * This is intended for use in development environments only
 *
 * Setup
 * 1. Copy `./testConfig.base.js` to `testConfig.js`
 * 2. Populate the new config file with data for your test space
 * 3. Run `npm run integration-test`
 */

import { strict as assert } from "assert";
import lingo, { AssetType, ItemType, LingoError } from "../src/index";
import config from "./testConfig";

const validConfig =
  (config.spaceID, config.apiToken, config.kitID, config.sectionID, config.baseURL);
assert(validConfig, "missing config attributes requires to run tests");

lingo.baseURL = config.baseURL;

describe("Authentication failures", () => {
  it("Should fail to authenticate with invalid space", async () => {
    lingo.setup(0, config.apiToken);
    try {
      await lingo.fetchKits();
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert.equal(err.code, LingoError.Code.Unauthorized, err);
    }
  });

  it("Should fail to authenticate with invalid api token", async () => {
    lingo.setup(config.spaceID, "invalid-api-key");
    try {
      await lingo.fetchKits();
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert(err.code === LingoError.Code.Unauthorized, err);
    }
  });
});

describe("Read requests", () => {
  before(() => {
    lingo.setup(config.spaceID, config.apiToken);
  });

  it("Should fetch kits", async () => {
    const res = await lingo.fetchKits();
    assert(res.length, "expected kits");
    assert(res[0].kit_uuid, "expected the kit to have a uuid");
  });

  it("Should fail to find non-existent kit", async () => {
    try {
      await lingo.fetchKit("invalid-kit-uuid");
      assert(false, "Request unexpectedly succeeded");
    } catch (err) {
      assert(err.code === LingoError.Code.KitNotFound, `Expected error code 1100, got ${err.code}`);
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
    const results = await lingo.searchAssetsInKit(config.kitID, 0, "logo");

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
        err.code === LingoError.Code.AssetNotFound,
        `Expected error code 3100, got ${err.code}`
      );
    }
  });

  it("Should get asset download url", async () => {
    const result = await lingo.getAssetDownloadUrl(config.assetID);
    assert(result.indexOf("s3.amazon.com"), `Unexpected download url ${result}`);
  });

  it("Should download asset file", async () => {
    const result = await lingo.downloadAsset(config.assetID);
    assert(result instanceof Buffer, `expected file buffer ${result}`);
  });

  it("Should fetch items in section with autopage", async () => {
    const section = await lingo.fetchSection(config.sectionID, 0, 1, 0);
    const items = await lingo.fetchAllItemsInSection(section.uuid, section.version);
    assert(
      items.length === section.counts.items,
      `Unexpected item count with auto paging ${items.length} / ${section.counts.items}`
    );
  });

  it("Should fetch items under heading by id: deprecated", async () => {
    const result = await lingo.fetchAssetsForHeading(config.sectionID, config.headingID, 0);
    assert.equal(result.length, 1, "Unexpected item count under heading");
  });

  it("Should fetch items under heading by id", async () => {
    const result = await lingo.fetchItemsForHeading(config.sectionID, config.headingID, 0);
    assert.equal(result.length, 1, "Unexpected item count under heading");
  });

  it("Should fetch assets under heading by name", async () => {
    const result = await lingo.fetchItemsForHeading(config.sectionID, config.headingName, 0);
    assert.equal(result.length, 1, "Unexpected item count under heading");
  });
});

describe("Write requests", () => {
  before(() => {
    lingo.setup(config.spaceID, config.apiToken);
  });

  describe("Kit creation", async () => {
    let kit;
    before(async () => {
      kit = await lingo.createKit("My Kit");
    });

    it("Should create a kit", async () => {
      assert.equal(kit.name, "My Kit");
      assert.equal(kit.space_id, config.spaceID);
    });
    describe("Kit content creation", async () => {
      let section;
      before(async () => {
        section = await lingo.createSection(kit.kit_uuid, "My Kit");
      });

      it("Should create section", async () => {
        assert(section.name, "My Section");
        assert.equal(section.kit_uuid, kit.kit_uuid);
      });

      it("Should create a heading", async () => {
        const heading = await lingo.createHeading(kit.kit_uuid, section.uuid, "Logos");
        assert.equal(heading.data.content, "Logos");
        assert.equal(heading.type, ItemType.Heading);
        assert.equal(heading.section_uuid, section.uuid);
        assert.equal(heading.kit_uuid, kit.kit_uuid);
      });

      it("Should create an inline note", async () => {
        const note = await lingo.createNote(kit.kit_uuid, section.uuid, "A note about the logos");
        assert.equal(note.data.content, "A note about the logos");
        assert.equal(note.type, ItemType.Note);
        assert.equal(note.section_uuid, section.uuid);
        assert.equal(note.kit_uuid, kit.kit_uuid);
      });

      // We need to accesst this to bump the timeout
      // eslint-disable-next-line func-names
      it("Should create a asset from SVG file", async function () {
        this.timeout(20 * 1000);
        const filePath = __dirname + "/Beer.svg";
        const item = await lingo.createAsset(filePath, kit.kit_uuid, section.uuid);
        const asset = item.asset;
        assert.equal(item.type, ItemType.Asset);
        assert.equal(asset.type, AssetType.SVG);
        assert.equal(asset.name, "Beer");
      });
    });
  });
});
