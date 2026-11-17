# Jev decision layer — researched, prepared, disabled

28 October 2026. No live Jev calls have been made. Paid model execution is disabled by default at the local API, following the operator's instruction. The current AI operator supplies spatial analysis; local code supplies shot candidates and rendering.

## Verified service facts

Jev returns typed judgments rather than creative prose. Version 1.14 accepts text/images; image boxes are available, but a box does not prove the target exists. Image requests use a slower long-context path. Source: [OpenRouter Jev guide](https://openrouter.ai/docs/guides/community/jev).

The listed rate is $0.042 per million input tokens and no output-token charge, as checked today. This is pricing documentation, not a measured application cost. [Model page](https://openrouter.ai/typesafe/jev-1.14).

The Decisions endpoint is `POST https://openrouter.ai/api/alpha/decisions`, with model, state and typed questions; answers include scores/probabilities and usage. [API reference](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request).

## Intended scope correction

The operator clarified that Jev should be the first workflow decision layer, including task/tool selection and routing to coding or creative AI. Shot ranking alone is too narrow. See [source review and dispatcher proposal](SOURCE-WORKFLOW-REVIEW.md#jev-as-the-first-workflow-decision-layer). This is application/host orchestration, not a claim that this Codex runtime has been replaced or accelerated by Jev.

## Scene Room integration design

1. A signed-in host AI or image model produces the explicit spatial reading and creative shot proposals.
2. Deterministic validation checks subject identities, orientation, occlusion and metric relationships. Camera fitting cannot rewrite object depth or scale.
3. Jev can rank proposed shots and flag contradictory spatial readings at workflow boundaries. It does not run for keystrokes, physics or every rendered frame.
4. The host/director handles low-confidence cases and generates new proposals. A numerical confidence threshold is provisional until evaluated on labeled examples; it is not proof of accuracy.
5. Existing scene, takes and storyboard survive unavailable or malformed decision results.

`decisions.mjs` implements the typed request/response boundary with injected provider access and an off-by-default execution guard. Contract tests cover disabling, ranking, uncertainty and malformed answers. It is not connected to a live UI action and is not live-qualified.

Future checkpoints: compare local recommendations with Jev-ranked candidates on several scenes; measure quality, latency and actual usage cost; test multimodal presence+box questions separately from creative direction; reuse Dashboard host credentials and action permissions when integrating. Jev routing is a different service from direct typed decisions and may route to more expensive models, so do not substitute the router for this fixed decision model without an explicit budget policy.

## Workflow dispatcher checkpoint

`workflow.mjs` and `/api/workflow` now route requests through a bounded catalog: image analysis, scene actions, creative direction, camera planning, storyboard export, final generation, coding or clarification. Explicit task categories use local code; ambiguous auto requests can use Jev's typed Choice boundary only when both server-side paid-AI and Jev flags are enabled. Both remain disabled in the running configuration. A failed/malformed or low-confidence answer returns a recoverable task-selection step, never a scene mutation or permission grant.

The existing Assistant panel now has a task selector and Plan request. A local export route leads to the real storyboard exporter. Host routes export the request, decision and bounded project context; the AI operator returns validated actions or scene analysis. `shot.set` supplies a real shot pose within an existing slot, `take.plan` creates an editable planned movement, and previous actions remain. The operator provided and imported a real five-second camera approach during QC; the six-shot board and previous takes stayed intact.

This is not a live host transport, automated coding agent or tested paid Jev inference. Browser QC covers local routing and a routed camera task; injected-response tests cover the documented Jev Choice contract, uncertainty and outages. The .85 confidence threshold is provisional. No actual latency/speedup comparison is claimed. Rechecked the official OpenRouter Decisions schema and Jev guide on 28 October 2026.
