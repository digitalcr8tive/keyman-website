// Garage Operations OS entry point. Hash-routed single page that reuses the
// Keyman site header, buttons, forms, and typography.

import { parseHash, buildHash } from "./router.js";
import { el } from "./util.js";
import { subscribe } from "./store.js";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "operations", label: "Operations", children: [
    { id: "sop", label: "SOP" },
    { id: "checklist", label: "Job Checklist" }
  ] },
  { id: "inventory", label: "Inventory", children: [{ id: "inventory", label: "Supplies" }] },
  { id: "planner-group", label: "Garage Planner", children: [
    { id: "planner", label: "Planner" },
    { id: "client", label: "Client Preview" }
  ] },
  { id: "demo", label: "Sales Demo" },
  { id: "jobs", label: "Jobs" },
  { id: "future", label: "Future", children: [{ id: "scanner", label: "Room Scanner" }] }
];

const VIEWS = {
  dashboard: () => import("./views/dashboard.js"),
  sop: () => import("./views/sop.js"),
  checklist: () => import("./views/checklist.js"),
  inventory: () => import("./views/inventory.js"),
  planner: () => import("./views/planner.js"),
  client: () => import("./views/client.js"),
  demo: () => import("./views/demo.js"),
  jobs: () => import("./views/jobs.js"),
  scanner: () => import("./views/scanner.js")
};

const TITLES = {
  dashboard: "Dashboard",
  sop: "SOP",
  checklist: "Job Checklist",
  inventory: "Supplies",
  planner: "Garage Planner",
  client: "Garage Transformation Plan",
  demo: "Sales Demo",
  jobs: "Jobs",
  scanner: "Room Scanner"
};

// Routes shown with the minimal client chrome (no internal navigation).
const CLIENT_ROUTES = new Set(["client", "demo"]);

const main = document.querySelector("[data-app-main]");
const desktopNav = document.querySelector("[data-desktop-nav]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const subnav = document.querySelector("[data-subnav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const header = document.querySelector("[data-header]");
const headerCta = document.querySelector("[data-header-cta]");
const brandRole = document.querySelector("[data-brand-role]");

const groupFor = (route) => NAV.find((group) => group.id === route || group.children?.some((child) => child.id === route)) || NAV[0];

const setMenuState = (open) => {
  menuToggle?.setAttribute("aria-expanded", String(open));
  mobileNav?.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  const label = menuToggle?.querySelector(".sr-only");
  if (label) label.textContent = open ? "Close navigation" : "Open navigation";
};
menuToggle?.addEventListener("click", () => setMenuState(menuToggle.getAttribute("aria-expanded") !== "true"));
window.addEventListener("resize", () => {
  if (window.innerWidth > 920) setMenuState(false);
});
window.addEventListener("scroll", () => header?.classList.toggle("is-scrolled", window.scrollY > 12), { passive: true });

const paintNav = (route) => {
  const group = groupFor(route);
  desktopNav.replaceChildren(
    ...NAV.map((entry) => {
      const target = entry.children ? entry.children[0].id : entry.id;
      const link = el("a", { href: buildHash(target) }, entry.label);
      if (entry.id === group.id) link.setAttribute("aria-current", "true");
      return link;
    })
  );
  mobileNav.replaceChildren(
    ...NAV.flatMap((entry) => {
      if (!entry.children) {
        const link = el("a", { href: buildHash(entry.id), onclick: () => setMenuState(false) }, entry.label);
        if (entry.id === route) link.setAttribute("aria-current", "true");
        return [link];
      }
      return [
        el("span", { class: "mobile-group" }, entry.label),
        ...entry.children.map((child) => {
          const link = el("a", { class: "is-child", href: buildHash(child.id), onclick: () => setMenuState(false) }, child.label);
          if (child.id === route) link.setAttribute("aria-current", "true");
          return link;
        })
      ];
    })
  );
  document.body.classList.toggle("has-subnav", Boolean(group.children && group.children.length > 1));
  if (group.children && group.children.length > 1) {
    subnav.hidden = false;
    subnav.replaceChildren(
      ...group.children.map((child) => {
        const link = el("a", { class: "tab", href: buildHash(child.id) }, child.label);
        if (child.id === route) link.setAttribute("aria-selected", "true");
        return link;
      })
    );
  } else {
    subnav.hidden = true;
    subnav.replaceChildren();
  }
};

let cleanup = null;
let renderToken = 0;

const mount = async () => {
  const { route, params } = parseHash();
  const view = VIEWS[route] ? route : "dashboard";
  const token = ++renderToken;
  if (typeof cleanup === "function") cleanup();
  cleanup = null;
  main.replaceChildren();
  const clientChrome = CLIENT_ROUTES.has(view);
  document.body.classList.toggle("client-chrome", clientChrome);
  document.body.dataset.route = view;
  document.title = `${TITLES[view]} | Keyman Garage OS`;
  brandRole.textContent = clientChrome ? "Garage Transformation" : "Garage Operations";
  headerCta.textContent = view === "planner" ? "Sales demo" : view === "demo" ? "Exit demo" : view === "client" ? "Request a quote" : "Open planner";
  headerCta.href = view === "planner" ? buildHash("demo") : view === "demo" ? buildHash("dashboard") : view === "client" ? location.hash : buildHash("planner");
  headerCta.onclick = view === "client"
    ? (event) => {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("garage:quote"));
      }
    : null;
  paintNav(view);
  setMenuState(false);
  window.scrollTo({ top: 0 });

  const page = el("div", { class: `page page-${view}` });
  main.append(page);
  try {
    const module = await VIEWS[view]();
    if (token !== renderToken) return;
    const result = await module.render(page, { params, route: view });
    if (token !== renderToken) {
      if (typeof result === "function") result();
      return;
    }
    cleanup = typeof result === "function" ? result : null;
  } catch (error) {
    console.error(error);
    page.replaceChildren(
      el("p", { class: "eyebrow" }, "Something went wrong"),
      el("p", { class: "sub" }, error.message || String(error)),
      el("a", { class: "button button-outline", href: buildHash("dashboard") }, "Back to dashboard")
    );
  }
};

window.addEventListener("hashchange", mount);
subscribe((topic) => {
  // Keep the dashboard KPIs fresh when data changes elsewhere in the same tab.
  if (parseHash().route === "dashboard" && topic !== "layout") mount();
});
document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});
if (!location.hash) location.replace(buildHash("dashboard"));
mount();
