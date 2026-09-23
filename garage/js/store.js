// Persistence layer. Everything reads/writes through a StorageAdapter so the
// localStorage MVP can be swapped for Supabase/Postgres without touching views.

const NAMESPACE = "keyman.garage.";

export class LocalStorageAdapter {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }
  get(key, fallback) {
    try {
      const raw = this.storage?.getItem(NAMESPACE + key);
      return raw === null || raw === undefined ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  set(key, value) {
    try {
      this.storage?.setItem(NAMESPACE + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  remove(key) {
    try {
      this.storage?.removeItem(NAMESPACE + key);
    } catch {
      /* ignore */
    }
  }
  keys(prefix = "") {
    const out = [];
    try {
      for (let index = 0; index < this.storage.length; index += 1) {
        const key = this.storage.key(index);
        if (key?.startsWith(NAMESPACE + prefix)) out.push(key.slice(NAMESPACE.length));
      }
    } catch {
      /* ignore */
    }
    return out;
  }
}

export class MemoryAdapter {
  constructor() {
    this.map = new Map();
  }
  get(key, fallback) {
    return this.map.has(key) ? structuredClone(this.map.get(key)) : fallback;
  }
  set(key, value) {
    this.map.set(key, structuredClone(value));
    return true;
  }
  remove(key) {
    this.map.delete(key);
  }
  keys(prefix = "") {
    return [...this.map.keys()].filter((key) => key.startsWith(prefix));
  }
}

let adapter = null;
export const getAdapter = () => {
  if (!adapter) adapter = typeof localStorage === "undefined" ? new MemoryAdapter() : new LocalStorageAdapter();
  return adapter;
};
export const setAdapter = (next) => {
  adapter = next;
};

const listeners = new Set();
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = (topic) => listeners.forEach((fn) => fn(topic));

// ---- Jobs ---------------------------------------------------------------

export const jobsRepo = {
  all() {
    return getAdapter().get("jobs", []);
  },
  get(id) {
    return this.all().find((job) => job.id === id) || null;
  },
  save(job) {
    const jobs = this.all();
    const index = jobs.findIndex((item) => item.id === job.id);
    const now = new Date().toISOString();
    const next = { ...job, updatedAt: now, createdAt: job.createdAt || now };
    if (index >= 0) jobs[index] = next;
    else jobs.unshift(next);
    getAdapter().set("jobs", jobs);
    emit("jobs");
    return next;
  },
  remove(id) {
    getAdapter().set("jobs", this.all().filter((job) => job.id !== id));
    emit("jobs");
  }
};

// ---- Inventory ------------------------------------------------------------

export const inventoryRepo = {
  all(seed = []) {
    const stored = getAdapter().get("inventory", null);
    if (stored) return stored;
    getAdapter().set("inventory", seed);
    return seed;
  },
  saveAll(items) {
    getAdapter().set("inventory", items);
    emit("inventory");
  },
  reset(seed) {
    getAdapter().set("inventory", seed);
    emit("inventory");
  }
};

// ---- SOP master checklist state ------------------------------------------

export const sopRepo = {
  get() {
    return getAdapter().get("sop.master", {});
  },
  set(state) {
    getAdapter().set("sop.master", state);
    emit("sop");
  }
};

// ---- Planner layouts ------------------------------------------------------

export const layoutRepo = {
  current() {
    return getAdapter().get("planner.current", null);
  },
  setCurrent(garage) {
    getAdapter().set("planner.current", garage);
    emit("layout");
  },
  saved() {
    return getAdapter().get("planner.saved", []);
  },
  save(garage) {
    const list = this.saved().filter((item) => item.id !== garage.id);
    list.unshift({ ...garage, updatedAt: new Date().toISOString() });
    getAdapter().set("planner.saved", list.slice(0, 30));
    emit("layout");
  },
  remove(id) {
    getAdapter().set("planner.saved", this.saved().filter((item) => item.id !== id));
    emit("layout");
  }
};

// ---- Misc settings --------------------------------------------------------

export const settingsRepo = {
  get(key, fallback) {
    return getAdapter().get(`settings.${key}`, fallback);
  },
  set(key, value) {
    getAdapter().set(`settings.${key}`, value);
    emit("settings");
  }
};
