/**
 * Future Room Scanner module contracts.
 *
 *   Camera -> Computer Vision -> Room Geometry -> Object Detection -> Garage Model -> Planner -> Client Proposal
 *
 * Nothing here performs vision work. These are the seams a real implementation
 * (on-device ML, a cloud vision API, or an AR session) will plug into. The
 * planner already consumes `Garage` objects, so a scanner only has to produce one.
 *
 * @typedef {Object} CameraFrame
 * @property {ImageBitmap|HTMLCanvasElement|Blob} image
 * @property {number} timestamp        ms
 * @property {{width:number,height:number}} size
 * @property {Record<string,unknown>} [intrinsics]  focal length, principal point, if known
 *
 * @typedef {Object} CameraFrameSource
 * @property {() => Promise<void>} start
 * @property {() => Promise<void>} stop
 * @property {(handler:(frame:CameraFrame)=>void) => () => void} onFrame   returns an unsubscribe fn
 *
 * @typedef {Object} WallSegment
 * @property {{x:number,y:number}} start   feet, plan coordinates
 * @property {{x:number,y:number}} end
 * @property {number} confidence           0..1
 *
 * @typedef {Object} Opening
 * @property {"garagedoor"|"entrydoor"|"window"} kind
 * @property {number} wallIndex
 * @property {number} offset               feet along the wall
 * @property {number} width                feet
 * @property {number} confidence
 *
 * @typedef {Object} RoomGeometry
 * @property {WallSegment[]} walls
 * @property {Opening[]} openings
 * @property {{width:number,depth:number,confidence:number}} floor   estimated bounding floor
 * @property {number} ceilingHeight        feet, 0 if unknown
 * @property {"feet"} units
 *
 * @typedef {Object} DetectedObject
 * @property {import("../types.js").GarageObjectType} type
 * @property {string} label
 * @property {{x:number,y:number,width:number,height:number}} footprint   feet, plan coords
 * @property {number} confidence
 *
 * @typedef {Object} VisionProvider
 * @property {(frames:CameraFrame[]) => Promise<RoomGeometry>} detectGeometry
 * @property {(frames:CameraFrame[], geometry:RoomGeometry) => Promise<DetectedObject[]>} detectObjects
 *
 * @typedef {Object} ClearanceIssue
 * @property {string} objectId
 * @property {"door-swing"|"walk-path"|"vehicle-door"|"overlap"} kind
 * @property {string} message
 *
 * @typedef {Object} GarageModelBuilder
 * @property {(geometry:RoomGeometry, objects:DetectedObject[]) => import("../types.js").Garage} build
 * @property {(garage:import("../types.js").Garage) => ClearanceIssue[]} checkClearances
 *
 * @typedef {"idle"|"capturing"|"geometry"|"objects"|"model"|"planner"|"proposal"} ScanStage
 *
 * @typedef {Object} ScanSession
 * @property {string} id
 * @property {ScanStage} stage
 * @property {CameraFrame[]} frames
 * @property {RoomGeometry|null} geometry
 * @property {DetectedObject[]} detections
 * @property {import("../types.js").Garage|null} garage
 */

export const SCAN_STAGES = [
  { id: "capturing", step: 1, label: "Scan garage with phone camera" },
  { id: "geometry", step: 2, label: "Detect walls" },
  { id: "geometry", step: 3, label: "Detect garage door" },
  { id: "geometry", step: 4, label: "Detect floor boundaries" },
  { id: "objects", step: 5, label: "Detect objects" },
  { id: "geometry", step: 6, label: "Estimate dimensions" },
  { id: "model", step: 7, label: "Generate digital garage model" },
  { id: "planner", step: 8, label: "Drag proposed equipment/storage into available areas" },
  { id: "planner", step: 9, label: "Check clearances" },
  { id: "proposal", step: 10, label: "Generate proposed transformation" },
  { id: "proposal", step: 11, label: "Send client a shareable plan" }
];

export const PIPELINE = [
  "Camera",
  "Computer Vision",
  "Room Geometry",
  "Object Detection",
  "Garage Model",
  "Planner",
  "Client Proposal"
];

/**
 * Placeholder provider registry. A real provider registers itself here;
 * until then `getVisionProvider()` returns null and the UI shows Coming Soon.
 * @type {VisionProvider|null}
 */
let provider = null;
export const registerVisionProvider = (next) => {
  provider = next;
};
export const getVisionProvider = () => provider;
export const isScannerAvailable = () => provider !== null;
