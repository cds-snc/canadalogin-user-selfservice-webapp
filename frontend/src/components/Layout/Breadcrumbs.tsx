import {
  GcdsBreadcrumbs,
  GcdsBreadcrumbsItem,
} from "@gcds-core/components-react";
import { useMatches } from "react-router";
import type { UIMatch } from "react-router";
import type { PageId } from "../../types/utils";
import { useTranslation } from "react-i18next";
import { PAGE_NAMESPACE_MAP } from "../../i18n/index";
import { useUser } from "../Providers/useUser";
import { useRelyingPartyInfo } from "../../hooks/useRelyingPartyInfo";

type BreadcrumbHandle = {
  id: PageId;
  breadcrumbId: string;
};

type BreadcrumbLink = {
  name: string;
  url: string;
};

export default function Breadcrumbs() {
  const matches = useMatches() as Array<UIMatch<unknown, BreadcrumbHandle>>;
  const { t, i18n } = useTranslation();
  const { state } = useUser();
  const { hasRelyingParty, relyingPartyName, relyingPartyUrl } =
    useRelyingPartyInfo(state, i18n.language);
  const rp: BreadcrumbLink | null = hasRelyingParty
    ? {
        name: relyingPartyName,
        url: relyingPartyUrl,
      }
    : null;

  // If we're on a index route (a route with a breadcrumb and children), we want to hide the current breadcrumb.
  // Matches is awkward because when we're on an index node, it returns both the index and the parent (with the breadcrumb) as matches.
  // So I can't just delete the last match. Instead I check if the last two matches have the same pathnames (ignoring trailing slashes).
  // If they do, we're on an index route and we can ignore the last match.
  const onIndexRoute =
    matches.length > 1 &&
    matches[matches.length - 1].pathname.replace(/\/+$/, "") ===
      matches[matches.length - 2].pathname.replace(/\/+$/, "");

  const routeCrumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumbId))
    .map((match) => ({
      name: t(`${match.handle.id}.${match.handle.breadcrumbId}`, {
        ns: PAGE_NAMESPACE_MAP[match.handle.id],
        defaultValue: "",
      }),
      url: match.pathname,
    }))
    .slice(0, onIndexRoute ? -1 : undefined);

  const crumbsToRender = [rp, ...routeCrumbs].filter(
    (crumb): crumb is BreadcrumbLink => Boolean(crumb),
  );

  return (
    <GcdsBreadcrumbs slot="breadcrumb" hideCanadaLink>
      {crumbsToRender.map((crumb, index) => (
        <GcdsBreadcrumbsItem key={index} href={crumb.url}>
          {crumb.name}
        </GcdsBreadcrumbsItem>
      ))}
    </GcdsBreadcrumbs>
  );
}
