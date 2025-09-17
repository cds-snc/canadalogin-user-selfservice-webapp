import {
  GcdsBreadcrumbs,
  GcdsBreadcrumbsItem,
  GcdsContainer,
  GcdsHeader,
  GcdsNavGroup,
  GcdsNavLink,
  GcdsText,
  GcdsTopNav,
} from "@cdssnc/gcds-components-react";
import { useMatches, useParams } from "react-router";
import { getPageContent } from "../../utils/functions.jsx";
import { useUser } from "../Providers/useUser";

export default function Breadcrumbs() {
  const matches = useMatches();
  const { language } = useParams();
  const { state } = useUser();

  const rp = state.relyingPartyInfo
    ? {
        name: state.relyingPartyInfo.linkName,
        url: state.relyingPartyInfo.url,
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
      name: getPageContent(language, match.handle.id)[
        match.handle.breadcrumbId
      ],
      url: match.pathname,
    }))
    .slice(0, onIndexRoute ? -1 : undefined);

  const crumbsToRender = [rp, ...routeCrumbs].filter((crumb) => Boolean(crumb));

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
