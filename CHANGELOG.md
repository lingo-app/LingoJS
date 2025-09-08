# 2.2
* Adds support for Direct Links

# 2.1
* Under the hood, files larger than 20mb will be uploaded in chunks
* Adds automatic retry for uploads

# 2.0.4
* Add thumbnails and permalink to Asset type

# 2.0.3
* Add `fetchAssetChangelog` to retrieve the changelog for an asset

# 2.0.2
* Update asset meta types

# 2.0.1
* Allow creating assets with dateAdded and dateUpdated
* `validateAsset` data option is now optional


# 2.0.0
## Breaking
* `createAsset` has been renamed `createFileAsset` and item data is now optionally provided in the `data` argument meaning that assets can now be created in the library without being added to a kit
* Add `validateAsset` has been renamed `validateFileAsset`
* Removed deprecated `fetchAssetsForHeading`, use `fetchItemsForHeading`
* Remove unnecessary `notes` argument from `validateAsset`
* The second argument of `downloadAsset` and `getAssetDownloadUrl` is now an option instead of a `type`. Type should now be included in the options object. `dpi` and `dimension` options are also now available.

## Other
* Added `createColorAsset`
* Added `createSupportingContent`
* Added `createGuide`
* Added `createCodeSnippet`
* Added `createColorAsset`
* `createFileAsset` now supports creating font files

# 1.0.2
* Add `validateAsset`

# 1.0
* Rename the pacakge to @lingo-app/node
* Add support for write APIs
* Overall refactor to improve tooling and code organization

## Breaking
* `fetchKitOutline` now returns the entire kit version with sections nested (previous returned just the array of sections)
* `searchAssetsInKit` has been replaced with `lingo.search` and the search query building class
* All responses are now returned in camel case and any instance of uuid has changed to id to feel more at home in JS/TS.


# 0.1.2
* Add fetchAllItemsInSection
* Deprecate and rename fetchAssetsForHeading to fetchItemsForSection

