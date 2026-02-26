import { appRoutes } from "../routes";
import { generatePath } from "react-router";

let routeMap: Record<string, string> | null = null;

function collectRoutes(routeList: any[], parentPath = "") {
  const map: Record<string, string> = {};
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
    routeMap = collectRoutes(appRoutes as any[]);
  }
}

export function path(id: string, params: Record<string, any> = {}) {
  ensureRouteMap();
  const pattern = routeMap?.[id];
  if (!pattern) throw new Error(`No route with id=${id}`);

  if (!params["language"]) {
    params["language"] = "en"; // default to 'en' if language not provided
  }

  return generatePath(pattern, params);
}
