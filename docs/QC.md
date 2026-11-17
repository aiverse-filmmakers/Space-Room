# Scene Room verification log

28 October 2026. This is evidence for particular checks, not a claim that all acceptance gates passed.

## Observed browser checks

- Real WASD recording produced 36 camera samples over 1.35 s, with 1.224 m start/end displacement. Gimbal movement was recorded rather than fabricated.
- Original take and a separately saved 15-second refined variation remained selectable after reload.
- Downloaded WebM decoded as VP9, 1024 × 576, 1.321 s; PNG sequence contained 34 distinct-timestamp frames plus camera JSON. Requested export resolution was 1280 × 720, so this exposed a resize race. Export code now locks resolution and pixel ratio; corrected output is pending verification.
- Real OpenRouter image understanding identified the default room's table, person and plinth, returned validated geometry and described assumptions.
- Supplied giant-flower/car image: the first pass identified the correct four objects but placed their ground origins at Y=.5 and framed too tightly. Failed quality gate; not accepted as successful reconstruction.
- Second pass grounded the four subjects but used an excessively wide camera and weak composition. Added image-bound composition calibration; final pass pending.
- IndexedDB save/reload retained the 4.7 MB source reference and restored the 12 mm lens from the second pass. Original source image is retained independently from rough geometry.

## Automated checks

`npm test`: 13 passed after exterior assets and calibration changes. Covers sampling/lens interpolation, deterministic timestamps, smoothing preservation, project validation, rig response, gimbal/FPV distinction, provider response/error validation, procedural asset volume/grounding, composition fit on a synthetic four-object case, fallback framing and shot-package metadata roles.

`npm run build`: TypeScript and Vite passed. Remaining build notices: Three.js chunk exceeds 500 kB; lucide client directives are ignored by this client-only bundle. These notices are not evidence of browser correctness.

## Still required

Corrected export dimensions and content, new shot ZIP, source-image composition and multi-angle usability, real generation and recovery, full mode/lens/framing checks, planned path editing, malformed project preservation in browser, keyboard focus/Escape, modal accessibility, desktop/tablet/mobile layouts, production server and host action contract.

## Later checkpoint on 28 October

- Build and 21 automated tests passed after camera-only fitting, spatial-analysis validation, planned curves/trim, compass/shot planning and the disabled Jev contract adapter. This count does not certify remaining browser or provider gates.
- Browser confirmed four real directional previews and six varied shot images. Selecting the rear three-quarter shot applied its 50 mm camera; capturing it into a storyboard slot changed that slot and the downloaded project retained `captured: true` and the 50 mm pose.
- The agent-authored spatial reading imported without a paid provider call. Saved geometry retains the central flower only 2.2 m behind the car, with left/right head yaws +.38 / −.42 radians. The new fit no longer mutates geometry. This proves the import/constraint path, not the quality of a newly called image model.
- No-spend test: local `/api/status` reported `enabled: false`; `/api/scene` returned 403 and the disabled message before any provider execution.
- A 1.67-second original and five-second smoothed variation remained separate in the saved project. The five-second package contained 1280×720 start/end images, camera JSON and VP9 WebM measured at 4.976 s. Original reference bytes matched exactly.
- Layout approval: preserve the four directional images and six creative-shot slots. Source-review recommendations remain additive proposals, not permission for a redesign.

## Storyboard export checkpoint

- 25 automated tests passed, including saved-shot scene selection, compass heading, 36 mm sensor FOV and explicit reference-ID/file mapping. Production build passed with the existing bundle notices.
- Browser exported `scene-room-storyboard.zip`: 3300×2550 readable PNG sheet, six 1280×720 camera frames, per-shot technical instructions, JSON manifest and original look reference. Inspected the rendered sheet. Five distinct frames are expected in this saved test board because the first slot was deliberately recaptured using the second shot's camera in prior QC.
- Shot names and intentions are editable in collapsed details within each existing card. Browser edited the first test slot, saved the portable project, and re-exported; the edited title and intention appeared in both metadata and camera text. Four compass views and all six slots remain.
- New captures/proposals carry set snapshots. Legacy saved cards without snapshots explicitly report current-scene fallback in exported metadata; they cannot recover an unrecorded historical set.
- Browser evidence and inspected sheet: `exports/storyboard-qc/`. No paid model calls were made.
- Remaining full-product gates above still apply; storyboard export does not qualify final image/video generation or the host decision dispatcher.

## Host action checkpoint

- Added a real local host action interface in the existing Assistant tab: export bounded project context/IDs and apply an operator-authored action file. Supported actions update object transforms/description, set camera/lens, create a refined take variation and annotate a storyboard shot. This is a file handoff, not a live Dashboard connection or Jev dispatcher.
- Entire batches validate against a SHA-256 revision and the project schema before commit. Stale edits, unsupported action/patch fields and invalid geometry are rejected. One undo restores the batch's previous project. The import grants no code execution or external actions.
- Browser exported the real giant-daisy context, rejected a batch with a valid annotation followed by invalid geometry, accepted the valid annotation alone, rejected replay of the now-stale batch, then restored the original annotation through Undo. All four objects, five takes and six shots remained present.
- 28 automated tests and production build passed before browser QC. The added tests cover atomic rejection, source preservation, stale batches, unknown/prototype action names and omission of original image bytes from host context.
- Paid AI remains disabled. Live Jev routing, a host transport and model-specific generation qualification remain open.

## Workflow routing and planned trajectory checkpoint

- Added `/api/workflow` and request planning in the existing Assistant panel. Browser: automatic selection while paid calls are off asks for a task category; selecting Camera movement routes to the host operator and exports the actual task/context. It does not silently call a model.
- The current AI operator authored `take.plan` from the exported scene/camera. Browser imported the five-second Low approach to the car take, selected it, scrubbed to 2.5 seconds and opened its smooth/eased keyframe editor. All five previous takes, four objects and six storyboard slots remain. Reload retained the new take.
- Found and fixed planned trajectory export containing only raw keyframes while playback used curves/easing. Planned camera JSON now contains evaluated 30 fps poses plus the exact end and retains control points/settings separately. Recorded takes retain their original timestamped samples.
- Real browser downloads: planned camera path has 151 poses, each exactly equal to the playback evaluator at its timestamp; the shot ZIP camera data matches the separate download. Start/end PNG bytes differ. Motion WebM decodes as VP9 1280×720, measured duration 4.966457 seconds for the requested five-second realtime preview. No exact timing claim is made for MediaRecorder previews; sampled exports use explicit timestamps.
- 35 tests pass after adding workflow dispatch, host-created shot/planned-take validation and evaluated trajectory coverage. Build passes with the existing bundle warnings. Jev responses are contract-tested with injected data only; no live Jev or paid generation calls were made.

## Generation adapter checkpoint

- Image and asynchronous video adapters now exist with model-capability checks, explicit appearance/composition roles, styled-frame-to-video handoff, exact submitted inputs, persisted job IDs and result packaging. See GENERATION.md for implementation scope and remaining live gates.
- Browser read actual public metadata for the configured image/video models. It showed their identifiers, token-based pricing and supported durations, populated the take-derived movement description and kept both generation buttons disabled. Existing four directional images and six shots remained. Browser console check returned no errors.
- Live local API rejected generation submission with 403 while paid execution was disabled. Capability lookup returned 200 and `enabled: false`; this is metadata evidence only, not a generated shot.
- 43 automated tests pass. Added tests use injected provider responses and real local file persistence to cover idempotent submission, saved inputs, credentials excluded from packages, provider rejection, ambiguous submission, restart/poll/download recovery and retrying an existing result download without a second video submission. No fixture output is shown in the user app.
- Production build passes with existing bundle notices. Final image/video visual quality, motion fidelity, actual provider errors and gallery playback using genuine generated output remain unverified under the no-spend instruction. Other outstanding camera, accessibility and responsive gates still apply.

## Sidebar correction

- User reported a collapsed shot-library strip and truncated subject names. Root cause: the left flex column allowed its children, including the scrollable shot library, to shrink under the combined section height.
- Sidebar children now keep natural section height, with panel scrolling. The library retains its bounded 260 px viewport; shot titles and subject names wrap. Small-screen thumbnail width is reduced within the existing sidebar.
- Browser measured library height at 260 px. All four subject-name elements had matching client/scroll dimensions with normal wrapping; no horizontal name truncation remained. Captured proof: exports/sidebar-qc/browser.png. Production build passed.

## Recommendation coverage clarification

The source-review recommendations are not all implemented. Numbered storyboard/motion exports, separate appearance/composition input roles, camera-derived exported notes, preserved captures and saved take variations exist. Per-shot temporal panels, a cross-shot continuity checker and an explicit pin/unpin control remain open. Saved set snapshots and spatial-analysis constraints are foundations, not a substitute for the continuity checker.

Camera framing/snapshot fixes are built and 45 automated tests pass, but the new snapshot transitions, mode/lens/focus and trim browser qualification were interrupted by the sidebar report and remain open. Do not treat the partial browser sequence as a completed camera gate.

## Simplified-direction status check

- Operator chose one six-shot board with four compact suggestion intents instead of four permanent storyboard tabs. The earlier UI expansion is superseded in PLAN.md section 7; no four-tab UI has been shipped.
- Actual status check: 45 tests passed. Production build initially exposed a type error in the unused production-context draft's board construction; explicit typed construction fixed it, and the production build then passed.
- Temporal panels, pin controls and continuity review are coded/in progress, not browser-qualified. OS chat automation, script/reference integration and live generation/reconstruction quality remain incomplete. No completion percentage or 100% claim is supported.

### Independent launch — 29 October 2026
Production build passed. Start/Stop launchers use user-domain launchd; server parent PID was 1. Stop removed the 4317 listener, restart restored HTTP 200, duplicate start reused the job, and paid AI/generation/Jev flags were false. Chrome production UI opened; saved project backed up at `exports/standalone-backup/giant-daisies.scene-room.json`. One-time Chrome import pending due extension file URL permission. Actual Codex exit not performed. No layout changes.

### MVP finishing pass — 29 October 2026

Observed browser/file checks:

- Recorded actual keyboard input in all seven modes. Static produced zero position/rotation change; Crane changed only Y; Handheld added a small rotation; drone travelled more gently than Gimbal with matching settings. FPV lateral input recorded banking. Form focus and help Escape were exercised.
- Browser trim made a separate 3s take from seconds 1–4 of the existing 5s planned move. Playback progressed. Existing originals remained.
- Temporal panels rendered at 0/2.5/5s. Downloaded storyboard ZIP contains six 1280×720 frames, three additional panel frames, a 3300×1100 numbered strip, 3300×2550 overview, camera text and original reference. Panel strip visually inspected.
- Real flower Wide/Medium/Close framing and person Over shoulder were exercised; OTS correctly disabled for a flower. Clean 1280×720 still was inspected with no selection helper.
- Fixed persistence of continuity comparison/action-axis settings. Real save/reopen retained choices, notes, script and entity-reference binding. Same-set comparison reported no changes; old unsnapshotted shots reported unknown. Threshold/geometry differences covered by contract tests.
- Fixed command revision coverage (pins, source content, scripts, take settings) and live-context export. Invalid multi-action import rejected without partial changes; valid import applied; Undo restored it. Malformed project was rejected. Host contract covers serialized/busy/stale commands, notifications and failing subscribers.
- Narrow 1050×800 and 800×700 windows had no document horizontal overflow; screenshots inspected. At small width, the inspector follows below the scene per existing responsive rules.
- Fixed timeline End rounding. Final-build recorded take duration 0.9083s: saved paused endpoint matched final sample exactly in position, within 2.3e-16 quaternion rounding.
- Isolated QA on port 4318: new app → supplied image import → existing agent-authored spatial analysis → automatic four/six cameras → wheel-level shot → keyboard recording → smoothing/2s variation → save/reopen → real shot ZIP. Reference SHA-256 matched original bytes; WebM VP9 1280×720 measured 1.974391s for nominal 2s. Preview is real-time and may drop frames; trajectory retains explicit timing.

Evidence under `exports/mvp-qc/` (gitignored), including pre-QC original project backup, mode recordings, continuity round-trip, exact endpoint project, numbered panel output and isolated journey package.

Limits / still open:

- Pointer lock was rejected by embedded/background test browsers. Actual foreground mouse aim, orbit-to-operate regression and pointer-release feel remain a hands-on/browser acceptance item; no success claim is made.
- Keyframe follow-up: browser saved lens-only keys at 0/2/4s with 135/12/135 mm. Go-to restored 135 mm; take retained its three-object saved set. Saved-set edit restrictions remain in place.
- Host API has contract and shared UI-handler evidence, not a live Dashboard integration.
- Fresh unattended vision reconstruction and actual final AI output remain unqualified while paid calls are disabled. Host-authored analysis is not a substitute.
- Automatic approval review rejected replacing the active 4317 project with a clean fixture. No bypass was used; later clean checks ran on independent 4318 storage. Test takes/notes already added at 4317 remain alongside originals; `pre-qc-project.json` preserves the six-take starting project. Cleanup/restore of active work was not performed.

Storyboard/timeline navigation now uses scroll margin so the sticky toolbar does not cover section headings; browser screenshot verifies it. Final suite: 51 tests passed; final production build passed. Independent 4317 service health check passed after the build; temporary 4318 server was stopped. Release is not frozen or labeled 100%.

### Mouse-recording follow-up, replay discovery, view updates and global formats

- User supplied the foreground test file `/Users/bogdan/Documents/Untitled scene.scene-room.json` and reported operating the mouse then leaving camera mode. The file contains one 52.2664s Gimbal take, 1,351 samples, up to 179.78° rotation relative to the start and 9.685m travel. Real playback progressed in the isolated browser. This is user-operated evidence; the automated native-pointer session itself was interrupted/timed out. Do not describe that automation attempt as a clean pass.
- Playback discovery fixed: moved the existing transport directly below the camera, added visible Play/Pause labels, made it sticky during scrolling, and let Play latest take work immediately after reopening. Record-stop now identifies the locally saved take and directs the user to playback. No duplicate transport or new navigation tabs. Four facing/six shot areas remain.
- Camera Undo defect reproduced with actual action-file import: viewport stayed at [2,2,6]/85mm after Undo. Fixed undo snapshots to retain the actual pre-edit camera. Browser retest restored [4,1.7,5.5]/35mm, quaternion, aperture and focus exactly (`camera-undo-proof.json`).
- All four directional slots can be updated explicitly from the camera. Custom views are labeled, saved with their scene/camera snapshots and protected from automatic set refresh. Six shots and temporal panels also accept explicit manual updates while pinned; host-generated shot replacements still require unpinning. Browser tests updated all four slots, updated North again while pinned, replaced a pinned storyboard camera and a saved temporal panel. After an actual set edit, all four custom views and pinned shot stayed unchanged (`view-update-proof.json`).
- One top-level Frame format selector (count=1 in DOM) controls all local views/outputs. All ten presets exercised in browser: 16:9, 9:16, 1:1, 4:3, 4:5, 3:2, 1.85:1, 21:9, 2.39:1, 2.76:1. All four directional images, all six shots, three saved panels and take thumbnails regenerated at matching dimensions. Fixed a missing format dependency in the preview refresh cache. Saved poses, original recorded samples and set geometry did not change when changing formats. Save/reopen restored 9:16 and portrait thumbnails.
- Inspected real stills: square1280×1280, classic1280×960, scope1280×536 and portrait720×1280. Portrait storyboard contains six720×1280 shot images plus three720×1280 temporal panels, a3300×2291 strip and3300×4932 overview with matching metadata. Overview visually inspected: images retain portrait proportions and captions stay below them. Portrait motion package contains720×1280 first/last frames and VP9 WebM720×1280 (1.968458s for nominal2s); camera.json declares9:16. No paid generation used.
- Provider adapters now carry the selected ratio, validate supported capabilities, and reject styled-video anchors with mismatched ratios. Contract tests cover those format request paths; live provider quality remains unqualified.
- Final format suite:56 tests pass; production build passes. Main independent service was restarted to load the updated backend with paid flags off. Isolated4318 instance remains available for the current checks. Existing source reference images remain unchanged; the global format applies to composed views, not destructive edits of appearance originals.
- Evidence: `exports/mvp-qc/formats/` contains actual PNGs, extracted portrait storyboard/motion packages, preservation.json and global-selector.png. Small-window viewport override did not reach the targeted background tab during this follow-up; do not claim a fresh390px check from that attempt.

Remaining release gates: orbit-to-operate transition acceptance, full final acceptance reconciliation, fresh unattended image analysis and useful real AI-shot qualification. The no-spend restriction still applies. No 100% or release-freeze claim.

### Settled orbit-to-operate transition — 29 October 2026

On the isolated 4318 QA origin, performed an actual orbit drag, allowed damping to settle, exported camera context, switched to Operate without movement input and exported again. Position delta was 0 m; quaternion component distance was 1.12e-16; focal length, aperture and focus were identical. Returned to Explore. Evidence: `exports/mvp-qc/orbit-operate-proof.json`. The first immediate post-drag comparison included residual orbit damping and was not used as a stationary-transition acceptance result. This verifies the settled transition, not a clean automated pointer-lock/aim test or subjective foreground operating feel. No paid calls were made.

### Embedded foreground capture follow-up — 29 October 2026

In isolated QA tab 4318, Operate enabled normally. Clicking the canvas rejected pointer capture and showed the existing capture-failure message. Repeated once after explicitly presenting the in-app browser: capture still absent. Escape returned to Explore. No browser console errors were recorded. This is a failed capture attempt in the embedded browser, not proof of a working native aim path or proof of an app defect. User-operated recorded-mouse evidence above remains valid. Native browser capture/aim qualification remains open; the successful settled orbit transition supersedes that portion of the earlier remaining-gates list.

### Native Chrome capture, travel and replay — 29 October 2026

Created a separate Chrome QA tab on 4318. Background tab clicks failed capture. Selected its actual native Chrome tab, clicked the canvas through the native app UI, and observed Chrome’s cursor-capture/press-Esc notice. Escape returned to Scene view. Recorded another native test with W held 700ms, an attempted native mouse drag, then Escape: 7.5757s, 196 samples, 0.51666m travel. Playback advanced from 0.48s to 3.33s. Saved the clearly named project inside the app QC directory, without replacing the 4317 project. Rotation delta in that new take was zero, so the automated drag does NOT qualify mouse aim; capture, keyboard travel, Escape and replay have new native evidence. The earlier user-operated take contains actual rotation but remains separately attributed. Evidence: `exports/mvp-qc/QA - native mouse acceptance.scene-room.json` and `native-mouse-proof.json`. No code changes or paid calls.

### Camera movement presets — 29 October 2026

Reviewed the public library’s 46 names and prompts. The picker includes 34 camera-only source movements plus dolly zoom in/out, sliding parallax zoom in/out and rack focus (39 total). Twelve subject-animation/optical/time/world-transition entries were left out and documented in FUTURE-FEATURES.md following the operator’s instruction. No videos were watched or claimed as evidence.

Presets create deterministic 60Hz planned take samples through the existing evaluator, not another player. Tests cover the entire available catalogue, save roundtrip, projection-preserving dolly zoom throughout playback, full circular orbit, lens-only zoom versus physical dolly, custom camera/lens endpoints and focus targets, and atomic rejection of incompatible/missing inputs. Browser QA on independent origin 4319 created an automatic 3s dolly zoom (181 samples, 50→32.5mm), replayed it to completion and created a custom arc from storyboard shots 2→5 with person→table focus. A downloaded project was inspected: camera, lens and focus samples were real and retained. Existing 4317/4318 projects were not replaced.

Evidence: exports/mvp-qc/movement-presets/browser-project.json, ui.png and desktop.png. Layout observed at a narrow browser size and desktop screenshot; an explicit viewport request did not report the requested dimensions, so no exact breakpoint claim. User-visible path warning explains that presets do not perform collision avoidance. Real image reconstruction and final AI generation gates remain unchanged and no paid calls were made.

### Direct camera preset UX and fixed-position regression — 29 October 2026

Operator feedback supersedes the previous inspector/dropdown UX. Moved presets into a compact strip immediately above the camera. Common movements are buttons; the full library is grouped buttons. Set start/end here captures the actual camera and selected focus subject; no movement/frame/focus dropdowns remain. Uncaptured start uses the current camera, selected subject defaults to the main subject, and captured composition is retained even when a focus object is selected.

Root error: a saved travelling end position was applied to a fixed-position preset, and the builder rejected it after Generate. Builder now interprets only the compatible end fields: pan yaw, tilt pitch, zoom lens, focus distance; the start position stays fixed. Static holds its angle/lens. UI explains that behavior. Dolly zoom retains its start subject and calculates lens compensation even with captured end poses instead of requiring manual matching (the old check also compared end focal length against every intermediate sample). Fixed the primary-button hover contrast uncovered during visual QA.

64 automated tests pass; production build passes. Focused tests cover fixed-position stale endpoints, preservation of a manually framed start with a focus subject, and automatic dolly-zoom lens matching. Browser on isolated 4320: selected the person, captured start, dragged to a different position, captured end, chose Pan right and generated successfully. Playback advanced and completed. Cleared captures and generated Dolly in from current camera, then Slow zoom in through the button library. DOM counted zero select elements inside movement controls. Saved and reloaded the real project: all three takes retained. Download inspection confirms Pan: 121 samples, zero translation and constant 35mm; Dolly: 2.7703m travel; zoom: zero travel and 35→70mm. Evidence in exports/mvp-qc/direct-movement/ (browser-project.json, proof.json, final-ui.png). The disposable test tab/server were closed; existing 4317/4318/4319 instances and user projects were left alone. No paid calls or dependencies added.

### Automatic overview visibility and room-wall obstruction — 29 October 2026

Reproduced the supplied screenshot's cause with actual geometry: a fitted outside camera was entirely blocked by the opaque back room wall. The overview fitter now tries progressively wider 35/28/24/20/16/12mm lenses to fit the subjects from inside the room. When an overview needs an outside camera, only obstructing synthetic room boundary walls are cut away. The shared room shell and cutaway calculation are used for live camera, thumbnails, stills, takes and exports; subjects/props remain unchanged and interior walls restore when the camera returns inside. Far clipping now scales with the set and camera rather than using a fixed 300m ceiling.

Overview checks project real mesh sample points and trace sight lines, distinguishing visible subjects from blocked/empty/misdirected cameras. This is geometric visibility, not an AI aesthetic/image-similarity score. Fully occluded views show a needs-framing state instead of a blank thumbnail. Manual compass updates with no visible set subjects are rejected with a clear warning and preserve the old card. Cache signature versioning refreshes old previews; saved/pinned camera poses are retained and rechecked against their saved sets. Checks deliberately permit normal subject-to-subject occlusion rather than moving props to make every object visible.

70 tests pass; production build passes. Tests cover the original wall-blocking failure, dynamic restoration, all four directions, portrait/tight-room cutaway fallback, empty/misdirected frames, exterior scenes, saved pose preservation, report validation/roundtrip and large sets beyond the old far plane. Isolated browser 4320 refreshed old cached previews and visibly rendered all four faces. South moved inside at12mm; West at20mm; East used a labeled cutaway. Downloaded reports: North/South/East have3/3 visible subjects; West2/3, with natural occlusion. All actual images contain thousands of colours; the lowest dominant-colour fraction is0.249 and highest0.335 (pixel statistics are corroboration, not the geometric validator). Browser attempted Update North from a camera facing away: warning shown and prior North preserved. No source objects were moved.

Evidence: exports/mvp-qc/view-visibility/four-views.png, browser-project.json, proof.json. Existing user projects and 4317/4318/4319 services were not replaced or stopped. Disposable 4320 QA tab/server closed. No paid calls or new dependencies. This closes the reported room-wall/blank-overview defect; live AI reconstruction/final-shot qualification remains open.

### Final visual polish and local regression — 29 October 2026

Applied the native macOS-inspired surface/typography/control finish without replacing the accepted four-view/six-shot layout. Added named help, selected-state semantics, reduced-motion scrolling, clearer secondary text, consistent focus/control sizes, responsive movement controls and compact paging for long planned key lists. Protected recording/playback/export with disabled conflicting controls. Camera response remains adjustable during recording.

Isolated browser origin 4320: recorded a new 0.75s keyboard take (21 samples), replayed a planned take to completion, verified busy controls, retimed 2s to a separate 1.5s variation and trimmed that to a separate 1s take. Help dialog trapped keyboard focus and Escape restored focus to help. A 121-key take displayed one row and Next selected key2. No unlabelled visible form/button controls or buttons shorter than27px were found in the desktop DOM inspection. This is not full screen-reader certification.

Measured actual CSS widths1280,800,390 with no horizontal page overflow. Browser viewport requests were scaled; assertions use measured DOM dimensions. Temporary overrides were reset. Saved/reloaded project retained six takes, four directional slots, six shot slots and the imported original reference byte-for-byte. A seventh portrait dolly-zoom take was created afterward. Importing malformed project JSON showed the supported-project error and preserved that seven-take project. Captured browser error logs were empty. A late attempt to dismiss the transient error found it already gone; no app failure was inferred from that locator timeout.

Actual portrait exports inspected: AI package start/end PNGs720×1280; motion WebM720×1280,1.974364s for a2s take; original reference exactly matches source bytes; camera metadata and timed samples present. Storyboard ZIP contains six720×1280 panels, camera notes, metadata, original reference and3300×4932 numbered sheet. Appearance-reference preservation is file integrity, not proof a generation model obeys it. The fixture set remains a simple room, not a fresh AI reconstruction of the flower image.

Evidence: exports/mvp-qc/final-polish/ (desktop.png, phone.png, browser-project.json, roundtrip-proof.json, portrait-package/, export-proof.json). Browser infrastructure stalled once during save/reload; recovered from the real downloaded backup. Native pointer aim is not newly qualified here. No paid AI calls, dependencies or changes to user projects/services4317/4318/4319. Live reconstruction/final-generation gates remain open.

### Timing position and visible movement library — 29 October 2026

Moved timeline and smoothing immediately after camera transport and before both coverage sections. Added Slow–Fast sliders for preset duration and take retiming, using the existing duration/refinement path. Expanded the grouped camera movement library by default; replaced ambiguous All39moves label with Browse camera movements(39), and keep the library open after selection.

70 tests and production build pass; diff whitespace check clean. Isolated browser4321: preset speed4× changed6s to1.5s and generated a real take. Take speed0.25× changed that take to6s, smoothing accepted, and Save variation created a separate6s take while preserving the1.5s original. DOM order is toolbar→presets→camera→transport→timeline→four views→six shots; no horizontal page overflow in that check. Screenshots: exports/mvp-qc/timing-ux/. No paid calls, dependencies or changes to active user projects. This is a focused regression, not another full product qualification.

### Frame-local image generation — 29 October 2026

Implemented model selector, Create image, compact image direction, Mock-up/Generated toggle and generated-only previous/next controls for all four directional cards, six storyboard cards and captured start/middle/end panels. Uses existing generation job storage/guards. New successes select latest; failures retain previous versions; changing frame/set/reference/format produces an earlier-framing marker. Saved model/prompt/display/selection and frame-to-job bindings roundtrip. No geometry or camera movement behavior is replaced by generated media.

74 automated tests and production build pass. New tests cover exact saved-set/reference binding and missing references, late-added original references, changed camera/format/reference fingerprints, frame-local completed-version ordering, selection fallback, project validation/roundtrip, selected model discovery/endpoint pinning/persistence, unsupported model/format rejection and absence of video discovery on selected still requests. Test caught and fixed unsafe dot-only model author validation. Browser found empty reference IDs preventing creation after later import; fixed fallback for empty bindings while preserving strict nonempty bindings.

No-network fixture4322 uses the real GenerationService with injected responses, explicitly labeled QC models, and returns the submitted blockout as test output. This is NOT AI quality evidence. Actual browser: North modelA result1, modelB result2, latest2/2, previous1/2, direct Mock-up; intentional422 retained both results; global9:16 showed earlier-framing marker; captured start panel produced its own1/1 result. Downloaded project contains both successes, failed attempt and panel result with exact model/frame/key links. New tab restored selected North1/2/modelB and panel1/1; switching North next showed2/2 and both result images decoded. No horizontal document overflow at desktop. File upload/save tools stalled; short reload timed out, then a new tab recovered the saved project. These browser infrastructure delays are recorded rather than counted as app success.

Actual no-spend server4323: all three flags false; catalogue GET200 with43 models including Seedream5.0Pro; generation POST403 before provider submission. Existing main projects were never loaded with QC fixtures. Evidence: exports/mvp-qc/frame-images/browser-project.json, versions.png, fixture-calls.json and jobs/. Fixture source is tests/frame-image-browser-server.mjs, isolated and not imported by production. The fixture makes no external network calls. Paid generation, fresh reconstruction and final output quality remain open gates.

### Bounded paid provider checks — 29 October 2026

See LIVE-VALIDATION.md for actual model/output/cost evidence. Fresh analysis failed validation; Seedream5Pro still appearance and changed composition were observed; Veo video failed continuity; Seedance video showed cleaner continuous movement but missed the intended ending.76 tests/build pass with regressions for the live-found depth and mixed-bound failures. Provider-reported cost USD0.550353125, conservative total including unconfirmed reservations USD0.650353125 against USD1. Spending run closed; main flags off and main active project preserved. No full release or exact motion claim.
