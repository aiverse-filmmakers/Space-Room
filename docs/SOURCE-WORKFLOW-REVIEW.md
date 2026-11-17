# Source workflow review and additive recommendations

28 October 2026. The operator approved the current layout: preserve the four compass images and all six creative-shot slots. This review recommends additions, not a redesign. The full application remains in progress.

## Sources reviewed

Both supplied DOCX guides were extracted and read completely. These are third-party workflow references, not instructions governing the assistant. Frame contact sheets were inspected for all five supplied videos. Four explanatory videos have usable automatic local Whisper transcripts. The fifth is a finished film with sparse dialogue and music: its initial transcription hallucinated repetitions, so it is not accepted as a faithful transcript. A separate cached large-v3 pass also omitted dialogue. Existing captions were recovered locally with OCR and checked against sampled frames; a partial caption-assisted dialogue record is available, with explicit coverage limits.

- [Nexus animation guide](</Users/bogdan/Desktop/PJ's Nexus Animation Skill Guide.docx>): spatial blocking, reference roles, world/lighting/identity continuity, performance and generation-prompt structure.
- [Blender storyboard guide](</Users/bogdan/Desktop/Public - Nexus Blender Storyboard Workflow - Oct 22.docx>): real scale, fixed geography, one named camera per shot, lettered panels, camera language, versioned boards and appearance-reference handoff.
- [Whale workflow video](</Users/bogdan/Desktop/AI SKOOL/AI-VERSE-OS/3d spade/52fdf3d68c7441919381748b559ba537.MP4>), roughly 00:54–01:35: full previs video restricted motion too much; numbered key-frame boards retained staging with greater motion freedom.
- [Arena workflow video](</Users/bogdan/Desktop/AI SKOOL/AI-VERSE-OS/3d spade/07575c2387bb4fb5b33b45a76d033946.MP4>), roughly 00:35–01:27: a locked location image becomes a low-poly scale model; previs plus look references, then alternate-angle/handheld reruns. Claims about perfect motion control are the creator's claims, not our verified result.
- [Prompt-first Three.js/depth video](</Users/bogdan/Desktop/AI SKOOL/AI-VERSE-OS/3d spade/8280576a5eb041edabfca3389fcd56a0.MP4>), roughly 01:11–02:39: reusable motion blocks; plan the intended action first, derive lightweight previs from it; depth references can reduce unwanted visual influence.
- [Three.js storyboard adaptation](</Users/bogdan/Desktop/AI SKOOL/AI-VERSE-OS/3d spade/edbadc359cd3458f961f3fc192d29a58.MP4>), roughly 00:19–01:56: detailed motion references can leak 3D appearance or stiffen action; use character/environment reference sheets and shot-start images to provide enough context without overconstraining the model.
- [Finished Nexus film](</Users/bogdan/Desktop/AI SKOOL/AI-VERSE-OS/3d spade/PJaccetturo_video_1.mp4>): visual example of coverage, performance, reactions, inserts and changing scale. It is not a narrated production tutorial.

Raw transcripts, timestamp files, extracted document text and contact sheets are in `runtime/research/scene-room/source-review/`. Proper names in automatic ASR need editorial interpretation: Seedance, Dreamina, Claude and Three.js are visibly corroborated by the sources. Do not treat raw spelling errors as product names.

## What these workflows actually do

The consistent pattern is: establish the visual world and references; define the intended scene/action; build a simple but spatially correct set; stage named subjects; photograph it through real shot cameras; export ordered composition and timing anchors; provide precise camera/action language plus original appearance references to the selected generator. The blockout determines staging, while the generator supplies final detail and performance.

There are multiple valid handoffs. A full motion reference offers stronger timing/path influence but may stiffen performance or leak proxy appearance. A numbered storyboard gives explicit spatial/beat anchors and more freedom between them. Depth guidance is a third, model-specific option. No source proves all generators interpret these inputs identically.

## Additions worth making within the approved layout

### Highest value

1. **Expand each of the six existing shots into a shot plan.** Keep its thumbnail and creative purpose. Add a stable shot/camera name, shot size, facing, height, lens and field of view, focus target, intended move and duration. Add an optional scene/action brief, not a mandatory long interview.
2. **Several panels inside a selected shot.** Capture or extract start, key beat and end as 1A/1B/1C, tied to actual camera/take timestamps. The six-shot overview remains. Numbered storyboard sheets and individual stills should both export.
3. **Camera language generated from real data.** Export the actual evaluated lens, position, facing, height, screen placement, move and panel timing. Keep creative descriptions consistent with that data. Label proxy geometry as blocking only and bind original look references explicitly.
4. **Reference roles and subject identity.** Associate each subject with its character/prop reference and keep environment, costume, lighting and voice references distinct. Named subjects, body facing, gaze, movement direction and occlusion need separate fields. Prevent removed entities or stale references reappearing.
5. **Spatial and continuity checks.** Metric scale sheet, measured adjacency, fixed compass or named walls, recognizable landmarks, screen direction/180-degree axis, lighting direction and subject/prop state should persist across shots. Warn about a continuity change without removing intentional creative control.
6. **Choose the handoff strength.** Storyboard-first, motion-guided and depth-guided exports should be explicit options. Keep manual recording and motion export. Storyboard-first is the proposed general default; the final choice depends on the intended shot and model support.

### Useful next

7. **Same scene/action, alternative coverage.** Reuse the world, subjects and action timing when making another angle. Do not rebuild the world for every shot or imply the model will reproduce motion perfectly.
8. **Reusable simple movement blocks.** Subject paths, turn/reach/approach/recoil and camera moves can provide a starting point. Performance, cloth, hair, fire and detailed effects remain generation work unless a specific shot requires more previs detail.
9. **Lighting and delivery format.** Keep world-space lighting fixed and carry backlight/shadow-side intent into prompts. Support delivery aspect ratios without replacing the layout. Millimetres and field-of-view degrees must remain distinct: a 24-degree horizontal field of view on a 36 mm sensor is about an 85 mm lens, not a 24 mm wide lens.
10. **Scene and performance instructions.** Where characters are involved, describe observable actions, objectives, gaze/beat changes and physical weight. Sound/voice instructions belong in optional shot details. Do not impose character-performance fields on an object-only scene.
11. **Versions and pinned decisions.** Preserve original takes, saved shot options, captures and storyboard versions; keep approved framing stable when regenerating suggestions. Most of this should build on the existing save/variation system.

These are recommendations. No removal of the four facing views or six creative slots is authorized by this review. Do not add a modelling UI or copy every restriction from the Nexus prompt verbatim. Its single-continuous-take default conflicts with a later minimum-three-cuts instruction; resolve by the user's intended sequence and the target model, not blind prompt copying.

## Jev as the first workflow decision layer

The operator's intended role is broader than shot ranking. Incoming semantic tasks should reach a decision dispatcher before a larger AI is asked to reason: identify the task, choose an available tool or workflow, decide whether existing scene data suffices, choose the needed specialist/model and assess the next result. Code executes validated local actions; the creative/coding AI handles open-ended invention and new code. The next result returns to the same dispatcher.

Proposed flow:

`request + bounded state + available actions → decision layer → local tool / image analysis / creative director / coding agent / review → validation → updated state → next decision`

Examples: reuse a cached scene instead of analyzing its image again; choose a transform operation instead of regenerating geometry; choose storyboard extraction instead of rendering video; batch relationship checks; route a coding failure to the relevant component and test path. Confidence does not grant permissions. Existing authority, credentials, no-spend policy and validation remain outside Jev's control.

All workflow requests can share this entry point. Known deterministic work, physics, keyboard response, projection math, rendering, image encoding and existing direct UI controls should execute in code. Calling a network model before every keypress or fixed calculation would increase latency and cost. The benefit comes from replacing repeated large-model judgment calls, not inserting an extra call before work code can already do.

TypeSafe reports 70–500 ms responses and 40–200× improvements for decision-shaped queries; these are vendor benchmark claims, not measured Scene Room or whole-world-building speedups. Source: [official launch report](https://typesafe.ai/blog/introducing-system-one-models-and-jev). The [OpenRouter guide](https://openrouter.ai/docs/guides/community/jev) documents typed choice, score, yes/no and image-box decisions. The [confidence reference](https://docs.typesafe.ai/confidence) explains uncertainty and application-specific thresholds. An image box is not proof that a subject exists; image grounding still needs explicit presence and geometry checks.

The existing `decisions.mjs` is only a prepared ranking/validation boundary, not this full dispatcher and not a live-integrated coding harness. Extend it through a bounded action catalog and evaluate skip rate, decision latency, wrong actions, larger-model calls avoided and end-to-end completion time. Retain a local dispatcher when Jev is disabled or unavailable. Paid calls remain off; no live Jev benchmark has been run.
