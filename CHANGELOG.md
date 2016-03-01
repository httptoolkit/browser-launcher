## Upcoming Release

#### Breaking changes
- Type `phantom` is now `phantomjs`, which is a little more consistent
- The property "name" is more descriptive for variant channels, e.g. "chrome-canary"

#### User features
- None yet
 
#### Developer features
- None yet

#### Bugfixes
- None yet

## 1.1.0

#### Breaking changes
`stop` event is now emitted on process `close`, not process `exit` (so that stdout can be flushed first)

#### User features
- Detect `Canary` on `OSX` (i: @caitp, r: @mitchhentges)
- Support launching `phantomjs` on `OSX` (i: @epmatsw, r: @mitchhentges)
- Detect `Chromium` on `OSX` (i: @rhendric, r: @mitchhentges)
- `IE` will now response to `stop()` (i: @vsashidh, r: @mitchhentges)
- Windows browser detection should be 2-4x faster (win-detect-browsers upgrade) (i: @mitchhentges, r: @tomitm)

#### Developer features
- Updated dependencies (i: @mitchhentges, r: @tomitm)

#### Bugfixes
- Docs updated to describe how `james-browser-launcher` compares to other launchers (i: @mitchhentges, r: @tomitm)

# 1.0.0
- First release as `james-browser-launcher`
