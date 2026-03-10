import { generatePath } from "react-router";

import { appRoutes } from "../routes.jsx";
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

  const pattern = routeMap?.[id];

  if (!pattern) {
    throw new Error(`No route with id=${id}`);
  }

  const routeParams: RouteParams = { ...params };

  if (!routeParams.language) {
    routeParams.language = "en";
  }

  return generatePath(pattern, routeParams);
}
