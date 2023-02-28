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
import lingo, { AssetType, ItemType, Kit, LingoError, Section } from "../src/index";
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
  beforeAll(() => {
    lingo.setup(config.spaceID, config.apiToken);
  });

  describe("Fetching kits", () => {
    it("Should fetch kits", async () => {
      const res = await lingo.fetchKits();
      assert(res.length, "expected kits");
      assert(res[0].kitId, "expected the kit to have a uuid");
    });

    it("Should fail to find non-existent kit", async () => {
      try {
        await lingo.fetchKit("invalid-kit-uuid");
        assert(false, "Request unexpectedly succeeded");
      } catch (err) {
        assert(
          err.code === LingoError.Code.KitNotFound,
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
      assert(outline.sections.length > 0, "expected versions");
    });
  });

  describe("Fetching kit content", () => {
    it("Should fetch section and items", async () => {
      const section = await lingo.fetchSection(config.sectionID, 0);
      assert(
        section.id === config.sectionID || section.shortId === config.sectionID,
        "expected sections"
      );
      assert(section.items.length > 0, "expected items");
    });

    it("Should download asset file", async () => {
      const result = await lingo.downloadAsset(config.assetID);
      assert(result instanceof Buffer, `expected file buffer ${result}`);
    });

    it("Should fetch items in section with autopage", async () => {
      const section = await lingo.fetchSection(config.sectionID, 0, 1, 0);
      const items = await lingo.fetchAllItemsInSection(section.id, section.version);
      assert(
        items.length === section.counts.items,
        `Unexpected item count with auto paging ${items.length} / ${section.counts.items}`
      );
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

  describe("Downloading assets", () => {
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
  });

  describe("Search", () => {
    it("Should fetch search results", async () => {
      const results = await lingo.search().inKit(config.kitID).matchingKeyword("logo").fetch();
      assert(results, "expected sections");
      assert(results.results, "expected results");
    });

    it("Should fetch kit results", async () => {
      const results = await lingo.search().kits().matchingKeyword("logo").fetch();
      assert(results, "expected sections");
      assert(results.results, "expected results");
    });

    it("Should fetch section results", async () => {
      const results = await lingo.search().sections().matchingKeyword("logo").fetch();
      assert(results, "expected sections");
      assert(results.results, "expected results");
    });

    it("Should fetch library asset results", async () => {
      const results = await lingo.search().assets().matchingKeyword("logo").fetch();
      assert(results, "expected sections");
      assert(results.results, "expected results");
    });

    it("Should fetch library tag results", async () => {
      const results = await lingo.search().tags().matchingKeyword("logo").fetch();
      assert(results.results, "expected results");
    });

    it("Should assets from date ", async () => {
      const results = await lingo.search().assets().createdAt({ exactly: "2021-03-10" }).fetch();
      assert(results.results.length, "expected results");
    });
    it("Should assets from date range ", async () => {
      const results = await lingo
        .search()
        .assets()
        .createdAt({ after: "2021-03-05", before: "2021-03-11" })
        .fetch();
      assert(results, "expected sections");
      assert(results.results.length, "expected results");
    });
  });
});

describe("Write requests", () => {
  beforeAll(() => {
    lingo.setup(config.spaceID, config.apiToken);
  });

  describe("Kit creation", () => {
    let kit: Kit;
    beforeAll(async () => {
      kit = await lingo.createKit("My Kit");
    });

    it("Should create a kit", async () => {
      assert.equal(kit.name, "My Kit");
      assert.equal(kit.spaceId, config.spaceID);
    });
    describe("Kit content creation", () => {
      let section: Section;
      beforeAll(async () => {
        section = await lingo.createSection(kit.kitId, "My Kit");
      });

      it("Should create section", async () => {
        assert(section.name, "My Section");
        assert.equal(section.kitId, kit.kitId);
      });

      it("Should create an inline note", async () => {
        const note = await lingo.createNote({
          kitId: kit.kitId,
          sectionId: section.id,
          content: "A note about the logos",
        });
        assert.equal(note.data.content, "A note about the logos");
        assert.equal(note.type, ItemType.Note);
        assert.equal(note.sectionId, section.id);
        assert.equal(note.kitId, kit.kitId);
      });

      it("Should create a heading", async () => {
        const heading = await lingo.createHeading({
          kitId: kit.kitId,
          sectionId: section.id,
          content: "Logos",
        });
        expect(heading.data.content).toEqual("Logos");
        expect(heading.type).toEqual(ItemType.Heading);
        expect(heading.sectionId).toEqual(section.id);
        expect(heading.kitId).toEqual(kit.kitId);
      });

      describe("Guides", () => {
        it("Should create a text only guide", async () => {
          const guide = await lingo.createGuide({
            kitId: kit.kitId,
            sectionId: section.id,
            content: "Use formal language.",
            title: "Do",
          });
          expect(guide.data.content).toEqual("Use formal language.");
          expect(guide.data.title).toEqual("Do");
          expect(guide.data.color).toEqual("green");
          expect(guide.type).toEqual(ItemType.Guide);
          expect(guide.sectionId).toEqual(section.id);
          expect(guide.kitId).toEqual(kit.kitId);
          expect(guide.data.displayStyle).toEqual("text_only");
          expect(guide.assetId).toBeNull();
        });
        it("Should create a guide with an image", async () => {
          const file = __dirname + "/Logo.png";
          const guide = await lingo.createGuide({
            kitId: kit.kitId,
            sectionId: section.id,
            content: "Change the color of the logo.",
            title: "Don't",
            file,
          });
          expect(guide.data.content).toEqual("Change the color of the logo.");
          expect(guide.data.title).toEqual("Don't");
          expect(guide.data.color).toEqual("red");
          expect(guide.type).toEqual(ItemType.Guide);
          expect(guide.sectionId).toEqual(section.id);
          expect(guide.kitId).toEqual(kit.kitId);
          expect(guide.data.displayStyle).toEqual("image");
          expect(guide.assetId).not.toBeNull();
          expect(guide.asset.type).toEqual(AssetType.PNG);
        }, 10000);
      });

      it("Should create a supporting image", async () => {
        const file = __dirname + "/Logo.png";
        const guide = await lingo.createSupportingContent({
          file,
          kitId: kit.kitId,
          sectionId: section.id,
        });
        expect(guide.data.content).toBeUndefined();
        expect(guide.type).toEqual(ItemType.SupportingContent);
        expect(guide.sectionId).toEqual(section.id);
        expect(guide.kitId).toEqual(kit.kitId);
        expect(guide.assetId).not.toBeNull();
        expect(guide.asset.type).toEqual(AssetType.PNG);
      });

      describe("Color assets", () => {
        it("Should create a color asset without an item", async () => {
          const { asset, item } = await lingo.createColorAsset("#FFFFFF", {
            name: "White",
            notes: "A white color",
          });
          expect(item).toBeUndefined();
          expect(asset.type).toEqual(AssetType.Color);
        });

        it("Should create a color asset with an item", async () => {
          const { asset, item } = await lingo.createColorAsset(
            "#AAFFFF",
            {
              name: "White",
              notes: "A white color",
            },
            { kitId: kit.kitId, sectionId: section.id }
          );
          expect(asset).toBeUndefined();
          expect(item.asset.type).toEqual(AssetType.Color);
          expect(item.asset.colors.length).toEqual(1);
          expect(item.type).toEqual(ItemType.Asset);
        });

        it("Should create a color asset with dates", async () => {
          const { asset, item } = await lingo.createColorAsset(
            "#AAFFFF",
            {
              name: "White",
              notes: "A white color",
              dateAdded: new Date("2020-01-01"),
            },
            { kitId: kit.kitId, sectionId: section.id }
          );
          expect(asset).toBeUndefined();
          expect(item.asset.type).toEqual(AssetType.Color);
          expect(item.asset.colors.length).toEqual(1);
          expect(item.type).toEqual(ItemType.Asset);
        });
      });

      describe("File assets", () => {
        it(
          "Should create file asset with an item",
          async () => {
            const filePath = __dirname + "/Logo.svg";
            const response = await lingo.createFileAsset(
              filePath,
              {},
              { kitId: kit.kitId, sectionId: section.id }
            );
            expect(response.asset).toBeUndefined();
            const item = response.item;
            const asset = item.asset;
            expect(item.kitId).toEqual(kit.kitId);
            expect(item.sectionId).toEqual(section.id);
            expect(item.type).toEqual(ItemType.Asset);
            expect(asset.type).toEqual(AssetType.SVG);
            expect(asset.name).toEqual("Logo");
          },
          20 * 1000
        );

        it(
          "Should create file asset without an item",
          async () => {
            const filePath = __dirname + "/Logo.svg";
            const response = await lingo.createFileAsset(filePath);
            expect(response.item).toBeUndefined();
            const asset = response.asset;
            expect(asset.type).toEqual(AssetType.SVG);
            expect(asset.name).toEqual("Logo");
          },
          20 * 1000
        );

        it(
          "Should create file asset with custom dates",
          async () => {
            const filePath = __dirname + "/Logo.svg";
            const response = await lingo.createFileAsset(filePath, {
              dateAdded: new Date("2020-01-01"),
            });
            expect(response.item).toBeUndefined();
            const asset = response.asset;
            expect(asset.type).toEqual(AssetType.SVG);
            expect(asset.name).toEqual("Logo");
          },
          20 * 1000
        );

        it(
          "Should create a font asset",
          async () => {
            const filePath = __dirname + "/Inter-Light.otf";
            const response = await lingo.createFileAsset(filePath);
            expect(response.item).toBeUndefined();
            const asset = response.asset;
            expect(asset.type).toEqual(AssetType.TextStyle);
            expect(asset.meta.font.displayName).toEqual("Inter Light");
            expect(asset.meta.font.family).toEqual("Inter Light");
            expect(asset.name).toEqual("Inter-Light");
          },
          20 * 1000
        );
      });
    });
  });
});
