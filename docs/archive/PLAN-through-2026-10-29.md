# Scene Room: product requirements, architecture and implementation plan

28 October 2026. Status: implementation in progress; full product acceptance remains open. Uses the AI-Verse Implementation Plan Template at knowledge/implementation-planning/IMPLEMENTATION-PLAN-TEMPLATE.md. One living document for requirements, architecture and checkpoints.

Evidence: requirements confirmed in this conversation; [focused research](../../../runtime/research/scene-room/SCENE-ROOM-FILMMAKING-RESEARCH-2026-10-28.md); [supporting research and screenshot controls](../../../runtime/research/scene-room/SCENE-ROOM-OPTIONS-2026-10-28.md). Research establishes documented capabilities, not tested integrations. The isolated application now lives at apps/scene-room. See QC.md for observed evidence; the original research remains documentation, not proof of integration.

## 1. Problem and boundary

### Product outcome

Scene Room lets a filmmaker turn visual references into an approximate editable scene, operate a virtual camera with cinematic response, record and refine takes, then use those takes to guide AI image/video generation. The original references guide appearance; geometry guides space and cinematography.

Build it as an independent browser application that can later become a Dashboard surface. The first engineering milestone is the reusable camera/take workflow in a simple set. A manual-only scene is not completion of the full product.

### Confirmed requirements

- Single-image starting point, with optional additional references; rough editable walls, props and actor stand-ins; freely navigable scene and straightforward corrections.
- Original references preserved independently from viewport images and generated outputs.
- WASD translation and mouse aiming, with adjustable speed, sensitivity, acceleration/braking, movement damping and aiming stabilization.
- Manual recording and planned camera paths; replay, keyframe refinement, smoothing and retiming without losing the original take.
- Handheld, gimbal, dolly, crane, steady drone and FPV behaviours. FPV bank/inertia adjustable; stable modes need not add artificial shake.
- Focal length, sensor convention, aperture, focus distance and subject-aware framing: wide, medium, close-up and over-shoulder.
- Export stills, first/last frames, motion footage and camera data, retaining lens/timing/scene references. Prepare depth or other guidance when supported.
- Connected AI generation using the inputs supported by the selected model; preserve results with their scene/take and submitted references.
- Standalone development and useful local operation before Dashboard integration.

### First milestone scope

One simple room, a few props and a subject stand-in; WASD/mouse camera operation; a stabilized gimbal mode and adjustable FPV mode; record/stop/replay; reversible smoothing and duration change; save/reopen; still and sampled trajectory export, plus a reproducible preview render. Q/E vertical movement is a proposed remappable binding. Proposed screen controls are an input adapter, not a separate camera implementation.

Other camera modes, richer planned-path editing and AI scene creation remain later slices. Implementing two modes first is a sequence choice, not removing the other requirements. Obtain a small generation sample early, before substantial UI polish.

### Preserve and exclusions

Keep the installed OS, existing Dashboard work and research unchanged by application implementation. Use a separate isolated package; do not add dependencies to the OS root. Choose the actual repository/package location at the first source checkpoint using the installation's existing placement rules.

Photorealistic reconstruction, Blender replacement, terrain sculpting, collaborative editing, full drone simulation, advanced character animation, splats and phone tracking are not prerequisites. Gamepad/phone support can follow after the core interaction works. No new paid service, deployment or external publication is assumed by this document.

## 2. Existing path and smallest change

### Observed implementation and reuse

A runnable React/TypeScript/Three.js application has been established in apps/scene-room using the canonical personal-tool helper. It uses imperative Three.js with React UI rather than Fiber/Drei; no extra scene-binding dependency was needed. Inspect the actual Dashboard integration surface before integration; do not infer a current API or compatible dependency version from old notes.

| Classification | Surface | Decision |
| --- | --- | --- |
| REUSE | Research and confirmed requirements | Link them; avoid another requirements store |
| REUSE | Three.js/Fiber/Drei and navigation helpers | Use compatible stable versions when scaffolding |
| CREATE | Camera rig, take recorder/editor and scene model | Small product-specific implementation |
| EXTEND | Existing model/provider routes, if compatible | Inspect and adapt rather than invent a second provider system |
| BLOCK/UNKNOWN | Best reconstruction/generation model | Resolve through a bounded real-shot comparison |
| DEFER | Splats, Blender worker, third-party editor forks | Add only for a demonstrated benefit |

Third-party candidate repos are not adopted dependencies. In particular, public code with noncommercial terms is not automatically available for product reuse.

### Architecture

Implemented frontend: React, TypeScript, Vite and Three.js with its OrbitControls and postprocessing helpers. This choice serves the custom browser controls and later UI reuse. Confirm versions and licences at scaffolding; no extra timeline/physics dependency until a small trial shows it is necessary.

Flow:

`input adapter → camera rig → evaluated camera pose → recorder/take → timeline/refinement → deterministic evaluator → viewport/export → generation adapter → shot result`

Scene document and references supply the viewport, exports and AI actions. Direct UI and AI commands call the same validated actions. Keep inspection navigation distinct from operating the recording camera.

- **Scene:** version, units, references, objects, asset links and stable IDs. Use simple primitives first; GLB assets where appropriate. AI output is validated scene data, not arbitrary code that must execute to recover a project.
- **Camera rig:** position, orientation, velocity, look response and mode settings. Separate travel and aim smoothing; time-based updates; immediate pause/stop available. Capture mouse only on explicit operation entry and release on Escape. Chat/form focus must not move the camera.
- **Take:** original timestamped evaluated poses, quaternion rotations, lens/focus values, scene revision and optional noise seed. Manual and planned takes share an evaluated output format.
- **Refinement:** smoothing, trim/retiming and keyframe revisions without overwriting original samples. Recheck wall intersections and framing after smoothing.
- **Export:** evaluate poses at output timestamps instead of relying on variable-FPS screen recording. Save coordinate convention, units, intrinsics and camera transform convention. Export dimensions, codec and rendering path are chosen from target-browser capability checks, not assumed universally available.
- **Generation:** a thin adapter maps the saved shot package to the chosen model's supported inputs. Expose unsupported controls and expected limitations. An original appearance reference, a styled frame at the selected angle and a rough control frame have distinct roles. Failed jobs retain all scene and take data.
- **Persistence:** versioned project bundle with assets and take revisions; validate a load before replacing active work. Use explicit save/export first. Do not require a database or server for camera operation. A small server/worker is justified only when needed for generation secrets or compute; credentials do not belong in browser bundles or project files.
- **Dashboard boundary:** standalone app first. Later integrate through an embedded surface or shared UI package and a bounded scene-action interface. Reuse existing authentication, asset access and provider routing after inspecting their actual contracts. Embedding alone does not establish permission to access OS files or run actions.

## 3. Acceptance and planned verification

Planned checks below are not execution evidence. Choose exact commands after the repository and runtime are established; use the real browser flow as well as focused deterministic checks.

| ID | Observable acceptance | Planned verification |
| --- | --- | --- |
| A1 | WASD/mouse operation with independent travel/aim damping, speed and braking | Operate in browser; short key taps and mouse jitter are softened at stronger settings; values visibly change response; form focus and Escape behave correctly |
| A2 | Gimbal and FPV produce distinct controllable behaviour | Same input sequence: gimbal retains intended stable horizon, FPV permits configured bank/inertia; immediate stop works |
| A3 | Original take replays consistently | Record, replay twice and export at different frame rates; compare poses at matching timestamps within a documented numerical tolerance |
| A4 | Refinements preserve original and support undo | Smooth and double duration; original remains available, endpoints/timing are checked, framing/path defects can be reverted |
| A5 | Save/reopen preserves work | Round-trip scene, references, original/refined takes and lens settings; malformed or unsupported project leaves current work intact |
| A6 | Exports match the chosen take | Compare first/last output frames and sampled poses with viewport at those timestamps; check duration, coordinate convention and missing assets |
| A7 | Selected AI route uses recorded guidance meaningfully | Compare a small set of outputs for intended direction, landmarks/framing, timing and appearance; document actual submitted inputs, retries, time and cost; no universal exact-path claim |
| A8 | Image-based scene is usable and editable | Upload a reference, obtain blockout, correct two objects and try another angle; keep original reference; expose guessed geometry and allow scale correction |
| A9 | Planned and manual cameras use the same timeline | Create/edit path points and aim; replay and export through the same evaluator; test retiming without unintended speed spikes |
| A10 | Full requested cinematography modes and framing | Exercise each mode and lens/focus control; framing follows selected subjects; compare focus preview and export rather than trust metadata alone |
| A11 | Connected generation is recoverable | Submit supported package, retrieve and save result; simulate failure/unsupported input and retain scene/takes with a clear error |
| A12 | Later Dashboard integration preserves behaviour | Open same project standalone/in Dashboard and issue equivalent scene actions; verify host permissions and no camera/take rewrite |
| A13 | Four automatic directional previews appear below the 3D view | Render actual North/South/East/West cameras; confirm distinct view directions, inferred-surface labeling and persistence |
| A14 | Six automatic creative shot slots remain, with replaceable captured stills | Inspect varied real camera views/lenses, select a proposal, capture the current camera into a slot, save/reopen without losing it |
| A15 | A first workflow decision layer routes tasks before the larger AI | Test the bounded action catalog, local execution and escalation, result validation, preserved permissions, no-spend guard and recoverable provider failure; qualify live Jev only when paid execution is authorized |

Performance: measure navigation responsiveness, first useful scene time and export/generation latency on the intended Mac. No arbitrary mandatory FPS or generation-time number is introduced. If it feels sluggish, reduce preview cost before adding rendering complexity. Record measured conditions and user evaluation.

## 4. Execution

### S1: standalone camera and take prototype

Acceptance: A1–A6. Establish actual repository/package and runtime first. Scaffold the smallest browser app and a fixed room. Implement operation and two camera behaviours, record/replay, reversible smoothing/retiming, persistence and export. Keep app controls minimal and readable. This is a usable engineering prototype, not the completed Scene Room.

First tasks when started: inspect available source and package rules; create isolated package; implement one camera operation loop; then derive the smallest remaining task list from acceptance. Do not freeze detailed tasks for distant slices.

### S2: prove a generation route

Depends on S1's minimal recorded take/export, not its finished UI. Acceptance: A7. Compare supported storyboard-first, motion-guided and depth/reference routes using the same scene/take and original appearance. The supplied workflow sources show that full motion guidance can overconstrain the result, so do not force it as the only handoff. A GPU-only experiment is optional if available. Agree the sample and any paid execution before submission when not already authorized. Document failures as well as successful samples. A failure changes the adapter experiment, not the existence of the recorded work.

### S3: reference image to editable scene

Acceptance: A8. Start from vision-guided blockout; compare DA3/MoGe or a scene pipeline only where it improves the result. Preserve source image, camera calibration estimates and guessed areas. Keep local camera operation independent of slow model jobs.

### S4: complete shot authoring and generation

Depends on S1–S3. Acceptance: A9–A11. Add remaining movement modes, planned paths and framing/focus controls, connect the qualified generation route and preserve shot packages/results. Refine the interface around the actual end-to-end journey.

### S5: Dashboard integration

Acceptance: A12. Inspect current Dashboard/Gateway source and contracts at this point. Embed or share the application with existing project/provider access. Preserve standalone operation and project portability.

Recovery: retain earlier project versions and original takes. Keep the generation feature replaceable; no generation failure should prevent opening or operating a saved scene. New project schema changes require explicit version handling before writes.

## 5. Checkpoint and next action

Implementation checkpoint, 28 October 2026:

- Independent package and working local app at apps/scene-room, without OS-root dependency changes.
- Manual camera, recording, non-destructive smoothing/retiming, planned key points, persistence and real output exports implemented. Browser evidence covers a recorded moving take, trajectory, playable WebM and PNG sequence. Smooth planned curves, easing, key times and non-destructive trimming have been added; browser qualification and full mode/framing checks remain open.
- Shared OpenRouter credential stays with its existing owner. A cheap vision model has completed real reference-to-set calls, including the supplied giant-flower/car image. This exposed ground placement and camera fitting defects; reconstruction quality is being improved and is not yet accepted broadly.
- Added reusable car/flower stand-ins and exterior terrain. These are editable previs assets, not recovered source meshes or final image quality.
- AI shot packaging includes original appearance references, first/last rough frames, actual motion video, camera data and explicit asset roles. Browser export of a five-second refined take was verified: 1280×720 start/end images and VP9 WebM, original reference byte-identical, original take preserved.
- IndexedDB now holds large reference projects; browser reload retained the supplied image and camera lens. Downloaded projects remain portable and validated before replacement.
- The standalone production server passed page/status, missing-asset and cross-origin checks after a static-root fix. It is not currently running; the development server remains the preview.
- Four directional previews and six creative shot cards are implemented and browser-tested, including capture-to-slot and saved project metadata. The operator explicitly approved this layout; preserve it.
- The image-analysis contract now requires explicit orientation, occlusion and measured spatial relationships. Camera fitting is camera-only and cannot alter object scale/depth. An agent-authored reading of the supplied reference passed the free import path; no paid model requalification has been run for that new contract.
- Paid model execution is disabled and the local API was verified to reject paid scene requests with 403 before calling OpenRouter. A bounded workflow dispatcher, local task selection and a guarded Jev Choice adapter now exist. Automatic paid routing is disabled and live Jev qualification is still open.
- Image/video generation adapters now support a staged styled-frame workflow, capability validation, persistent job/result records and duplicate-safe recovery. Contract tests and free metadata/browser checks pass; no paid output has been generated or quality-qualified. See GENERATION.md.
- Both Nexus guides and all five video contact sheets were reviewed; four explanatory clips have usable local transcripts. See SOURCE-WORKFLOW-REVIEW.md for additive recommendations and the finished-film transcription caveat.
- Design is a movie workflow: references, shots, takes, lens/movement controls and a central camera view. Set construction is secondary.

Remaining gates: finish and verify planned path editing/trim and movement/framing modes; qualify a real generation route with motion/reference inputs and result recovery; qualify live host transport beyond the working validated file-action handoff; verify production startup, accessibility, responsive UI and final exports; complete A1–A11 against actual evidence. Dashboard embedding is later per the user's instruction, with an integration-ready action boundary prepared now. Do not modify the OS Dashboard merely to claim integration.

Next action: finish the supplied-source findings and recommendations without changing the accepted layout; continue the unresolved camera/QC, storyboard handoff and bounded host/decision-dispatcher gates. Keep paid model calls disabled. The product is not ready for a completion claim.

## 6. Earlier amendment: four storyboard workflows and shared production context

**UI form superseded by section 7 below. Do not build four permanent tabs or require four nine-panel boards.** The underlying creative briefs and script/reference continuity requirements remain useful.

28 October 2026. Direct operator request during the build. This expands the product; it is not completed functionality. The supplied prompts describe desired workflows and are not instructions to the coding assistant or permission to spend. Multi-angle source was read in full from `/Users/bogdan/.codex/attachments/95a0564c-e1d3-4c87-b59f-d0942312d2a2/Pasted text.txt`; the other three prompt descriptions were supplied directly in the conversation.

### Required storyboard tabs

Each tab is interactive, has its own AI discussion/history and retains its board, selected panels, alternatives and input links. Each board has exactly nine equal 16:9 image panels arranged 3×3, with numbers 1–9 below the image area. The app should draw numbering and gutters itself rather than rely on model-generated typography.

| Tab | Intended behavior | Prerequisites / missing-input behavior |
| --- | --- | --- |
| Scene Imagination | Explore what could happen around a source image: varied actions, angles and scene possibilities. These are ideas, not automatically a chronological script. | Source image required. User chooses script/scene-based exploration or explicitly chooses free invention. Never silently turn an exploration into approved script facts. |
| Frozen Moment / Multi-Angle | Nine cameras observe the same instant T0. Only camera position/lens/framing changes; subjects, body/head/gaze, action, props, contact points, relative positions and world lighting stay locked. Natural occlusion is retained. No invented framing objects or subject rotation to improve visibility. | Source image or defined scene moment required; a script is optional. Preserve a frozen set revision. Unknown backs/hidden surfaces are minimal inferences and must remain identified as such. Use the supplied nine-angle recipe as a starting camera brief, avoiding duplicate source-angle views. |
| Four-Beat Story | One coherent scene over nine panels: Beginning 1–2, Build 3–4, Shift 5–7, Resolution 8–9. Frame 1 is the source-image anchor; subsequent action develops naturally. Camera variety supports the story. | Source image required. With no script/scene brief, leave pending with a visible choice: supply/select script or explicitly let the AI invent a progression. Do not generate 3D shots before that choice and story direction are confirmed. |
| A-to-B Bridge | Frame 1 is the supplied beginning and Frame 9 the supplied ending; panels 2–8 form a plausible gradual bridge. Maintain each endpoint's identity/composition and explain the transition. | Both anchor images required. Scene intent or script is optional, but inference must be explicitly selected. Missing endpoint leaves the board pending. Conflicting anchors require clarification or a declared intentional transformation, not silent normalization. |

The existing four facing views and six creative 3D coverage slots remain. The new nine-panel boards are a planning layer, not a replacement or forced resizing of that overview. Proposed flow: choose mode and script/free-invention policy → resolve missing anchors/context → discuss and approve the story/action plan → create the board → select panels to stage/refine in 3D. Never overwrite pinned shots or approved panels as a side effect.

### Shared script and continuity ownership

Extend the existing project document rather than introduce a separate unlinked store. A production context should connect script and revision → scenes → moments/beats → storyboard panels → 3D shot cameras/takes → generated results. Stable IDs also link characters, location, props, wardrobe, lighting/style, hero frames and reference images. A panel records its scene/moment, relevant entities, appearance references, composition guide, source camera/take, story mode and originating script revision. The same source assets are linked, not copied independently into each tab.

Reference roles must be explicit: hero image, character identity, location, prop/wardrobe, lighting/style, start/end anchor and rough composition. Keep identity, pose, gaze and movement separate. Known script facts constrain creativity; tentative AI ideas stay proposals. A script or reference change makes dependent boards/shots visibly stale and offers selective regeneration; it never silently rewrites approved work. A script is not mandatory for frozen-angle exploration or consciously chosen invention.

Each tab's chat receives this shared production context plus that tab's task and current selection. It can answer questions, explain shot choices, request missing details, revise an individual panel or propose alternatives. It must use a real model/host route; no scripted chat pretending to be AI. The current no-spend instruction remains in force. Jev routes/verifies bounded tasks; the creative AI produces story/camera proposals. The signed-in host transport is still a separate unresolved integration beyond the working file handoff.

### Panel extraction and input fidelity

Selecting a numbered panel opens it individually and can promote it into a 3D shot option. Exporting an existing panel is an exact crop/output of its available source resolution. Higher-resolution regeneration is a separate model operation, clearly labeled, using the chosen panel and original identity/appearance references; a crop must not be called a new full-detail render. Preserve original grid and selected alternatives.

Anchor images remain linked original assets. When assembling exports, retain supplied first/last anchors rather than trusting a model redraw to be pixel-identical. Adapt outer framing with a declared fit policy while keeping the original untouched. Model-generated novel angles and identity/gaze preservation need visual review; prompt wording is not proof of perfect continuity.

### Acceptance and next implementation

- **A16:** Four independently saved nine-panel tabs with per-tab discussions and selections. Switch/save/reopen without losing state; preserve existing four-facing/six-shot content.
- **A17:** Required-input gates distinguish missing source/script/end anchor from explicit free invention. No model charge or 3D staging occurs from an unanswered choice.
- **A18:** Frozen mode camera proposals share one set/moment revision and do not alter subject transforms, poses/gaze or lighting. Verify all nine views and retain occluded subjects in place.
- **A19:** Four-beat panels carry the correct 2/2/3/2 mapping; A-to-B retains its two anchors and orders the seven intermediate moments. Check intentional progression separately from strict frozen-scene checks.
- **A20:** Script, scenes, characters, hero images, references, panels and takes/results are linked by stable IDs. Editing script marks dependent work stale; pinned output stays intact. Missing or conflicting reference links are visible.
- **A21:** Individual extraction, optional higher-resolution regeneration and 3D promotion preserve panel identity/provenance and keep original alternatives. Verify numeric captions are outside every 16:9 image.
- **A22:** Per-shot start/middle/end panels, explicit pin/unpin and comparison of saved geography/lighting/action-axis remain required alongside the four new planning modes. Implementation is underway; browser/export qualification is not complete.

Reuse: project persistence, reference assets, action validation, shot snapshots, existing timeline/render/export, guarded generation and workflow routing. Extend: production/script context and board-aware prompts/actions. Create only the four board documents and linked discussion UI needed for these workflows. First implement the linked production context and prerequisite policy, then tab persistence/discussion, then mode-specific nine-panel planning/generation and selective 3D promotion. Live paid qualification remains blocked by the explicit no-spend instruction; continue local implementation and QC without changing that boundary.

## 7. Current direction: one six-shot board, four suggestion intents

28 October 2026. The operator reconsidered the separate four-storyboard UI and asked to keep Scene Room simplified and uncrowded. This section supersedes the four-tab/nine-panel interface requirements in section 6. Do not continue that UI expansion. No four-tab interface has been shipped; only an unused production-context/schema draft was started.

Keep the existing four directional previews and six creative shot cards as the main workspace. Add a compact suggestion row above the six shots: **Imagine**, **New angles**, **Story beats**, **A→B**. These are contextual AI request starters, not separate boards, grids or automatic scene replacement. The same requests must also be available conversationally through the eventual OS AI chat. Clicking a suggestion should prepare an appropriate context-aware request and explain missing inputs; it must not spend credits or overwrite pinned shots silently.

Reuse the supplied prompt knowledge behind these intents. New angles preserves a frozen moment. Story beats proposes coherent progression using a script or explicit invention. A→B needs two anchors. The original nine-frame prompt recipes remain optional source techniques, not a mandatory grid imposed on every request. The operator can ask for a particular angle or idea without managing storyboard types.

Retain the shared script/scene/character/hero-image/reference links required for continuity. They should inform the selected scene, shot and AI task without adding permanent panels for every data type. The eventual OS chat receives current scene/selection, relevant script and approved references through the validated action boundary; it is not connected today. Separate per-tab chats are no longer required.

Acceptance A16–A21 is revised accordingly: one preserved six-shot workspace; four compact request starters and equivalent conversational requests; appropriate missing-input checks; script/reference/entity links and staleness/pin protection; selective shot updates and preserved alternatives. No requirement for four independent nine-panel documents or discussions remains. A22 (per-shot temporal panels, pinning and continuity review) still applies as secondary details, subject to final interface QC.

Current evidence: core manual previs/export paths and four/six layout have browser evidence. Latest 45 automated tests pass. A TypeScript error in the unused production-context draft was found during this status check and corrected; final build must pass before reporting it. Source reconstruction quality, live generation, OS chat context/action transport and complete camera/accessibility/responsive/end-to-end QC are not accepted yet. Do not infer 100% readiness from the available test count.

Next work: finish/qualify existing shot details and camera workflow, implement the compact suggestion row and shared context using the existing Assistant/action routes, then qualify host/generation integrations within the operator's no-spend boundary. Keep the product focused; do not add extra board management UI.

## 8. Chat ownership and integration boundary

29 October 2026. Operator clarification: the context-aware conversation comes from the existing OS when Scene Room is integrated as a Dashboard tab. Do not build a separate Scene Room chat, account/login, conversation owner or mandatory standalone LLM service.

**Build and qualify now:** Scene Room's bounded, model-neutral control interface. It must expose current project/scene identity, selected subject/shot/take, actual camera and lens, relevant script/entity/reference links and current revision. Validated commands should cover the supported scene, camera, take, shot and export functions; responses report actual changes/failures and fresh state. Change notifications keep the host's view current. The four suggestion buttons emit contextual requests through this same boundary. Preserve existing undo, pinned framing, no-spend and stale-request checks.

**Connect and qualify later during OS integration:** the real Dashboard tab/transport, host tool registration, scoped context delivery/change subscription, existing OS model/auth/provider routing and the OS chat/voice interaction. Inspect the Dashboard's actual host contract at that point; embedding a page alone does not supply context or control. Verify a spoken/typed request and equivalent direct click against the real integrated tab.

The standalone completion boundary is a working local cinematography app with a tested integration-ready context/action contract. Live OS chat hookup and Dashboard embedding are explicitly later integration work, not a reason to create duplicate chat infrastructure now. Script/reference data and useful standalone controls still belong in the current build. Image/video generation qualification remains a distinct gate and cannot be inferred from connecting a conversational LLM.

Current implementation is narrower than the target interface: a validated project-context/action file handoff exists. Active selection/current camera context, complete action coverage and live state notifications still need finishing and verification. Do not call that file handoff a completed live bridge.
