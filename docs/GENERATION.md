# Image and video generation adapter

Implemented. Bounded real validation began29October2026 under a USD1 total authorization. Real Seedream5Pro stills were inspected; image/video/reconstruction outcomes and costs are recorded in LIVE-VALIDATION.md. Synthetic fixtures remain explicitly separate.

## Workflow

Open Export → Generate AI shot, select a recorded/planned take, then Check model support. This reads public metadata without a generation request. The adapter uses the existing server-owned OpenRouter credential, never a key in the browser or project.

1. Choose take start or end. The app evaluates that exact camera, renders its saved set and sends the original appearance references plus the rough composition as distinct image inputs. The prompt explicitly binds the original look to appearance and the 3D image to camera/staging.
2. Review a completed styled frame. Select it as the start of a video; optionally select another completed styled frame as the end. Choose a supported duration. The video request carries styled frames and a motion description derived from the evaluated take, not a generic unsupported trajectory file.
3. Track the provider job. A completed result stays with its local request record and can be downloaded with exact input images, settings, prompt, scene/take context and reported usage cost.

This staged design avoids assuming that frame images and appearance references are simultaneously effective on every video model. OpenRouter documents that frame inputs take precedence. It also avoids sending grey geometry as a final-looking start frame. It does not guarantee novel-view consistency, exact camera-path reproduction or accurate hidden geometry. A real recorded-shot comparison remains necessary.

## Models and capability validation

Configured defaults: `google/gemini-nano-banana-2.1` for stills and `bytedance/seedance-2.0-mini` for video. These can be overridden by `SCENE_ROOM_IMAGE_MODEL` and `SCENE_ROOM_VIDEO_MODEL` on the local server. Public capabilities were read successfully on 28 October: the selected image endpoint supports multiple references and 16:9; the video model advertises first/last frames and 4–15 second durations.

The adapter checks a specific image endpoint's reference count and aspect ratio, then pins that provider with fallback disabled. Video duration, resolution, aspect ratio and first/last controls are checked against the dedicated model metadata. Unsupported inputs fail before generation. Token-based prices are shown as such; they are not presented as a fixed per-image or per-video quote. Actual reported usage is retained per job.

Metadata is cached for five minutes. The generation payload and saved exact inputs use only the supported fields implemented here. Motion-preview video, depth, audio and model-specific passthrough guidance are not silently inserted. More conditioning adapters can be added after a demonstrated benefit.

## No-spend boundary

Submission requires the existing `SCENE_ROOM_ALLOW_PAID_AI` flag and the separate `SCENE_ROOM_ALLOW_GENERATION` flag, plus a credential. The main service flags remain off. The operator authorized a separate USD1 total validation run on29October2026; this does not authorize general ongoing generation. That run uses a request ledger with conservative cost reservations and no automatic resubmission. The live local API returned 403 for a generation attempt while disabled; no provider request was submitted. Metadata inspection is available independently.

## Persistence and recovery

Job records and exact submitted inputs/outputs live under the app's gitignored `artifacts/generation/<local-id>/`. Projects retain job links and take IDs. Download result packages alongside project files for portability; a project JSON alone does not embed generated video. Missing server records are reported as unavailable rather than replaced with a fake result.

The server writes a submission record before the provider request. Reusing the same local request ID and content returns its existing record; a different payload with that ID is rejected. Accepted video job IDs persist and survive restart. A failed content download retries retrieval of the same provider job, not generation. If the connection is lost during submission, the status is uncertain and the app does not automatically resubmit. Provider history must establish whether it accepted that request before another paid request is made.

Provider polling/content URLs are reconstructed under the fixed OpenRouter origin using the saved provider job ID. Returned arbitrary/signed URLs are not followed or stored. Credentials are server-only. Download packages include inputs, output when available and metadata, excluding credentials and signed content URLs.

## Evidence and open gates

43 automated tests currently pass across the product, including guarded submission, pinned image references, exact input persistence, duplicate requests, restart recovery, uncertain/definitively failed states, supported input validation, authenticated video retrieval and retrying download without resubmission. Provider responses in these tests are injected contract fixtures. They prove adapter behavior, not model quality or live endpoint execution.

Browser checks cover the actual free metadata response, model/duration controls, take-derived prompt, disabled paid actions and unchanged four-side/six-shot layout. Browser console showed no errors in that check. No generated result gallery has been qualified using paid output. No live Jev speed or generation-quality claim is made.

Primary references checked today:

- [OpenRouter image API and per-endpoint capabilities](https://openrouter.ai/docs/guides/overview/multimodal/image-generation).
- [OpenRouter video inputs, precedence, polling and content](https://openrouter.ai/docs/guides/overview/multimodal/video-generation).
- [Video generation request schema](https://openrouter.ai/docs/api/api-reference/video-generation/submit-a-video-generation-request).

## Requested next increment: generation on every frame — 29 October 2026

Status: implemented and locally qualified with an isolated no-network provider fixture. Paid-provider output quality remains unqualified. The four directional cards, six storyboard shots and existing layout are preserved.

Each frame card should have a compact Mock-up / Generated toggle, its own image-model selector and Create image button. Apply this consistently to directional views, storyboard frames and their temporal panels. Default to the latest completed generated variant when viewing Generated; left/right arrows browse only generated variants, with an index such as2/4. Mock-up must remain one click away regardless of variant count. Use Generated rather than Original for AI outputs so the original uploaded appearance reference stays unambiguous.

Generation uses the exact frame's camera/set snapshot as composition guidance plus the original appearance/character references as separate inputs. A new result appends a variant without replacing the mock-up, original reference or earlier results. Preserve model, prompt, reference bindings, camera snapshot, format and request/job ID with each variant. Display pending/failure states without hiding the last successful result; no automatic paid retry. Persist selection and variant links using existing project/job storage rather than another gallery subsystem.

Changing camera, set or format keeps earlier variants but marks them as belonging to an earlier framing. Camera operation and movement generation always use the underlying 3D camera, even when Generated is displayed. Switching back to Mock-up never requires cycling through results. Reuse the existing generation adapter and its capability checks. Show only verified compatible models; the operator's spoken example “C Dream 5 Pro” is not a verified provider model ID. Model choice alone must not enable paid requests. Existing no-spend flags remain off until explicitly changed.

Acceptance: create two variants for one frame; latest opens on completion; arrows browse both; toggle returns instantly to mock-up; camera movement remains editable; other cards are unchanged; save/reopen preserves both variants and their exact framing metadata; failure retains previous results; changed framing is visibly distinguished; unsupported model/format is rejected before submission. Real provider execution and output quality require a separately enabled live test.


### Implementation and qualification

FrameImage is shared by directional cards, storyboard frames and captured temporal panels. Frame-local model/prompt/display/selected-version settings live in project.frameImages; existing project.generations links carry frameId, framingKey and model. Images and exact submitted inputs remain in the existing generation job store. Download result packages from Export alongside the project when moving machines; project JSON preserves links, not output image bytes. Missing server results show unavailable instead of fabricated media.

GET /api/generation/image-models reads the live image catalogue and filters for appearance+composition reference support. The chosen model's endpoint is checked independently for exact reference count and format, then pinned without fallback. Still creation no longer depends on video-model metadata. Generation remains behind both existing paid flags; metadata does not enable spending. Empty reference bindings on frames created before reference import use current appearance references; explicit nonempty bindings must resolve and cannot silently substitute missing originals. New images append; a failed/uncertain request preserves prior outputs, and uncertain jobs block fresh creation until the existing request is checked. Camera commands still use the original 3D frame.

29 October live free metadata check:43 reference-capable catalogue entries, including bytedance-seed/seedream-5-0-pro (ByteDance Seed: Seedream5.0Pro). This verifies catalogue availability, not successful paid generation or exact per-endpoint compatibility for every chosen format. Endpoint checks occur before submission. Metadata cache is5minutes. Supported appearance input count remains1–8 in this adapter.

Source for catalogue/endpoint semantics: [OpenRouter Image API](https://openrouter.ai/blog/announcements/image-api/) and [endpoint descriptors](https://openrouter.ai/docs/api/api-reference/images/list-image-model-endpoints). No paid requests were made during qualification.
