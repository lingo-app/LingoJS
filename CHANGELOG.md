
# 1.0
* Add support for write APIs
* Overall refactor to improve tooling and code organization

## Breaking
* `fetchKitOutline` now returns the entire kit version with sections nested (previous returned just the array of sections)
* `searchAssetsInKit` has been replaced with `lingo.search` and the search query building class
* All responses are now returned in camel case and any instance of uuid has changed to id to feel more at home in JS/TS.


# 0.1.2
* Add fetchAllItemsInSection
* Deprecate and rename fetchAssetsForHeading to fetchItemsForSection

