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
Open the QR code with the installed AI Note development build. Voice requires
this build, not Expo Go (see the Android instructions below). The phone and
development computer should be on the same network. For platform
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

Home capture reviews the text with the local parser before saving. The preview
shows the suggested type, original trimmed text, date/time, and shopping items.
Change the type, save, or cancel to return to the untouched input. Nothing is
stored before confirmation. The dedicated new-note editor remains a manual flow.
The microphone opens native voice capture in a development build. A `reminder` is currently
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
  services/noteParser/
    types.ts              Async NoteParser contract and ParsedNote result
    localNoteParser.ts    Isolated English rule implementation
    index.ts              Parser selection / public service boundary
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
  scheduledDate?: string; // Local calendar YYYY-MM-DD, not a UTC instant
  scheduledTime?: string; // Local HH:mm; can exist without a date
  items?: string[];
  confidence?: number;   // 0–1 heuristic review score
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
npm test
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

Stage 2 adds intelligent structured capture without a network service. The UI
imports only the `noteParser` abstraction from its service index. The async
contract accepts text and an optional reference date for deterministic tests;
it returns type, text, optional date/time/items, and confidence. A future AI
adapter can implement that contract and replace the index binding without
changing the preview. The preview handles pending/error states and ignores
late results after cancellation.

Rules currently support English `today`/`tomorrow`, 24-hour `HH:mm` (also `9:05`),
imperative tasks, explicit `Idea:`/`Note:`/`Thought:` prefixes, and purchase lists
split on commas, semicolons, or `and`. Explicit note prefixes take priority;
otherwise dates/times take reminder priority over shopping or tasks. A dated
purchase keeps its extracted items. Text is preserved apart from outer whitespace.
Conflicting dates/times choose the first match and show low confidence. Unsupported
or ambiguous language falls back to a note, with a review hint below 0.65.
These scores are heuristics, not calibrated AI probabilities. Other languages,
weekdays, time zones, recurring dates, and complex item names are not supported.

The optional metadata extends the existing version-1 envelope without renaming
its storage key: old notes still validate and load without migration or data
rewrites. New metadata survives reload and is shown in details. Manual type
overrides retain extracted metadata and the original detection score. Editing
text does not reparse or alter the captured metadata; the editor explains this.

Stage 2 verification: 18 tests passed (parser cases, invalid/ambiguous inputs,
calendar rollover, old-note validation, metadata JSON round trip). Tests use
Node's built-in runner and the existing TypeScript compiler, with no added
dependencies. TypeScript, ESLint, all 21 Expo Doctor checks, and production
web/Android/iOS exports passed. Browser checks covered existing-note loading,
preview, cancel without saving, manual type override, and metadata persistence.

Recommended Stage 3: editable structured fields and richer date interpretation,
including clarification for ambiguous input, followed by native device testing.
Keep notification scheduling separate until its permissions and behavior are designed.

Add AI classification behind the existing
capture/editor boundary. Add reminder scheduling when notification permissions
and dates are designed. Cloud sync will need durable identifiers, a migration
strategy, conflict handling, and a backend. Authentication and payments are not
part of this foundation.

Runtime dependencies are the requested stack, Expo Router's supporting native
packages, icons/fonts, and React Native Web for preview. Reanimated and Worklets
are pinned to Expo's compatible versions for Router's native dependency tree.

## Stage 3: Voice capture

Tap the microphone on Home, grant permissions, speak, and tap **Stop and review**.
The device may also end recognition automatically after a pause. The final
transcript is appended to any existing draft, shown in the capture input, and
sent through the same `noteParser` and `CapturePreview` as typed text. Nothing
is saved until you confirm. Cancel discards the current recording and leaves
your earlier draft intact; cancelling the preview keeps the transcript editable.

The warm capture card now includes System / English / Ukrainian language choices,
permission-request, listening (elapsed seconds), transcribing, and error states.
The session stops after 60 seconds at most, and stalled startup/transcription
times out after 15 seconds. Cancel is available during permission requests,
listening, and processing. Leaving Home or backgrounding the app cancels capture.

Architecture:

```text
src/services/speech/
  types.ts           SpeechService, SpeechDriver, event and snapshot contracts
  speechSession.ts   Provider-independent lifecycle and cancellation handling
  index.ts           Factory, native adapter, lazy module loading, locale default
src/components/VoiceCapture.tsx  Small controls that depend only on SpeechService
tests/speechSession.test.cjs    Mocked session lifecycle tests (no microphone)
eas.json                       Optional internal development APK build profile
```

The service exposes async `start(language?)`, `stop()` (final transcript),
`cancel()`, and snapshot subscriptions. Generation guards ignore late events
and permission results after cancellation. Timers/listeners are released when
sessions finish. Provider errors map to readable permission, no-speech, network,
language, or recognition messages. Only final results enter the notebook flow.

Recognition uses [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition),
version 57 for Expo SDK 57, wrapping Android SpeechRecognizer and iOS
SFSpeechRecognizer. No AI/LLM API, key, backend, or speech-upload code is added.
Audio files are not persisted by the app. The operating system speech provider
may send audio to its own servers and may require a network connection; offline
recognition is not guaranteed. This is stated beside the microphone.

English (`en-US`) and Ukrainian (`uk-UA`) can be requested; availability depends
on your installed recognition service, language models, device, and OS. System
uses `expo-localization`'s first device locale (English fallback). Unsupported
languages produce a helpful message rather than silently switching languages.
The Stage 2 parser is still English-only: Ukrainian transcripts can be saved
and manually classified, but Ukrainian dates/items are not automatically parsed.

### Expo Go and platform limitations

**Voice does not work in Expo Go.** Install an AI Note development build with
the native module. The module loads lazily, so Expo Go can still support typed
notes and shows a useful message on a microphone tap. `npx expo start --go`
explicitly selects Expo Go; regular `npm start` selects the development client.

Web intentionally supports typed capture only and shows an unsupported-platform
message on microphone tap. Browser speech APIs are not used. An Android phone
needs an enabled speech recognition service (commonly Google's); devices without
one receive a helpful error. Real-device testing is recommended over simulators.

`app.json` contains the native package identifiers and the speech config plugin.
The plugin adds Android RECORD_AUDIO permission and recognition-service visibility,
plus iOS microphone and speech-recognition descriptions. Runtime permission is
requested only after tapping the microphone. If denied, enable Microphone (and
Speech Recognition on iOS) in system app settings and retry.

### Test on your Android phone

Local build option (no Expo cloud account needed):

1. Install Android Studio with Android SDK/platform tools and its supported JDK;
   configure the Android development environment and USB debugging on your phone.
2. Connect the phone by USB and authorize USB debugging. Confirm it appears in
   `adb devices`.
3. In the repository run:

   ```sh
   npm ci
   npm run android:device
   ```

   This generates the ignored native Android project, builds the development app,
   and installs it on your selected phone. For subsequent JavaScript sessions,
   use `npm start` and open the project in the installed AI Note development app.
   Keep the phone and computer on the same network.

Alternative without a local Android build toolchain (requires an Expo account):

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
```

Follow EAS project setup prompts, install the resulting internal APK on your
phone, then run `npm start` locally and scan the QR code using the development
app. Building on EAS uploads the project and uses your account's build allowance;
no cloud build has been submitted as part of this implementation.

On macOS with Xcode, use `npx expo run:ios --device` for an iPhone build (Apple
signing is required). Rebuild the native app after changing native dependencies
or config-plugin permissions; a Metro refresh alone cannot add native modules.
After installing new JS dependencies, restart Metro with `npm start -- --clear`
if an old running server reports stale module-resolution errors.

Phone smoke test: grant permissions; speak an English shopping list; stop and
review; verify no note exists before Save; save and reopen. Then test Ukrainian,
silence, permission denial, cancellation during listening, and leaving Home.

Validation: 30 tests pass (18 existing parser/model tests and 12 speech lifecycle
tests), TypeScript and ESLint pass, Expo Doctor passes all 21 checks, and
web/Android/iOS JS/Hermes exports pass. Native APK/IPA compilation and actual
microphone recognition have not been tested here: this workspace has no Android
SDK/JDK or connected phone available. Bundling does not replace a device test.

Recommended Stage 4: editable transcripts/structured fields and Ukrainian parser
rules, plus real-device voice QA before adding any external AI provider.
