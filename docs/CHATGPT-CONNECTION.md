# Space Room: private live ChatGPT connection

**Status: local connection components implemented, external ChatGPT registration not yet completed.** This is a local-first, opt-in bridge. It is not an OpenAI login, OpenAI API integration, cloud AI model, or always-connected background service. A registered private MCP connection and a secure tunnel are still required before this ChatGPT conversation can call its tools. ChatGPT plan/workspace capabilities may restrict custom MCP write tools.

## Architecture

- Space Room runs in Chrome/Edge from GitHub Pages. It cannot expose local photos or project JSON to ChatGPT without explicit consent.
- The existing Mac helper runs on loopback (127.0.0.1:4317). This release adds **Share active project** under Assistant, available only after the site pairs with the Mac helper.
- While sharing, the browser sends the project's structured context and up to three reference images to the Mac helper over the paired local connection. The helper keeps them in **process memory only**, never in GitHub or a project file.
- The helper exposes an **isolated MCP HTTP endpoint at http://127.0.0.1:4318/mcp** on a second loopback port. The main browser AI service remains on 4317. Only tunnel **4318**, never 4317: the main API includes local service endpoints that must not be externally forwarded. An authorized ChatGPT connector reaches it through a secure MCP tunnel, not directly from a remote server. Do **not** expose either port to the open internet. Configure the private MCP tunnel to preserve/rewrite the upstream Host header to 127.0.0.1:4318; arbitrary Host headers are intentionally rejected. Browser Origins on the MCP endpoint are rejected.
- MCP tools: pair_space_room, read_active_project, view_reference_image, propose_scene, propose_actions, proposal_status. An operator cannot browse unrelated folders, execute code, trigger paid generation or bypass review.
- Pairing requires a 12-character code shown in Space Room, separate from the website-to-Mac pairing code. Five wrong codes block pairing until helper restart. The session expires after 12 hours; stopping sharing or changing projects revokes it. The browser's image/context heartbeat expires after 25 seconds. Code files are stored locally with 0600 permissions, regenerated after restart.
- **All edits require review.** The gateway queues one revision-bound proposal at a time, and Space Room shows Approve / Reject. The original scene stays unchanged until approval. Approval uses existing validation and undo. Stale revisions fail closed.
- Images are *not sent to OpenAI merely by clicking Share*. An authorized ChatGPT MCP tool must request a reference image, at which point it is transmitted through the user's connector.

## What is ready on the Mac

1. Pull the updated Space Room repository. Run npm ci and npm run build.
2. Stop the old Mac helper with **Stop Scene Room.command**, then restart with **Start Scene Room.command**. The operator gateway starts, with project sharing off.
3. Open https://aiverse-filmmakers.github.io/Space-Room/ in Chrome/Edge. Under Settings, pair the Mac helper using **Connect AI Bridge.command**. This code authorizes the **website to Mac** connection.
4. In Assistant select **Share active project**. The image and project are now available only to the local Mac gateway. A second code appears for the **ChatGPT session**.
5. Register the private /mcp endpoint on **127.0.0.1:4318** through a secure MCP tunnel in a supported ChatGPT client. This step is **not** automatic: it requires the user's active client/workspace to support custom MCP tools, tunnel configuration and connection approval. The GitHub repository itself cannot activate a cloud connection. On plans without custom MCP write support, use the JSON export/import fallback.
6. Call pair_space_room with the second code from Assistant, then ask ChatGPT to read the project and view the reference image. The agent can propose an editable scene or action batch. Review and approve in Assistant.

## Security and limits

The website-to-Mac bridge requires the expected GitHub Pages Origin and an ephemeral 256-bit session token. The separate MCP endpoint uses a code-paired session scoped to one shared project. A tunnel must be private/authenticated; network transport restrictions do not replace user authorization. Do not publish a public unauthenticated tunnel. The helper is designed for one local user, not public multi-tenant hosting.

ChatGPT plugin registration, tunnel permissions, Mac-specific browser testing and live model-to-scene QA are **not yet verified**. Unit/build tests alone do not establish a complete operational ChatGPT connection.

## Fallback

Without the MCP connector, use Assistant's **Export context for AI operator** and **Import host scene analysis / Apply operator actions** buttons. Attach the actual reference image to ChatGPT for visual reconstruction.
