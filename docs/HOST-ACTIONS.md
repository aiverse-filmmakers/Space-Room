# Host operator actions

The Assistant tab can export `scene-room-host-context.json` for the current AI operator. It contains the request, scene geometry, stable IDs, take summaries, spatial analysis, a SHA-256 revision and the supported action catalog. Original look images remain in the project; an operator performing image interpretation must also receive the intended reference explicitly.

The operator returns JSON with schema `scene-room.actions.v1`, `baseRevision` copied from that context, and 1–40 `actions`. Use `object.update` with `objectId` and a transform/description patch; `camera.set` with a full pose; `take.refine` with `takeId`, smoothing and duration; or `shot.annotate` with `shotId`, title and purpose. The exported catalog describes the allowed fields.

Apply operator actions imports that file, validates every action against the unchanged project, and commits once. An invalid batch changes nothing. Undo restores the pre-batch project. Existing references, original takes and captured shot geometry are preserved. Unknown commands do not execute. If the project changes while a batch is prepared or checked, export fresh context.

This is the working no-spend transport for the current assistant. It is not automatic chat authentication, a code execution harness or live Jev integration. The eventual host/Jev dispatcher must route through the same validated action interface rather than editing arbitrary application state. Direct camera input and rendering remain local deterministic operations.

## Agreed integration boundary (29 October 2026)

The OS owns conversation, model selection, authentication and voice/chat UI. Scene Room supplies scoped current context, validated actions and real results/change events. Prepare that model-neutral interface in the standalone build; wire it into the actual OS host when integrating the Dashboard tab. Do not build a second standalone chat or claim that embedding alone gives the host awareness. The file handoff above is the current transport, not the finished live context/action bridge. See PLAN.md milestone M2 for the explicit now/later acceptance boundary.

## In-process OS adapter (29 October 2026)

The mounted app exposes `window.sceneRoom` to a trusted same-page host:

```ts
const context = await window.sceneRoom.readContext();
const unsubscribe = window.sceneRoom.subscribe(event => { /* read fresh context */ });
await window.sceneRoom.execute({
  schema: 'scene-room.actions.v1',
  baseRevision: context.revision,
  expectedViewRevision: context.viewRevision,
  actions: [/* existing validated catalog */]
});
unsubscribe();
```

Context includes live pose/lens, subject/shot/take selection, timeline time, movement mode and saved-view label, plus project script/entity/reference links. No reference image bytes or credentials are returned. Change events include camera changes; command success/failure and prepared requests have separate events. Subscriber failures cannot break editing. Commands serialize, reject busy states, validate the batch atomically, respect pins, and use the same handler as action-file imports. Project revisions cover persisted content including pins, scripts, full reference contents and take settings, excluding render caches. Supply `expectedViewRevision` to reject changed camera/selection; old file batches without it remain compatible. Subject edits from saved-set inspection require returning to the live set first. UI Undo retains the previous project.

This is an in-process boundary, not a network RPC, cross-origin postMessage channel, authentication system or connected OS chatbot. The eventual Dashboard host must supply that integration and its own authority/consent boundaries. Actual Dashboard integration remains unqualified.

Script & references stays collapsed in the existing Assistant inspector. The four small request starters prepare host requests, report missing script/permission/end references, and preserve all six slots and pinned cameras. They do not perform creative AI generation themselves. Legacy saved nine-panel data remains parseable; its unused creation/planning functions have been retired.
