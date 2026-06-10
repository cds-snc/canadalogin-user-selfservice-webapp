import { generatePath } from "react-router";

import { appRoutes } from "../routes";
import type { PageId, RouteParams } from "../types/utils";

type AppRoute = {
  index?: boolean;
  path?: string;
  handle?: {
    id?: PageId;
  };
  children?: AppRoute[];
};

let routeMap: Partial<Record<PageId, string>> | null = null;

function collectRoutes(routeList: AppRoute[], parentPath = "") {
  const map: Partial<Record<PageId, string>> = {};

  for (const route of routeList) {
    const fullPath = route.index
      ? parentPath
      : [parentPath, route.path].filter(Boolean).join("/");

    if (route.handle?.id) {
      map[route.handle.id] = fullPath || "/";
    }

    if (route.children) {
      Object.assign(map, collectRoutes(route.children, fullPath));
    }
  }

  return map;
}

function ensureRouteMap() {
  if (!routeMap) {
    routeMap = collectRoutes(appRoutes as AppRoute[]);
  }
}

export function path(id: PageId, params: RouteParams = {}): string {
  ensureRouteMap();

  const routeParamsWithLanguage = {
    ...params,
    language: params.language ?? "en",
  };

  const pattern = routeMap?.[id];

  if (!pattern) {
    console.warn(`No route with id=${id}; falling back to profile home route.`);
    return generatePath("/:language/profile", routeParamsWithLanguage);
  }

  return generatePath(pattern, routeParamsWithLanguage);
}
