# AI Note

A small, local-first personal notebook built with React Native, Expo SDK 57,
TypeScript, Expo Router, Zustand, and AsyncStorage.

## Run locally

Use Node.js 22.13 or later (Node 24 LTS recommended) and npm.

```sh
git clone https://github.com/Oleh-Hrytsyk-web/ai-note.git
cd ai-note
npm ci
npm start
```

If you already have this working copy, open its directory and start at `npm ci`.
Scan the terminal QR code using an Expo Go version that supports SDK 57. The
phone and development computer should be on the same network. For platform
requirements and SDK details, see the [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/).

```sh
npm run web       # Browser preview
npm run android   # Android emulator, or a connected Android device
npm run ios       # iOS simulator (requires macOS and Xcode)
```

No environment variables, API keys, accounts, or backend services are required.
On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

## Included in the MVP

- Home: quick text capture, all/type filters, newest-first notes, empty states,
  and a floating new-note action.
- New thought: multiline editor and manual note/task/reminder/shopping choice.
- Details: editable content and type, creation date, explicit save, and a return
  to the notebook even when opening a detail link directly.
- Completion toggles for tasks, reminders, and shopping items.
- Settings: notebook count, local-storage explanation, app version, and clearly
  labeled future features.
- Warm neutral surfaces, forest-green accents, reusable controls, safe-area and
  keyboard handling, accessible labels, and a centered layout on larger screens.
- Device persistence, hydration/loading state, storage-error feedback, and a
  missing-note/route fallback.

Quick capture always creates a `note`. Choose another type in the full editor.
The microphone is disabled and labeled as coming soon. A `reminder` is currently
just a category; it does not schedule a notification.

## Architecture

```text
src/
  app/
    _layout.tsx           Hydration gate, status bar, root stack
    (tabs)/
      _layout.tsx         Notebook and Settings tabs
      index.tsx           Home and quick capture
      settings.tsx        Basic settings/about screen
    note/
      new.tsx             New-note route
      [id].tsx            Existing-note lookup and editor
    +not-found.tsx        Unknown-route fallback
  components/
    ui.tsx                Buttons, icons, section labels, type picker
    NoteCard.tsx          Summary card and completion control
    NoteEditor.tsx        Shared create/edit form
  store/notes.ts          Zustand state, mutations, AsyncStorage boundary
  types/note.ts           Note model and persisted-data validation
  theme.ts               Colors and note-type presentation
```

Expo Router starts at `expo-router/entry` and discovers routes under `src/app`.
`app.json` registers the Router plugin and `ai-note` scheme. Web uses Metro with
single-page output. A static host would need an index.html fallback for deep links.

The single Zustand store owns notes. Screens select state and call its actions;
temporary input and filter state stay inside components. Persistence lives in
the store rather than being repeated across screens. There are no service
containers, repository abstractions, or extra navigation libraries.

Each note contains:

```ts
type Note = {
  id: string;
  text: string;
  type: 'note' | 'task' | 'reminder' | 'shopping';
  createdAt: string; // ISO timestamp; unchanged by edits
  updatedAt: string; // ISO timestamp; updated by edits/completion
  completed: boolean;
};
```

Notes use locally generated identifiers and are stored as a versioned JSON
envelope under `@ai-note/notes-v1`. Startup validates the saved payload before
enabling edits. A failed read leaves existing storage untouched and offers a
retry. Writes run in order so rapid changes cannot save an older snapshot last.
A failed write keeps the in-memory changes and displays an error; save again to
retry. Switching an item to `note` clears its completion state.

AsyncStorage is local, unencrypted storage. Clearing app data, uninstalling, or
clearing browser storage can remove notes. Browser profiles/origins each have
their own notebook. There is no cloud backup. Editor changes must be explicitly
saved before leaving; the form displays an unsaved-changes hint. Text input is
limited to 20,000 characters, and blank thoughts cannot be saved.

## Checks

```sh
npm run typecheck
npm run lint
npm run export:web
npx expo export --platform all
npx expo-doctor
```

Validation performed during implementation:

- TypeScript and ESLint: passed.
- Expo Doctor: all 21 checks passed.
- Production web, Android, and iOS JavaScript/Hermes exports: passed.
- Expo dev server: started successfully on localhost:8081.
- Browser at a 390 × 844 viewport: quick capture, new shopping item, editing,
  changing type, filters, completion, settings count, and reload persistence
  verified. No browser console errors were recorded in those checks.

Native bundles were verified; the app has not yet been exercised on a physical
phone or native emulator. Native installation, keyboard behavior, safe areas,
and screen-reader behavior should get a device smoke test before release.

## Next stage

Add voice capture and transcription, then AI classification behind the existing
capture/editor boundary. Add reminder scheduling when notification permissions
and dates are designed. Cloud sync will need durable identifiers, a migration
strategy, conflict handling, and a backend. Authentication and payments are not
part of this foundation.

Runtime dependencies are the requested stack, Expo Router's supporting native
packages, icons/fonts, and React Native Web for preview. Reanimated and Worklets
are pinned to Expo's compatible versions for Router's native dependency tree.
