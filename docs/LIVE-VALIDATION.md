# Bounded real-provider validation — 29 October 2026

The operator authorized at most USD1 total. This was a separate validation run; main service flags remained off. Credentials stayed with the existing server owner. Request reservations were written before submission, and uncertain/rejected requests retained their full reservation when cost could not be confirmed. No job was blindly resubmitted. The run is now closed to further paid submissions.

## Results

| Check | Observed result | Acceptance |
| --- | --- | --- |
| Fresh reference analysis, Gemini3.1FlashLite | Two returned candidates rejected: reversed behind depth, then inconsistent fractional/image-bound scales. The latter improved some head yaw but still broke the contract. | Failed. Existing set preserved. |
| Alternative Qwen3VL235B endpoints | DeepInfra429; Venice timed out. No valid scene returned. | Unqualified. Full USD0.10 reservation retained conservatively. |
| Stronger GPT5.4Mini analysis | Two returned candidates rejected: near-distance inconsistency/invalid relationship target, then reversed behind relations and an excessive near limit. | Failed. A stronger model alone did not resolve spatial consistency. |
| Seedream5.0Pro first still | Real JPEG2048×1152, USD0.048. Preserves cream vintage car, three daisies, lighting and original visual character. | Useful appearance handoff observed. |
| Seedream5.0Pro ending still | Real JPEG2048×1152, USD0.048. Follows the ending guide's leftward car framing/cropped left flower and a more oblique view. Detail/flower orientation may differ. | Useful composition guidance observed, not exact reconstruction. |
| Veo3.1Lite video | Real720p/24fps/96frames/4.000s, USD0.12. Sampled frames show ghosting/crossfade and a second car. | Failed continuity. Do not recommend this test result. |
| Seedance2.0Mini comparison | Real720p/24fps/97frames/4.041667s, USD0.30555. Sampled frames show one car, three flowers and continuous viewpoint change. Final composition differs substantially from the supplied ending frame; the model appears to keep the car centred. | Cleaner motion candidate, but strict ending/path fidelity remains unqualified. |

The image/video requests used the app's actual GenerationService, real original appearance image and existing exported start/end camera guides. They used a prior recorded local set, NOT a fresh successful automatic reconstruction. The recorded5s take was retimed to4s for the supported economical video configuration. Do not conflate these image/video results with the failed fresh-analysis gate. Visual assessment used returned stills, video frame extracts at1fps and final frames plus ffprobe; no frame-accurate trajectory recovery or full subjective operating evaluation is claimed.

## Cost and artifacts

Provider-reported total: USD0.550353125. Reported total plus full unconfirmed Qwen reservations: USD0.650353125, below USD1. No additional spending is authorized by the existence of these artifacts. Main generation controls remain off.

Evidence is in exports/mvp-qc/live-validation/: budget.json, cost-summary.json, original metadata/response records, rejected analyses, exact submitted inputs and returned outputs in jobs/, video-contact.png, seedance-contact.png and final-frame extracts. Models' pricing/capabilities were fetched live before submission. Seedance token estimate used the provider formula (width×height×24×seconds)/1024 with the live Mini SKU; USD0.40 was reserved for its720p4s request, versus USD0.30555 actually reported. [OpenRouter token formula](https://openrouter.ai/bytedance/seedance-2.0/activity).

Live validation.scene-room.json is a separate review project with completed results attached to two pinned composition cards and video records in Export. Existing completed job directories were copied into artifacts/generation/ so the normal local service can retrieve them. These are imported validation results, not a claim that the paid jobs originated from clicks on those new card IDs. Exact original input camera context remains in each immutable job record. The main active browser project was not replaced. Result packages should travel alongside project JSON when moving machines.

## Changes and remaining root problem

Strengthened the general image-reading instructions for signed camera-relative depth, visible orientation, normalized bounds, valid relationship IDs and near-distance self-checks. Added regressions for the actual reversed-depth and within-axis mixed-scale failures.76 tests/build pass. These changes do not establish reliable reconstruction: all tested fresh candidates were rejected. Keep the validator; do not hand-fix this image's coordinates or weaken checks to force a pass.

The next reconstruction improvement must separate visual observations from metric layout construction and enforce the spatial constraints before assembly. Further prompt retries alone have not earned release acceptance. Likewise, a video model accepting first/last frames does not prove it respects a recorded camera path. The full MVP remains unreleased; image creation now has real provider evidence, while automatic spatial reconstruction and faithful motion remain open quality gates.
