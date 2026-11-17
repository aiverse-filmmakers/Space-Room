# MVP acceptance reconciliation — 29 October 2026

This is an evidence index, not release approval. PLAN.md remains the agreed scope. QC.md contains observed steps and limitations. No percentage or full release claim is supported while the open gates below remain.

| Requirement | Current evidence | Result / limit |
| --- | --- | --- |
| Seven camera rigs, response, lens/framing | `src/rig.ts`, `src/subjectFraming.ts`, camera/subjectFraming tests; `exports/mvp-qc/camera-mode-recordings.json` | Local mode recordings and analytical response checks; not a subjective evaluation of every operating style. |
| Native pointer capture, WASD, Escape and replay | Native Chrome test in QC.md; `native-mouse-proof.json`, named native acceptance project | Capture notice, 0.51666m travel, Escape and advancing replay observed. Automated drag produced zero rotation. Mouse aim remains partly qualified only by the separately attributed user-operated recording. |
| Orbit → operation without jump | `orbit-operate-proof.json` | Settled position exact; quaternion distance 1.12e-16; lens unchanged. |
| Record/refine/retime/trim/planned keys | camera tests, QC.md browser journey, `exact-endpoint-project.json` | Same evaluator; originals retained; exact endpoint and lens-only keys checked. |
| Saved-set inspection and undo | `camera-undo-proof.json`, host/actions tests, QC.md | Actual camera Undo regression fixed and browser retest passed; saved snapshots retained. |
| Four facing views and six shots | shotPlanner tests, QC.md, `view-update-proof.json` | Actual renders, explicit updates including pinned views, automatic protection checked. Unseen sides remain inferred. |
| Start/middle/end and continuity | host/storyboard tests, `continuity-roundtrip.json`, actual storyboard package | Temporal poses/timestamps, continuity settings and exported panels checked. Reports expose missing evidence; no automatic narrative judgment claimed. |
| One global format | formats tests, `formats/` actual PNGs/ZIPs/video, preservation.json | Ten presets checked; previews, save/reopen and exports match; no stretching or geometry changes. Later polish checks measured actual390/800/1280 CSS widths without horizontal document overflow. |
| Save/reopen, malformed input, no partial host changes | model/actions/host tests; QC.md actual bad-file/action and reopen checks | Invalid inputs preserve project; active 4317 project was not replaced with clean fixture. |
| Source appearance separate from composition/motion | storyboard/reconstruction/generation tests; actual shot packages | Output roles and files verified locally. Real still interpretation has limited positive evidence; faithful video trajectory remains unqualified. |
| Script/reference/entity links; four compact starters | production.ts, ProductionContext.tsx, host tests | Existing six slots retained; missing script/permission/end reference produces pending guidance. No second chat or four-tab UI. |
| OS context/actions/events | host.ts, actions.ts, host/actions tests; HOST-ACTIONS.md | Same-page adapter and file transport implemented. Actual Dashboard auth/chat/voice/embedding explicitly deferred. |
| Independent service and run guide | service.mjs, README.md; launchctl and live /api/status checked this pass | Service reloaded after the per-frame generation increment. HTTP model endpoint returned200/43 models; generation remained disabled. Earlier status checks confirmed all three paid flags false. Saved main project was not replaced by QC data. |
| Fresh automatic image → usable set | provider contract tests; existing host-authored flower analysis | **Failed/open.** Fresh paid candidates were actually tested under a bounded USD1 authorization and rejected for spatial inconsistencies; see LIVE-VALIDATION.md. |
| Useful real AI shot and job recovery | generation contract tests and docs/GENERATION.md | **Open.** Real Seedream5Pro stills show useful appearance/composition guidance. Veo continuity failed; Seedance motion is cleaner but misses the ending framing. Strict recorded-path fidelity remains unqualified; see LIVE-VALIDATION.md. |
| Per-frame still creation and versions | FrameImage.tsx, frameImages/generation tests, QC.md, frame-images/browser-project.json | Implemented. Two-model/version browsing, failure retention, temporal-panel result and save/reopen pass with injected no-network responses. Real output quality remains open. |
| Final release/freeze | all rows above | **Not achieved.** Live image reconstruction and final-shot gates remain open; automated mouse aim is not a clean pass. |

Latest automated evidence:76 tests and production build passed after the per-frame generation increment (artifacts/service/live-validation-tests.log and live-validation-build.log). Movement presets have catalogue/projection/endpoint tests and browser/save evidence in QC.md; deferred movements are listed in FUTURE-FEATURES.md. Preserve the existing active project and backups. Further implementation should address a demonstrated defect or an open acceptance gate, not add speculative controls.

Reported opaque-room-wall overview defect is fixed and browser-qualified; QC.md records actual four-view renders, geometric checks and invalid manual-update protection.

Native macOS-inspired polish and local regression completed on isolated4320; see QC.md final visual polish section. Actual390/800/1280 CSS-width checks now supersede the earlier unqualified narrow-width statement. Recording/playback busy protection, compact key editing, save/reopen, malformed-project recovery and actual portrait packages were checked. This does not close live AI quality or clean automated pointer-aim gates.

Per-frame generation UI is now implemented: model selection, Create image, variant arrows and instant Mock-up/Generated toggle, including temporal panels.74 tests/build pass. Browser creation/version/failure/save/reopen behavior qualified with an explicitly isolated injected provider; actual free metadata and no-spend403 guard checked. This closes the missing per-frame UI increment, not the paid-provider visual-quality gate. See GENERATION.md and QC.md.
