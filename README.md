Obsidian Web Clipper helps you highlight and capture the web in your favorite browser. Anything you save is stored as durable Markdown files that you can read offline, and preserve for the long term.

- **[Download Web Clipper](https://obsidian.md/clipper)**
- **[Documentation](https://help.obsidian.md/web-clipper)**
- **[Troubleshooting](https://help.obsidian.md/web-clipper/troubleshoot)**

## Get started

Install the extension by downloading it from the official directory for your browser:

- **[Chrome Web Store](https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf)** for Chrome, Brave, Arc, Orion, and other Chromium-based browsers.
- **[Firefox Add-Ons](https://addons.mozilla.org/en-US/firefox/addon/web-clipper-obsidian/)** for Firefox and Firefox Mobile.
- **[Safari Extensions](https://apps.apple.com/us/app/obsidian-web-clipper/id6720708363)** for macOS, iOS, and iPadOS.
- **[Edge Add-Ons](https://microsoftedge.microsoft.com/addons/detail/obsidian-web-clipper/eigdjhmgnaaeaonimdklocfekkaanfme)** for Microsoft Edge.

## Use the extension

Documentation is available on the [Obsidian Help site](https://help.obsidian.md/web-clipper), which covers how to use [highlighting](https://help.obsidian.md/web-clipper/highlight), [templates](https://help.obsidian.md/web-clipper/templates), [variables](https://help.obsidian.md/web-clipper/variables), [filters](https://help.obsidian.md/web-clipper/filters), and more.

## Contribute

### Translations

You can help translate Web Clipper into your language. Submit your translation via pull request using the format found in the [/_locales](/src/_locales) folder.

### Features and bug fixes

See the [help wanted](https://github.com/obsidianmd/obsidian-clipper/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tag for issues where contributions are welcome.

## Roadmap

In no particular order:

- [ ] A separate icon for Web Clipper
- [ ] Translate UI into more languages — help is welcomed
- [ ] Annotate highlights
- [ ] Template directory
- [ ] Template validation
- [x] Template logic (if/for)
- [x] Save images locally, [added in Obsidian 1.8.0](https://obsidian.md/changelog/2024-12-18-desktop-v1.8.0/)

## CLI tool

The `cli/` directory contains a command-line tool that clips web pages into Obsidian notes without a browser extension. It uses [Playwright](https://playwright.dev) to render pages (including JavaScript-heavy sites) and reuses the same template engine as the extension.

### Setup

```sh
cd cli
npm install
npx playwright install chromium
npm run build
```

### Usage

```sh
node dist/index.js <url> [options]
```

**Options**

| Flag | Description |
|---|---|
| `--headed` | Open a visible browser window instead of running headless |
| `--vault <name>` | Target Obsidian vault name |
| `--output-dir <path>` | Without `--vault-path`: write the note and images here (disk mode, no Obsidian). With `--vault-path`: override the default `<vault-path>/attachments/` image directory. |
| `--vault-path <path>` | Filesystem path to the Obsidian vault root; enables image downloading to `<vault-path>/attachments/` and opens the note in Obsidian. |
| `--profile-dir <path>` | Playwright persistent profile directory; all browser data is stored here and reused across runs |
| `--session-dir <path>` | Override the default session directory (`~/.config/obsidian-clipper`) |
| `--login` | Open a browser window to log into sites (alias for the `login` subcommand) |

**Subcommands**

| Command | Description |
|---|---|
| `login` | Open a browser to log into sites; session is saved when the browser is closed |
| `sessions` | Show the session directory and whether a saved session exists |

### Examples

Clip a public page:

```sh
node dist/index.js https://example.com
```

Clip with a visible browser window (useful for pages that block headless browsers):

```sh
node dist/index.js https://example.com --headed
```

Clip into a specific vault:

```sh
node dist/index.js https://example.com --vault "My Vault"
```

Clip to a local `.md` file with images downloaded alongside it (no Obsidian needed):

```sh
node dist/index.js https://example.com --output-dir ~/clips
# note  → ~/clips/<title>.md
# images → ~/clips/attachments/<filename>
```

Download images into an Obsidian vault and open the note in Obsidian:

```sh
node dist/index.js https://example.com --vault-path ~/ObsidianVault
# note  → opened in Obsidian
# images → ~/ObsidianVault/attachments/<filename>
```

Obsidian mode with a custom image directory:

```sh
node dist/index.js https://example.com --vault-path ~/ObsidianVault --output-dir ~/ObsidianVault/assets
```

### Content extraction

The CLI uses Defuddle to extract the main article content. For forum or thread-style pages where Defuddle misses the real post bodies, the CLI falls back to a forum extractor that stitches together post content blocks and attachments.

### Clipping pages that require login

Run the `login` subcommand to open a headed browser session. Navigate to any sites and log in normally. When you close the browser, the session (cookies and storage) is saved to `~/.config/obsidian-clipper/session.json`.

```sh
node dist/index.js login
```

Subsequent `clip` runs automatically load the saved session. Running `login` again merges new logins into the existing session file, so previously saved logins are not lost.

The `--headed` flag can be combined with a saved session when you want to clip a login-protected page in a visible browser window:

```sh
node dist/index.js https://private-site.com --headed
```

## Developers

To build the extension:

```
npm run build
```

This will create three directories:
- `dist/` for the Chromium version
- `dist_firefox/` for the Firefox version
- `dist_safari/` for the Safari version

### Install the extension locally

For Chromium browsers, such as Chrome, Brave, Edge, and Arc:

1. Open your browser and navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist` directory

For Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to the `dist_firefox` directory and select the `manifest.json` file

If you want to run the extension permanently you can do so with the Nightly or Developer versions of Firefox.

1. Type `about:config` in the URL bar
2. In the Search box type `xpinstall.signatures.required`
3. Double-click the preference, or right-click and select "Toggle", to set it to `false`.
4. Go to `about:addons` > gear icon > **Install Add-on From File…**

For iOS Simulator testing on macOS:

1. Run `npm run build` to build the extension
2. Open `xcode/Obsidian Web Clipper/Obsidian Web Clipper.xcodeproj` in Xcode
3. Select the **Obsidian Web Clipper (iOS)** scheme from the scheme selector
4. Choose an iOS Simulator device and click **Run** to build and launch the app
5. Once the app is running on the simulator, open **Safari**
6. Navigate to a webpage and tap the **Extensions** button in Safari to access the Web Clipper extension

### Run tests

```
npm test
```

Or run in watch mode during development:

```
npm run test:watch
```

## Third-party libraries

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) for browser compatibility
- [defuddle](https://github.com/kepano/defuddle) for content extraction
- [turndown](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion
- [dayjs](https://github.com/iamkun/dayjs) for date parsing and formatting
- [lz-string](https://github.com/pieroxy/lz-string) to compress templates to reduce storage space
- [lucide](https://github.com/lucide-icons/lucide) for icons
- [mathml-to-latex](https://github.com/asnunes/mathml-to-latex) for MathML to LaTeX conversion
- [dompurify](https://github.com/cure53/DOMPurify) for sanitizing HTML
