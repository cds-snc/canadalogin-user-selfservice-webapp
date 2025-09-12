import { appRoutes } from "../routes";
import { generatePath } from "react-router";

let routeMap = null;

function collectRoutes(routeList, parentPath = "") {
  const map = {};
  for (const r of routeList) {
    const fullPath = r.index
      ? parentPath
      : [parentPath, r.path].filter(Boolean).join("/");

    if (r.handle?.id) {
      map[r.handle.id] = fullPath || "/";
    }
    if (r.children) {
      Object.assign(map, collectRoutes(r.children, fullPath));
    }
  }
  return map;
}

function ensureRouteMap() {
  if (!routeMap) {
    routeMap = collectRoutes(appRoutes);
  }
}

export function path(id, params) {
  ensureRouteMap();
  const pattern = routeMap[id];
  if (!pattern) throw new Error(`No route with id=${id}`);

  if (!params["language"]) {
    params["language"] = "en"; // default to 'en' if language not provided
  }

  return generatePath(pattern, params);
}
