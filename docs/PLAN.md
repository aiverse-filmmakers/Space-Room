# Scene Room — MVP finish plan

29 October 2026. This is the current consolidated plan. Status: working standalone previs core; release acceptance incomplete. Earlier research, requirements and superseded four-tab proposals are preserved in [the historical plan](archive/PLAN-through-2026-10-29.md). The historical document must not reinstate cancelled UI scope. Uses the existing Plan Maker method; no new planning framework.

## Outcome and fixed boundary

Complete one trustworthy workflow:

**Reference image → approximate editable 3D set → four facing previews and six shot options → operate/record/refine a camera → save/reopen → export cinematic guidance → qualify one supported final-AI-shot route.**

Keep the accepted movie-workflow layout. The OS supplies chat, voice, model selection and authentication when Dashboard integration happens later. Scene Room supplies a small tested context/action interface now. No separate chat, four permanent storyboard tabs, nine-panel management system, new rendering engine or new dependency/service is needed for this MVP.

The four small request starters above the six shots are Imagine, New angles, Story beats and A→B. They reuse the same scene/context/actions as the future OS chat. They prepare requests and expose missing inputs; they must not silently spend credits, replace pinned framing or invent script facts.

Minimum code means reusing existing functions and state, removing unused superseded scaffolding, and fixing root causes. It does not mean compressing code, hiding broken controls or calling a smaller unverified flow complete. Preserve existing work and recoverable user data. Do not add new feature scope during the finishing pass; record later ideas without implementing them.

## Current evidence

- Core camera operation, actual recorded motion, replay, smoothing/retiming, planned movement, save/reload and exports have focused tests and earlier browser evidence.
- Four facing previews and six real shot-camera images have browser/save/export evidence. Sidebar compression/truncated labels were fixed and visually checked.
- Seventy-six automated tests and the live-validation production build passed. Logs: artifacts/service/live-validation-tests.log and live-validation-build.log. These are partial evidence, not release acceptance.
- Per-shot temporal panels and pin protection have browser/export evidence. Continuity settings, script/reference links and project save/reopen were checked. Settled orbit-to-operate pose preservation has browser evidence; clean automated foreground mouse aim/operating feel remains unqualified.
- Fresh live image analysis was tested under the authorized USD1 validation run. Returned spatial candidates failed validation (reversed depth, inconsistent bounds/near constraints); the automatic reconstruction quality gate remains failed/open. Prior agent-authored geometry is not a substitute. See LIVE-VALIDATION.md.
- Image/video adapters and job recovery are implemented and contract-tested. Real Seedream5Pro stills have now returned and their appearance/composition inspected. Video quality is evaluated separately in LIVE-VALIDATION.md; no full release acceptance is claimed.
- Per-frame model selection, image creation, generated-version arrows and a direct Mock-up/Generated switch are implemented on directional, storyboard and temporal frames. No-network browser qualification covers versions, failed requests, changed framing and save/reopen. Live free catalogue reads and the disabled-spending guard passed; generated visual quality remains unqualified.
- File handoff and an in-process readContext/execute/subscribe boundary share the validated action handler. Current camera/selection and script/reference links are available; contract tests pass. Actual Dashboard host integration is deferred.

See [QC.md](QC.md) for exact observed checks and their limits.

## Finish sequence and observable acceptance

### M1 — Close the existing local filmmaking workflow

Reuse camera rig, timeline, scene validation, shot snapshots and render/export functions. Fix defects before adding controls. Finish the four request starters and the already-added secondary shot details without expanding the main layout.

Acceptance:

- Seven existing camera modes, WASD/mouse, speed/acceleration/braking/aim smoothing, lens/focus and subject framing behave as labeled. Escape/form focus are correct; orbit-to-operation and paused bank/lens do not jump.
- Record, replay, refine, retime, edit planned keys and trim through the same evaluator. Originals remain recoverable. A paused take/saved shot uses its saved set, not an unrelated current revision.
- Four facing previews and six options persist. Every view and temporal panel can be explicitly updated from the camera. Pinning protects automatic regeneration; an explicit camera update remains available. Start/middle/end panels use real camera poses/timestamps and export correctly. Continuity review reports only supported comparisons and exposes unknowns without changing creative choices.
- One global frame-format selector controls the live camera, directional/shot/panel/take previews and every local export. Support 16:9, 9:16, 1:1, 4:3, 4:5, 3:2, 1.85:1, 21:9, 2.39:1 and 2.76:1 without stretching. Persist the selection and reject unsupported provider formats.
- Valid projects round-trip; malformed files or failed actions preserve current work. Current stills exclude selection helpers and have the intended output dimensions.

### M2 — Finish the smallest production context and host boundary

Keep script/scene notes, named characters/props and typed reference links inside the existing project, with stable IDs. Do not build another production database, mandatory screenplay parser or conversation system. Retire unused four-board scaffolding while preserving useful context fields and any admitted data.

Expose only the necessary model-neutral interface: **read current context, execute validated supported actions, subscribe to changes/results**. Reuse the same handlers as direct UI controls.

Acceptance:

- Context includes the actual camera/lens, selected subject/shot/take, relevant script/reference/entity links and current revision.
- Direct clicks and equivalent host commands produce the same supported result. Invalid/stale commands fail atomically; undo and pins remain respected.
- Script/reference changes make dependent work visibly stale without replacing approved work. Missing source/script/end anchor has an honest pending state; explicit invention is a deliberate choice.
- Contract tests prove standalone readiness. Actual OS chat/auth/voice/embedding is deferred to integration, as explicitly agreed by the operator.

### M3 — Complete browser and production QC

Run one realistic clean-project workflow on the intended Mac, including the supplied flower/car reference and a contrasting scene already available for testing. Use source images and measured layout evidence; do not add image-specific geometry hacks. Inspect subject orientation, adjacency, scale and source-camera framing.

Exercise actual UI controls, save/reopen, undo, a bad file/action, exported content, keyboard focus/Escape, modals, normal/narrow window sizes and production startup. Inspect the generated files rather than merely observing download success. Add focused regression tests only for concrete defects. Fix failures and rerun the affected checks; do not repeat unrelated suites without a reason.

### M4 — Qualify one real AI filmmaking route

Use the existing spatial-analysis and generation adapters. Do not research or integrate more providers. Compare the intended camera/scene with the real result for appearance, composition, movement direction, landmarks and timing. Retain exact submitted references, model/settings, reported cost and result. Exercise recovery without duplicate submissions.

**This remains an open gate while the operator's no-spend instruction is active.** Prepare and verify all local work first. Do not enable paid flags, use paid calls or claim full AI-product acceptance without authorization and real evidence. A passing injected-response test, a corrected host-authored blockout or a successful HTTP response is not a substitute for this check.

### M5 — Release the agreed MVP

Reconcile every acceptance item above with current code and observed artifacts. Finish required tests/build and production browser smoke checks after the final changes. No broken/pretend controls or unexpected layout redesign. Provide a concise run/use guide and explicit remaining limitations.

**100% MVP completion means all current gates are evidenced, including the real image-to-set and useful final-shot qualification.** It does not mean every researched idea is implemented. Report local completion separately if the live-AI gate is still blocked; never label that the fully qualified MVP.

## Later work, outside this release

- Dashboard embedding and wiring to the existing OS chat/voice/model/auth system, with real host qualification.
- Live Jev activation/performance comparison. Keep the existing guarded adapter; no broader agent/coding harness or new dependency is needed now.
- Richer screenplay breakdown, character animation, expanded asset libraries, advanced story generation, splats/Blender workers, collaboration and additional model-specific guidance.
- Any future UI/product additions are introduced one at a time after the core MVP passes. Cancelled four-tab UI is not a pending task.

## Immediate next action

Settled orbit-to-operate pose preservation passed in the real browser. Complete the remaining clean foreground mouse capture/aim acceptance check when the foreground browser is available. M2 standalone contract and the isolated local M3 journey have evidence in QC.md. Fresh automatic vision reconstruction and final AI-shot qualification stay open under no-spend. Preserve the active project and its pre-QC backup; do not clean it by replacing it with a test fixture. The full goal remains active; no completion percentage is supported by current evidence.

## Authorized addition — movement presets (29 October 2026)

Add a compact collapsible Camera inspector section with real deterministic movement takes based on the operator’s camera library. Support automatic main-subject framing or chosen/captured start/end frames and independent endpoint subjects/focus. Include coordinated dolly/lens zoom, parallax-and-zoom and rack focus. Keep four facing views and six storyboard slots. Tracking, time-lapse and infinite/Earth zooms are explicitly deferred to FUTURE-FEATURES.md.

Implemented with existing planned-take playback/export and no added dependencies or paid calls. Catalogue and projection/endpoint tests plus actual browser creation, replay and saved-file inspection are recorded in QC.md. Final suite: 61 passing; production build passes. Prior live-AI release gates remain open.

### Preset UX correction (29 October 2026)

Supersedes the inspector dropdown interaction: controls now live above the camera; position/select/generate uses the current camera and selected subject. Optional direct start/end capture buttons retain framing and focus subjects. Fixed-position moves adapt compatible endpoint fields and explain their constraints instead of rejecting a stale travelling endpoint. The full catalogue is a button library. QC.md records the 64-test/build and actual browser regression evidence.
