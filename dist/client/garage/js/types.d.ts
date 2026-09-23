// TypeScript mirror of garage/js/types.js. Not compiled by this repository; it
// documents the contracts a future Supabase/Postgres backend should honour.

export type GarageObjectType =
  | "vehicle" | "motorcycle" | "bicycle" | "toolbox" | "workbench" | "refrigerator" | "freezer"
  | "shelf" | "bin" | "cabinet" | "mower" | "snowblower" | "pressurewasher" | "shopvac" | "tires"
  | "rodrack" | "sports" | "trash" | "dumpster" | "worktable" | "garagedoor" | "entrydoor"
  | "window" | "wall" | "custom" | "exercise";

export type SortCategory = "keep" | "trash" | "donate" | "move" | "decision";

export interface GarageObject {
  id: string;
  type: GarageObjectType;
  name: string;
  x: number;        // feet from the left wall
  y: number;        // feet from the rear wall (top of plan)
  width: number;    // feet
  height: number;   // feet (depth on the plan)
  rotation: number; // degrees clockwise
  zone: string | null;
  color?: string;
  sort?: SortCategory;
  metadata?: Record<string, unknown>; // internal only; stripped from share links
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface GarageDoor {
  width: number;
  offset: number;
  wall: "front" | "rear" | "left" | "right";
}

export interface Garage {
  id: string;
  name: string;
  width: number;
  depth: number;
  garageDoor: GarageDoor;
  zones: Zone[];
  objects: GarageObject[];
  gridFeet?: number;
  snap?: boolean;
  updatedAt?: string;
}

export type ServiceType = "basic-reset" | "deep-clean" | "full-transformation";
export type JobStatus = "lead" | "quote" | "scheduled" | "in-progress" | "completed";

export interface JobPhoto {
  id: string;
  label: string;
  dataUrl: string;
  takenAt: string;
}

export interface Job {
  id: string;
  customer: string;
  address: string;
  date: string;
  serviceType: ServiceType;
  status: JobStatus;
  garage: Garage | null;
  beforePhotos: JobPhoto[];
  afterPhotos: JobPhoto[];
  sopProgress: Record<string, boolean>;
  inventoryLoadout: Record<string, boolean>;
  loadoutType: ServiceType | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  notes: string;
  loaded: boolean;
}

export type StockStatus = "in-stock" | "low-stock" | "reorder";

/** Persistence seam. LocalStorage today; Supabase/Postgres later. */
export interface StorageAdapter {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  keys(prefix: string): string[];
}

/** Public share payload (what a client link contains). Never carries Job.notes or metadata. */
export interface SharedLayout {
  v: 1;
  garage: Garage;
  title?: string;
}
