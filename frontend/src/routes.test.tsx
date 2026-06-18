import { describe, expect, it } from "vitest";

import { appRoutes } from "./routes";
import { PAGES } from "./utils/constants";

type RouteNode = {
  path?: string;
  handle?: {
    id?: string;
  };
  element?: {
    props?: {
      showIDVSuccessNotice?: boolean;
    };
  };
  children?: RouteNode[];
};

const findRouteByPath = (
  routes: RouteNode[],
  path: string,
): RouteNode | undefined => {
  for (const route of routes) {
    if (route.path === path) {
      return route;
    }

    if (route.children) {
      const childMatch = findRouteByPath(route.children, path);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return undefined;
};

describe("appRoutes", () => {
  it("includes the IDV success route", () => {
    const route = findRouteByPath(appRoutes as RouteNode[], "idv/success");

    expect(route).toBeDefined();
    expect(route?.handle?.id).toBe(PAGES.idvSuccessPage);
    expect(route?.element?.props?.showIDVSuccessNotice).toBe(true);
  });
});
