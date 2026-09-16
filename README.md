# Stills Off

The central hub for the desk: launch document templates, launch the other
tools you've built, jump to a drive, look up a cheat sheet, or lay out an
idea board — all from one place, all offline.

## Workflow

Open the app and you land on **Home** ("Hello Stills Off"), a dashboard with
a live count for each section. From there:

1. **Templates** — click a template button, say what kind of document it is,
   and it's copied into that document type's folder and opened in Word or
   Excel (or whatever app owns that file type). You (the admin) set up
   templates and document types ahead of time from this screen — pick a
   source file, give it a label and icon, and optionally a default document
   type so the prompt is skipped.
2. **Tools** — buttons that launch other apps or HTML tools you've already
   built, via the OS's own file association (so a `.html` file opens in the
   default browser, a `.app` launches normally).
3. **Drives** — saved shortcuts to mounted volumes or network shares. Local
   volumes show live connected/disconnected status; network shares (`smb://`,
   `afp://`) hand off to the Finder's own "Connect to Server" flow.
4. **Cheat Sheets** — a searchable list of short how-tos, each with a title,
   category, and a free-text body.
5. **Idea Boards** — drag JPEGs in from Finder onto a board, arrange and
   resize them, and export the board as a flattened PNG. The same frame
   dropped onto two boards is stored once (content-addressed by hash).

Everything except the home dashboard's counts needs the desktop shell —
there's a banner across the top when the app is running outside it (e.g. in
a browser during development).

## Data & files

Everything the app tracks — document types, templates, tool shortcuts,
drives, cheat sheets, and idea boards — lives in one JSON file in the app's
user data directory, autosaved on every change. Idea board images are stored
as real files (content-addressed by a SHA-256 hash of their bytes) alongside
a generated thumbnail, never inlined into that JSON.

Template launches don't inline anything either: launching a template copies
the source file into its document type's folder before handing it to Word or
Excel, so the new file already exists on disk under the right folder by the
time the app opens it.

## Development

```bash
npm install
npm run dev        # Vite dev server only, browser features work, desktop features are stubbed out
npm run desktop    # Vite + Electron together, full desktop shell
```

## Before pushing

```bash
npm run typecheck && npm run build
```

## Building the desktop app

```bash
npm run dist:mac
```

This targets Intel Macs (`--mac --x64`) with a minimum OS version of
**10.13 (High Sierra)** — see "Known gaps" for why the build only produces a
`.zip` off this machine.

## Known gaps

- **`dmg` packaging.** `hdiutil` is macOS-only, so building from Linux
  produces a `.zip` of the `.app` (already the target above). Running
  `npm run dist:mac` on an actual Mac with `dmg` added to the build's mac
  targets produces a real disk image.
- **Code signing.** The build is unsigned; first launch on the target Mac
  needs right-click → Open. Signing needs an Apple Developer ID and a Mac to
  run it on.
- **Word/Excel autosave mid-edit.** The app can't reach into Word or Excel
  once they're open — "autosaves it upon opening" is implemented as
  "the file already exists, in the right folder, before the app takes over."
  Saving further edits is still on the person editing the document.
- **Network drive auto-mount.** Clicking a `smb://`/`afp://` drive hands off
  to the Finder's own connect dialog rather than mounting silently — macOS
  doesn't offer a scriptable path around that dialog (credentials, in
  particular) without extra tooling this app doesn't carry.
- **No search across cheat sheets' rendering.** Bodies are stored and shown
  as plain text (with line breaks), not Markdown — that's a deliberate v1
  simplification, not a limitation of the storage format.
