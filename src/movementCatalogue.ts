// Names and movement intent reviewed against the operator’s library, 29 October 2026.
// https://aiverse-filmmakers.github.io/hub/camera-movements/
export type MovementKind='static'|'pan'|'tilt'|'zoom'|'dolly'|'truck'|'pedestal'|'slider'|'pass'|'arc'|'orbit'|'handheld'|'crane'|'drone'|'aerial'|'pov'|'dollyZoom'|'parallaxZoom'|'focus'|'pending';
export type MovementPreset={id:string;title:string;group:string;kind:MovementKind;direction?:number;pace?:'whip'|'crash'|'fast';unavailable?:string;note?:string};
export const movementPresets:MovementPreset[]=[
 {
  "id": "shot-01",
  "title": "Static shot",
  "group": "Pan/Tilt",
  "kind": "static"
 },
 {
  "id": "shot-02",
  "title": "Pan right",
  "group": "Pan/Tilt",
  "kind": "pan"
 },
 {
  "id": "shot-02b",
  "title": "Pan left",
  "group": "Pan/Tilt",
  "kind": "pan",
  "direction": -1
 },
 {
  "id": "shot-03",
  "title": "Whip pan right",
  "group": "Pan/Tilt",
  "kind": "pan",
  "pace": "whip",
  "note": "Fast pan with a settled start and finish. Motion blur is not simulated in the preview."
 },
 {
  "id": "shot-03b",
  "title": "Whip pan left",
  "group": "Pan/Tilt",
  "kind": "pan",
  "direction": -1,
  "pace": "whip",
  "note": "Fast pan with a settled start and finish. Motion blur is not simulated in the preview."
 },
 {
  "id": "shot-04",
  "title": "Tilt up",
  "group": "Pan/Tilt",
  "kind": "tilt"
 },
 {
  "id": "shot-04b",
  "title": "Tilt down",
  "group": "Pan/Tilt",
  "kind": "tilt",
  "direction": -1
 },
 {
  "id": "shot-05",
  "title": "Slow zoom in",
  "group": "Zoom/Lens",
  "kind": "zoom"
 },
 {
  "id": "shot-05b",
  "title": "Slow zoom out",
  "group": "Zoom/Lens",
  "kind": "zoom",
  "direction": -1
 },
 {
  "id": "shot-06",
  "title": "Fast zoom in",
  "group": "Zoom/Lens",
  "kind": "zoom",
  "pace": "fast"
 },
 {
  "id": "shot-06b",
  "title": "Fast zoom out",
  "group": "Zoom/Lens",
  "kind": "zoom",
  "direction": -1,
  "pace": "fast"
 },
 {
  "id": "shot-07a",
  "title": "Crash zoom in",
  "group": "Zoom/Lens",
  "kind": "zoom",
  "pace": "crash"
 },
 {
  "id": "shot-07b",
  "title": "Crash zoom out",
  "group": "Zoom/Lens",
  "kind": "zoom",
  "direction": -1,
  "pace": "crash"
 },
 {
  "id": "shot-08",
  "title": "Dolly in",
  "group": "Dolly/Track",
  "kind": "dolly"
 },
 {
  "id": "shot-09",
  "title": "Dolly out",
  "group": "Dolly/Track",
  "kind": "dolly",
  "direction": -1
 },
 {
  "id": "shot-10",
  "title": "Truck right",
  "group": "Physical Moves",
  "kind": "truck"
 },
 {
  "id": "shot-10b",
  "title": "Truck left",
  "group": "Physical Moves",
  "kind": "truck",
  "direction": -1
 },
 {
  "id": "shot-11a",
  "title": "Pedestal up",
  "group": "Physical Moves",
  "kind": "pedestal"
 },
 {
  "id": "shot-11b",
  "title": "Pedestal down",
  "group": "Physical Moves",
  "kind": "pedestal",
  "direction": -1
 },
 {
  "id": "shot-12",
  "title": "Slider right",
  "group": "Physical Moves",
  "kind": "slider"
 },
 {
  "id": "shot-12b",
  "title": "Slider left",
  "group": "Physical Moves",
  "kind": "slider",
  "direction": -1
 },
 {
  "id": "shot-13",
  "title": "Push past / pass-by shot",
  "group": "Physical Moves",
  "kind": "pass",
  "note": "Camera can cross geometry; unseen interiors are only as complete as the set."
 },
 {
  "id": "shot-14",
  "title": "Arc right",
  "group": "Physical Moves",
  "kind": "arc"
 },
 {
  "id": "shot-14b",
  "title": "Arc left",
  "group": "Physical Moves",
  "kind": "arc",
  "direction": -1
 },
 {
  "id": "shot-15",
  "title": "Orbit clockwise",
  "group": "Physical Moves",
  "kind": "orbit"
 },
 {
  "id": "shot-15b",
  "title": "Orbit counterclockwise",
  "group": "Physical Moves",
  "kind": "orbit",
  "direction": -1
 },
 {
  "id": "shot-23",
  "title": "Handheld shot",
  "group": "Human Camera",
  "kind": "handheld"
 },
 {
  "id": "shot-25",
  "title": "Crane up",
  "group": "Drone/Crane",
  "kind": "crane"
 },
 {
  "id": "shot-25b",
  "title": "Crane down",
  "group": "Drone/Crane",
  "kind": "crane",
  "direction": -1
 },
 {
  "id": "shot-26",
  "title": "Drone push in",
  "group": "Drone/Crane",
  "kind": "drone"
 },
 {
  "id": "shot-26b",
  "title": "Drone pull back",
  "group": "Drone/Crane",
  "kind": "drone",
  "direction": -1
 },
 {
  "id": "shot-27",
  "title": "Helicopter shot",
  "group": "Drone/Crane",
  "kind": "aerial"
 },
 {
  "id": "shot-s1",
  "title": "First-person view",
  "group": "Specials",
  "kind": "pov",
  "note": "Eye-height camera move only; no animated hands or body."
 },
 {
  "id": "shot-s6",
  "title": "Pass-through objects",
  "group": "Specials",
  "kind": "pass",
  "note": "Camera can cross geometry; unseen interiors are only as complete as the set."
 },
 {
  "id": "dolly-zoom-in",
  "title": "Dolly in \u00b7 zoom out",
  "group": "Dolly zoom / Parallax",
  "kind": "dollyZoom",
  "note": "Keeps the chosen subject\u2019s projected scale while moving closer and widening the lens."
 },
 {
  "id": "dolly-zoom-out",
  "title": "Dolly out \u00b7 zoom in",
  "group": "Dolly zoom / Parallax",
  "kind": "dollyZoom",
  "direction": -1,
  "note": "Keeps the chosen subject\u2019s projected scale while retreating and lengthening the lens."
 },
 {
  "id": "parallax-zoom-in",
  "title": "Parallax slide \u00b7 zoom in",
  "group": "Dolly zoom / Parallax",
  "kind": "parallaxZoom"
 },
 {
  "id": "parallax-zoom-out",
  "title": "Parallax slide \u00b7 zoom out",
  "group": "Dolly zoom / Parallax",
  "kind": "parallaxZoom",
  "direction": -1
 },
 {
  "id": "rack-focus",
  "title": "Rack focus",
  "group": "Zoom/Lens",
  "kind": "focus",
  "note": "Fixed camera; shifts focus distance between the selected subjects. Enable depth-of-field preview to see blur."
 }
];
