## Upcoming Release

#### Breaking changes
- None yet

#### User features
- None yet

#### Developer features
- None yet

#### Bugfixes
- None yet

### 1.3.1

#### Bugfixes
- Chromium now properly launches (i: @mitchhentges, r: @tomitm)

#### Developer features
- Updates dependencies: rimraf, eslint, ava (i: @mitchhentges, r: @tomitm)

## 1.3.0
Includes changes for @marcolofarias that allow browsers to be launched on macOS (again).
Potential regressions that won't be tested until ~mid-June, but works on Mac, so probably a plus overall.

#### Bugfixes
- Launching browsers on macOS now works (i: @marcelofarias, r: @mitchhentges)

### 1.2.8

#### Bugfixes
- Revert macOS browser changes due to browser-launch regression (i: @mitchhentges)

### 1.2.7

#### Developer features
- Resolves new ESLint error (i: @marcelofarias, r: @mitchhentges)

#### Bugfixes
- Browsers now launch on macOS (i: @marcelofarias, r: @nerdbeere)

### 1.2.6

#### Bugfixes
- (Regression) Chrome proxy options not provided properly (i: @mitchhentges, r: @tomitm)

### 1.2.5

#### Bugfixes
- (Regression) Not refreshing browser cache on failed lookup (i: @mitchhentges, r: @tomitm)

### 1.2.4

#### User features
- Provide `skipDefaults` option to not use specified defaults (i: @mitchhentges, r: @tomitm)

#### Developer features
- Ava updated (i: @mitchhentges)
- Add eslint, remove jshint/jscs, fix warnings (i: @mitchhentges, r: @tomitm)

#### Bugfixes
- Provide spawn error in callback (i: @mitchhentges, r: @tomitm)

### 1.2.3

#### Developer features
- Reduce size of downloaded dependencies by using "chunks" of lodash (i: @mitchhentges, r: @tomitm)

### 1.2.2

#### Bugfixes
- Downgraded `win-detect-browsers` for compatibility with `browserify`. See [#29](https://github.com/vweevers/win-detect-browsers/issues/29) (i: @mitchhentges, r: @tomitm)

### 1.2.1

#### Bugfixes
- #21 `detect` works on OSX again (i: @mitchhentges, r: @tomitm)

## 1.2.0

#### Breaking changes
- Type `phantom` is now `phantomjs`, which is a little more consistent
- The property "name" is more descriptive for variant channels, e.g. "chrome-canary"

#### User features
- #19 Firefox Developer supported on OSX (i: @mitchhentges, r: @tomitm)
- #18 Linux browser-finding faster, each command is run in parallel (i: @mitchhentges, r: @tomitm)

#### Developer features
- #19 Darwin detectors refactored, much easier to update (i: @mitchhentges, r: @tomitm)
- #18 Browser list is refactored, adding commands for browsers is easier (i: @mitchhentges, r: @tomitm)

#### Bugfixes
- #18 If a browser appeared multiple times as a symlink, it would show up multiple times (i: @mitchhentges, r: @tomitm)

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
