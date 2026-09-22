# Working in this repo

Stills Off — the central organization hub: launch document templates, launch
other tools, jump to a drive, look up a cheat sheet, lay out an idea board.
Read `README.md` first for the workflow. Unlike its siblings (OpticPlan,
PhotoTrack) this app has no meaningful browser-only mode — nearly every
feature (launching files, copying templates, checking drive status, reading
and writing the asset store) needs the desktop shell's filesystem and shell
access, so there is one build, not two.

## Ground rules

- **This app targets macOS 10.13 (High Sierra), on Intel.** That's why
  `package.json` pins `electron` to the `^22.x` line — Electron 23 raised its
  minimum macOS version to 10.15, so upgrading Electron past 22 silently
  drops 10.13 support. Don't bump the Electron major version without
  checking the release notes for exactly this. `vite.config.ts`'s build
  target (`chrome108`) tracks Electron 22's bundled Chromium; move it in
  lockstep if the Electron pin ever changes. There is no Apple Silicon on
  10.13, so the mac build target is `x64` only.
- **Nothing native from a component.** All filesystem, dialog, shell, and
  asset-store access goes through `window.stillsoff` (`electron/preload.cjs`
  → `electron/main.cjs`), wrapped by `src/lib/desktop.ts`'s `desktop()` and
  `isDesktop()`. A component that needs a file picker, a copy, an open, or an
  asset write calls `desktop()` — never `window.stillsoff` directly — so the
  one call site can throw a clear error if it's ever invoked outside the
  desktop shell.
- **Collections are keyed, order is separate.** Every collection in
  `AppData` (`src/state/schema.ts`) is an id-keyed record plus a matching
  `*Ids` order array — `templates`/`templateIds`, `boards`/`boardIds`, a
  board's own `items`/`itemIds`, and so on. A mutation must not create a new
  order array unless an item was actually added, removed, or reordered.
- **Never return a fresh object from a zustand selector** without
  `useShallow` — it makes the store see a new value every render and loops
  until React throws error #185. `src/state/useAppStore.ts`'s selectors
  return direct references into `data` (safe, since they're not rebuilt
  per-call) or scalars; don't add a selector that spreads, maps, or filters
  inline without wrapping it.
- **Assets are content-addressed, never inlined.** An idea board item holds
  an `assetId` (a SHA-256 hash of the file's bytes) into `doc.assets`; the
  same frame dropped twice resolves to the same asset. Import always goes
  through `src/lib/images.ts`'s `importImageFile` — full image and thumbnail
  are written to disk via `desktop().writeAsset`/`writeAssetThumb`, never
  stored as a data URL on the item itself. Rendering reads them back through
  the `stillsoff-asset://` protocol (registered in `electron/main.cjs`), not
  a raw `file://` path.
- **Board drags don't write to the store on every pointermove.** Following
  OpticPlan's lesson on the same problem: `BoardItemView` mutates the DOM
  node directly during a drag or resize (via a ref) and commits the final
  position/size to the store once, on pointer-up.
- **Templates never save themselves into the app's own folders.** Launching
  a template (`src/lib/paths.ts`'s `launchTemplateCopy`) always copies into a
  document type's configured `destinationFolder`, creating it if missing,
  before handing the new file to `shell.openPath`. There's no path where the
  app writes a launched document anywhere else.
- **Schema changes are migrations.** Bump `SCHEMA_VERSION` in
  `src/state/schema.ts` and add a branch to `migrate()`. Never edit an
  existing branch — a data file saved by an older build still has to enter
  through its original step.
- **Deleting goes through Trash, not straight to `delete`.** Every
  `remove*` action in `src/state/useAppStore.ts` calls the module-local
  `trash()` helper instead of just dropping the item, so it lands in
  `data.trash`/`trashIds` with a `kind`, a human label, and a `deletedAt`.
  `purgeExpiredTrash()` (run on `init()` and every 15 minutes from
  `App.tsx`) is the only thing that removes a trash entry for good, past
  the 24-hour mark. A new trashable collection needs a case in both
  `restoreFromTrash`'s switch and the `TrashKind` union — the switch is
  exhaustive on purpose, so a forgotten kind is a compile error, not a
  silent no-op restore. Idea-board items are the one deliberate exception —
  see the README's "Known gaps".
- **Every delete button confirms first.** A plain `window.confirm(...)`
  before the `remove*` call, everywhere one exists — not a custom modal,
  since Trash already provides the real undo path and a native confirm is
  one line per call site instead of a whole component.
- **Daily BP's quotas and its targets are different things — don't merge
  them.** A quota (`dailyBPSettings.shotsQuota`/`packagesQuota`, plus each
  day's `shotsAchieved`/`packagesAchieved`) is just the day's overall
  numbers — no person attached, nothing to assign. A target
  (`DailyBPDay.targets`) is the actual battle plan: a task description plus
  whoever's doing it (a preset name or typed in — never blank) plus a
  `done` checkbox, one flat list for the whole day, not split per stat.
  `DailyBPPage.tsx`'s "Add Target" stays disabled until both a description
  and a person are filled in — don't reintroduce a bare numeric target or
  an "Unassigned" option. Editing (quotas, today's counts, the targets
  checklist) lives only on the dedicated Daily BP page — `DailyBPSummary`
  on Home is read-only and just links through.
- **The Vault never touches plaintext outside `electron/main.cjs`.**
  `passwordCipher` on a `VaultEntryDef` is base64 from Electron's
  `safeStorage.encryptString`, produced and consumed only via the
  `vault:encrypt`/`vault:decrypt` IPC calls — a component calls
  `desktop().vaultEncrypt`/`vaultDecrypt`, never stores a raw password in
  React state longer than the reveal/edit UI needs it, and never writes one
  into `AppData` directly.
- **It has to work offline.** No CDN, no runtime network calls. The only
  outbound action the app ever takes is handing a `smb://`/`afp://` address
  to the OS via `shell.openExternal`, which is the user's own request to
  connect to a share they typed in — not a call the app makes on its own.

## Before pushing

```bash
npm run typecheck && npm run build
```

## Design

Dark chrome sidebar around a light working surface — cards, panels, and the
idea-board canvas stay white so photos and documents read the way they will
everywhere else. One warm accent (`--accent`) marks the primary action and
active nav item. Tokens and shared classes (`.btn`, `.field`, `.panel`,
`.card-grid`, `.modal`) live at the top of `src/styles/index.css`. This first
pass is deliberately plain — the brief was function first, a real visual
design pass comes once the feature set is confirmed.

## Known gaps

See the README's "Known gaps" section — `dmg` packaging and code signing
both need a real Mac, Word/Excel autosave stops at file creation (the app
can't reach into another app's document once it's open), network drives hand
off to Finder's own connect dialog, cheat sheet bodies are plain text rather
than Markdown for now, the Vault only decrypts on the Mac/login that
encrypted it, and idea-board items skip Trash.
