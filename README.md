# Scene Room

Independent virtual cinematography workspace for AI filmmaking. Build a rough set from a visual reference, operate a damped camera with WASD/mouse, record and refine takes, and export their composition and motion guidance.

## Hosted and local-first workspace (new)

Open the GitHub Pages site at https://aiverse-filmmakers.github.io/Space-Room/ in Chrome or Edge. This is a **static UI**; GitHub hosts no API keys or projects. Click **Connect workspace** to choose a local folder. The browser saves `Projects/<project-id>/project.json`, a recoverable backup, and `Generations/<job-id>/` for completed provider jobs. Previously saved browser projects are copied when connecting an empty folder. Existing folders are never silently replaced by browser state.

Use **Import GLB** to add a textured self-contained model, adjust its position and dimensions in Object, and use **Scene as GLB** in Export to continue in Blender. External-resource `.gltf` files are rejected; export a self-contained `.glb` instead. Camera takes remain in the project JSON, not the geometry GLB.

The **Assistant** tab can export scene context and import a ChatGPT-authored action/analysis JSON without any model login or server. Enable **Review imported AI scene changes before applying** to approve or discard a proposed reconstruction. Your existing direct reconstruction path remains available on the Mac server.

For paid **Kie.ai generation** from the hosted page, run **Start Scene Room.command** and **Connect AI Bridge.command** on your Mac. A short pairing code authorizes a single browser session to the local helper. The API key stays in macOS Keychain; no keys or pairing tokens go to GitHub, projects, or browser storage. Each Generate action prompts before spending. Completed jobs are copied with exact inputs and media to the selected project folder when possible. This Mac must remain running while the helper is used. No helper is needed for core 3D editing.

See [Local-first workflow](docs/LOCAL-FIRST.md) for browser support, initial setup, recovery, and limitations.

## Run locally

Use the existing isolated dependencies in this package. Requires Node 22 or newer.

```sh
cd apps/scene-room
npm run dev
```

Open http://127.0.0.1:4317. For a built local app:

```sh
npm run build
npm start
```

The production server also serves the AI API. `vite preview` only previews static files and does not supply AI routes. Both servers bind loopback. `PORT` changes the production port.

## AI connection

The server reads `OPENROUTER_API_KEY` from the process environment or the existing shared owner at `~/.config/ai-verse/secrets/openrouter.env`. It never sends the credential to the browser or saves it in a project. Do not paste keys into source files. `SCENE_ROOM_MODEL` overrides the low-cost vision model for independent testing.

Paid calls are currently disabled. The server rejects model execution unless its explicit `SCENE_ROOM_ALLOW_PAID_AI` switch is enabled; no switch should be enabled without the operator changing the current no-spend instruction. Host-provided analysis can be imported without a provider call. When paid execution is authorized, reference files are sent only after requesting a set build or AI direction. Original images stay in the project. AI-created geometry is validated and can be undone. Hidden surfaces and real-world scale are estimates. Image-space composition fitting is a layout aid, not evidence of accurate 3D recovery.

## Controls

- Explore: orbit and inspect the set.
- Operate camera: click the view to aim with the mouse; W/A/S/D travel, Q/E height, Shift precision, Escape release.
- Adjust speed, acceleration, braking and aim smoothing independently.
- Record a take, replay it, adjust smoothing/duration, and save a separate variation.
- Save project downloads a portable JSON file with original references and takes. Browser autosave uses IndexedDB. Open validates before replacing the current project.

## Outputs

Current PNG frame, timed camera trajectory, real-time WebM preview, deterministic 24 fps PNG sequence, and a complete AI shot ZIP. The ZIP separates appearance references from rough start/end composition and camera-motion guides. Video may drop frames on busy machines; PNG sequences evaluate explicit timestamps.

Image/video generation adapters and recovery are implemented behind disabled paid-generation controls. Export → Generate AI shot checks actual model support without generating. See [generation workflow](docs/GENERATION.md) for the staged input roles, result storage and live-test limitations. AI generation quality and Dashboard integration are not yet qualified. The plan and QC log track remaining acceptance gates. Do not treat a successful build as completion of those workflows.

See [design](docs/DESIGN.md), [implementation plan](docs/PLAN.md) and [verification evidence](docs/QC.md).

## Run independently of the AI chat (macOS)

Double-click **Start Scene Room.command** in this folder. It starts the existing production server under macOS launchd and opens your default browser at http://127.0.0.1:4317/. Closing the chat or Terminal does not stop this service. **Stop Scene Room.command** stops it explicitly. After restarting/logging out of your Mac, run Start again. The Mac must remain awake for use; this is local hosting.

The service uses the existing Node installation, with no added dependencies, and explicitly disables paid AI, generation and Jev. Generated service configuration and logs live in `artifacts/service/`. It does not install an automatic login item. Source changes require `npm run build` and a Stop/Start to update the running production app.

Normal browsers have separate project storage from the in-app browser. Click **Open** once and select `exports/standalone-backup/giant-daisies.scene-room.json` to restore the saved daisy camera study (backup from the previously downloaded project). Thereafter autosave belongs to that browser. Keep using **Save project** for portable backups, and avoid private browsing for persistent work.

Verified 29 October 2026: production build passes; launchd start/stop/restart and duplicate start pass; stopping removes the listener; restarted server returns HTTP 200 and all paid flags false. Server PID had parent PID 1, independent of the command session. Chrome opened the production UI. Automatic backup import was blocked by the browser extension's file URL permission; manual Open remains necessary. Closing Codex itself was not tested during this work.

## Frame format and updating views

Choose **Frame format** once in the toolbar above the camera. It applies to the camera, four facing views, six shots, temporal panels, take thumbnails and local still/storyboard/motion exports. Landscape, portrait, square, classic and cinema presets are available. The project retains the selection. Cameras are rendered at the selected ratio; source appearance images are preserved. Scope ratios set the composition gate; they do not simulate anamorphic lens artifacts. AI providers must explicitly support the selected ratio; unsupported output formats are flagged rather than silently changed.

Use **Update from camera** beneath a directional view or saved shot to replace it explicitly. Pins protect automatic suggestions and set regeneration. Your manual update remains available, including for saved action panels.

Record/play controls are directly beneath the camera. Escape stops operation and saves an active recording as a local take. **Play latest take** replays the latest saved take after reopening; selecting another take in the shot library chooses a different recording. Save project downloads a portable backup; it does not render a video.

## Movement presets

The **Camera moves** strip is directly above the camera. Position the camera, click a subject in the set (or its row in Set & subjects), choose a movement button, then **Generate camera movement**. Play the saved take with the transport beneath the camera. If no subject is selected, the app uses the main subject (car, otherwise person, otherwise first object). The current camera is the default start; its composition is retained. No AI call is needed.

Optional **Set start here** and **Set end here** capture the camera and currently selected focus subject directly. Position the camera and select the relevant object before each capture. View/Clear buttons let you inspect or reset a capture. No frame, target or movement dropdown is needed. Six common moves are immediately available; **All 39 moves** opens a grouped button library.

A fixed-position move uses only compatible parts of an end capture: pan uses horizontal angle/focus, tilt uses vertical angle/focus, zoom uses lens/focus, rack focus holds camera and lens, and Static holds camera/lens. The position stays at the start, as explained beside the controls. A dolly zoom keeps the start subject and computes the matching lens automatically (12–135 mm range). It no longer requires matching end-lens values by hand. Ordinary travelling presets retain captured start/end camera poses. Generated takes use existing replay, smoothing, timing, trimming and export controls.

Paths do not avoid obstacles or invent hidden interiors. First-person is camera motion without animated limbs; whip-pan motion blur is not simulated. Tracking, time-lapse and infinite/Earth zooms remain excluded; see [potential future features](docs/FUTURE-FEATURES.md).

## Automatic view visibility

Four facing views are checked against real scene geometry. Interior overview cameras stay inside the room when a wider lens can fit the set. Outside/near-wall views automatically cut away obstructing synthetic room boundary walls, labeled on overview cards; subjects and props are not removed. The same rule applies when viewing and exporting saved cameras. Returning inside restores the walls. Old cached previews refresh automatically after this update while custom camera poses remain saved.

The check flags views with no visible subjects, and a manual facing-view update cannot replace a good card with an empty/misdirected image. This checks visibility, not creative quality or accurate recovery of unseen surfaces. Ordinary occlusion between subjects remains possible and intentional.
