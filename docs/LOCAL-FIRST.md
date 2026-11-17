# Space Room: a local-first filmmaking workspace

## Working without a login
Use **Chrome or Edge on your Mac** to open https://aiverse-filmmakers.github.io/Space-Room/. The app is hosted on GitHub Pages, but 3D rendering, camera animation, GLB export and JSON imports run locally in the browser. GitHub only receives source commits you explicitly push. Opening the hosted app does not grant GitHub access to your chosen local folder.

Select **Connect workspace** and choose an ordinary folder. The app stores its folder permission handle in browser IndexedDB, but Mac/Chrome can require reauthorization. The selected folder contains:

```
Space Room/
  Projects/
    <project-id>/
      project.json
      project.backup.json
      Generations/
        <job-id>/
          job.json
          result.png (or jpg/webp/mp4/webm)
          inputs-and-result.zip
```

Each in-app tab corresponds to one project ID. Project JSON includes source image references, geometry, camera takes, storyboards, and bounded embedded GLB/glTF model assets. Old browser projects are copied to an empty workspace. If a selected folder already contains projects, they take precedence; the app never automatically overwrites them with browser data. Use the existing Save project button for an extra downloaded JSON backup. Keep a separate backup outside the Mac: local-first is not cloud backup.

Folder access is user-granted and supported mainly in Chromium browsers. Safari and Firefox can still use JSON import/export where the app runs, but not direct folder saving. A cloud-hosted ChatGPT browser cannot reach an unrelated Mac's filesystem; local folder features require a compatible browser running on the computer with the files.

## Using ChatGPT to design scenes
In **Assistant**, export context, ask ChatGPT to prepare a JSON action batch using the existing schema/revision, and import it with **Apply operator actions**. For first-time reconstruction, ask ChatGPT to prepare a scene-analysis JSON and choose **Import host scene analysis**. No OpenRouter/ChatGPT sign-in is needed in the Space Room page. Imported scenes are parsed and validated before replacing geometry. The optional Review checkbox allows approval or rejection. Four facing views and Object tools can adjust uncertain depth, orientation and scale; the existing successful automatic reconstruction is unchanged.

## 3D asset round trip
Export a mesh from Blender as a self-contained GLB. In Space Room choose **Import GLB**, position/scale it in Object and frame it with the camera rig. The import inspects the bounds, rejects huge files and external .gltf dependencies, and saves the GLB within the project. Export **Scene as GLB** to send actual Three.js geometry back to Blender. This exported file is geometry interchange, not an editable Blender .blend backup. Keep the .blend file separately. Recorded camera trajectories remain in the project JSON or the camera-trajectory export, not in the GLB.

## Optional local AI Bridge for Kie.ai image generation
The hosted page cannot directly run the existing Node AI routes. On Mac:

1. Update/clone the repository locally, run `npm ci` then `npm run build` once.
2. Use **Connect Kie.command** to save the provider key in macOS Keychain if you have not done so.
3. Run **Stop Scene Room.command** if an older service is running, then **Start Scene Room.command**.
4. Run **Connect AI Bridge.command**, note the 12-character code displayed by the Mac.
5. On the hosted website open Settings, enter that code and click **Connect AI Bridge**.
6. Generate a frame from a supported model after reviewing the paid-request confirmation. Keep the site open to track the provider job until completion and archive its result.

The Node service binds only to `127.0.0.1:4317`. It accepts browser-originated bridge requests only from `https://aiverse-filmmakers.github.io`, with a valid ephemeral session token. The bridge has a five-attempt pairing limit per service run. Tokens are not written to files or localStorage, and become invalid on a helper restart. Mac Keychain owns the Kie credential. Provider inputs leave your computer only on explicit paid generation, as already described in the generation adapter. Chrome may ask for local network permission. Safari/Firefox behavior is not certified.

**Limits:** Video generation with Kie is not connected. OpenRouter server routes remain optional and are not required for the ChatGPT external-operator workflow. The app has not yet been browser-QA-tested on the user's specific Mac or with a live paid provider request; build/unit tests cannot prove these steps. No automatic iCloud sync, multi-user identity, shared projects, or concurrent-write conflict merging is included. Avoid opening the same project for editing simultaneously in two devices/tabs.

## Recovery and privacy
Space Room attempts `project.backup.json` if `project.json` cannot be parsed. It does not delete unknown data. Completed generation media can be displayed from the saved workspace offline, provided that the files were archived before the helper became unavailable. If you switch machines, copy or sync the entire workspace and reconnect it; the hosted site alone cannot fetch files from your powered-off Mac. Offline app loading depends on its PWA service worker already having cached the current build while online.
