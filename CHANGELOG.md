## Upcoming Release

#### Breaking changes
`stop` event is now emitted on process `close`, not process `exit` (so that stdout can be flushed first)

#### User features
- Detect `Canary` on `OSX` (i: @caitp, r: @mitchhentges)
- Support launching `phantomjs` on `OSX` (i: @epmatsw, r: @mitchhentges)
- Detect `Chromium` on `OSX` (i: @rhendric, r: @mitchhentges)
- `IE` will now response to `stop()` (i: @vsashidh, r: @mitchhentges)
 
#### Developer features
- None yet

#### Bugfixes
- Docs updated to describe how `james-browser-launcher` compares to other launchers (i: @mitchhentges, r: @tomitm)

# 1.0.0
- First release as `james-browser-launcher`
