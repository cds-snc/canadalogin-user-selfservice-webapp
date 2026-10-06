import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConnectedServicesPage from "../ConnectedServicesPage";
import ArchivedConnectedServicesPage from "../ArchivedConnectedServicesPage";
import ConnectedServicesTable from "../ConnectedServicesTable";

const mockGetConnectedServices = vi.fn();

vi.mock("../../api/connectedServicesApi", () => ({
  connectedServicesApi: {
    getConnectedServices: () => mockGetConnectedServices(),
  },
}));

let mockDevOnlyFeature = true;
let mockLanguage = "en";

vi.mock("react-router", () => ({
  useParams: () => ({ language: mockLanguage }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        pageTitle: "Connected services",
        pageDescription:
          "Here you can review which services you have signed in with CanadaLogin and when you last signed in.",
        "successNotice.title":
          "Your information was successfully saved in CanadaLogin",
        "successNotice.body": "Your verified information has been updated.",
        heading: "Sign in to services to apply this update",
        description: "Service update description",
        servicesHeading: "Services needing you to sign in again",
        servicesDescription: "Save your active progress.",
        "sessions.activeSession": "Active session",
        "sessions.inactiveSession": "Inactive session",
        "sessions.unknownSession": "Connected",
        "columns.application": "Service name",
        "columns.lastLogin": "Last signed in",
        "columns.lastLogout": "Last logout",
        notAvailable: "Not available",
        loading: "Loading connected services.",
        error: "We could not load your connected services. Try again later.",
        empty: "You do not have any connected services.",
        signOutEverywhere: "Sign out everywhere",
        doThisLater: "I'll do this later",
        informationHeading: "This update only applies to connected services.",
        informationBody: "Update a separate account directly.",
        directoryPrefix: "Visit the",
        directoryLink: "Government of Canada account directory",
      })[key] ?? key,
  }),
}));

vi.mock("../../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  EXTERNAL_NAVIGATION_LINKS: {
    gcAccountDirectory:
      "https://www.canada.ca/en/government/sign-in-online-account.html",
  },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({
    children,
    buttonRole,
  }: React.PropsWithChildren<{ buttonRole?: string }>) => (
    <button data-button-role={buttonRole}>{children}</button>
  ),
  GcdsContainer: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  GcdsGrid: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  GcdsHeading: ({
    children,
    tag,
  }: React.PropsWithChildren<{ tag: "h1" | "h2" }>) => {
    const Tag = tag;
    return <Tag>{children}</Tag>;
  },
  GcdsLink: ({
    children,
    href,
    external,
  }: React.PropsWithChildren<{ href: string; external?: boolean }>) => (
    <a href={href} data-external={external}>
      {children}
    </a>
  ),
  GcdsNotice: ({
    children,
    noticeRole,
    noticeTitle,
  }: React.PropsWithChildren<{ noticeRole: string; noticeTitle: string }>) => (
    <div data-notice-role={noticeRole} data-notice-title={noticeTitle}>
      {children}
    </div>
  ),
  GcdsText: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
}));

afterEach(() => {
  mockDevOnlyFeature = true;
  mockLanguage = "en";
  mockGetConnectedServices.mockReset();
});

describe.each([
  {
    name: "ConnectedServicesPage",
    Page: ConnectedServicesPage,
    archived: false,
  },
  {
    name: "ArchivedConnectedServicesPage",
    Page: ArchivedConnectedServicesPage,
    archived: true,
  },
])("$name", ({ Page, archived }) => {
  it("renders services returned by the backend in development", async () => {
    mockGetConnectedServices.mockResolvedValue([
      {
        clientId: "client-1",
        name: "Service One",
        url: "https://service-one.example.com/sign-in",
        lastLogin: "2026-01-01T10:00:00Z",
        lastLogout: "2026-01-02T11:00:00Z",
      },
    ]);
    render(<Page />);

    expect(await screen.findByText("Service One")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Service One" })).toHaveAttribute(
      "href",
      "https://service-one.example.com/sign-in",
    );
    expect(screen.getByRole("link", { name: "Service One" })).toHaveAttribute(
      "data-external",
      "true",
    );
    expect(mockGetConnectedServices).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        new Intl.DateTimeFormat("en", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        }).format(new Date("2026-01-01T10:00:00Z")),
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(
      screen.getByRole("columnheader", { name: "Service name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Last signed in" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Last logout" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        new Intl.DateTimeFormat("en", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        }).format(new Date("2026-01-02T11:00:00Z")),
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: archived
          ? "Sign in to services to apply this update"
          : "Connected services",
      }),
    ).toBeInTheDocument();
    if (!archived) {
      expect(
        screen.getByText(
          "Here you can review which services you have signed in with CanadaLogin and when you last signed in.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Your verified information has been updated."),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 2 }),
      ).not.toBeInTheDocument();
      return;
    }
    expect(
      screen.getByRole("button", { name: "Sign out everywhere" }),
    ).toHaveAttribute("data-button-role", "danger");
    expect(
      screen.getByRole("button", { name: "I'll do this later" }),
    ).toHaveAttribute("data-button-role", "secondary");
    expect(
      screen.getByRole("link", {
        name: "Government of Canada account directory",
      }),
    ).toHaveAttribute(
      "href",
      "https://www.canada.ca/en/government/sign-in-online-account.html",
    );
  });

  it("shows unavailable when login was not recorded", async () => {
    mockGetConnectedServices.mockResolvedValue([
      {
        clientId: "client-2",
        name: "Service Two",
        lastLogin: null,
        lastLogout: null,
      },
    ]);
    render(<Page />);
    expect(await screen.findByText("Service Two")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Service Two" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(1);
  });

  it("renders loading, error, and empty states", async () => {
    let rejectRequest: (error: Error) => void = () => undefined;
    mockGetConnectedServices.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectRequest = reject;
        }),
    );
    render(<Page />);
    expect(screen.getByText("Loading connected services.")).toBeInTheDocument();

    rejectRequest(new Error("request failed"));
    expect(
      await screen.findByText(
        "We could not load your connected services. Try again later.",
      ),
    ).toBeInTheDocument();

    mockGetConnectedServices.mockResolvedValue([]);
    const { unmount } = render(<Page />);
    expect(
      await screen.findByText("You do not have any connected services."),
    ).toBeInTheDocument();
    unmount();
  });

  it("does not render outside the development environment", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<Page />);

    expect(container).toBeEmptyDOMElement();
    expect(mockGetConnectedServices).not.toHaveBeenCalled();
  });
});

describe("ConnectedServicesTable", () => {
  it.each([
    {
      language: "fr",
      localizedUrls: { fr: "https://service.example.com/fr" },
      expectedUrl: "https://service.example.com/fr",
    },
    {
      language: "en",
      localizedUrls: { fr: "https://service.example.com/fr" },
      expectedUrl: "https://service.example.com/sign-in",
    },
    {
      language: "fr",
      localizedUrls: { fr: "not a URL" },
      expectedUrl: "https://service.example.com/sign-in",
    },
  ])(
    "uses the configured destination for $language, falling back when needed",
    async ({ language, localizedUrls, expectedUrl }) => {
      mockLanguage = language;
      mockGetConnectedServices.mockResolvedValue([
        {
          clientId: "client-link",
          name: "Linked service",
          url: "https://service.example.com/sign-in",
          localizedUrls,
        },
      ]);

      render(<ConnectedServicesTable />);

      expect(
        await screen.findByRole("link", { name: "Linked service" }),
      ).toHaveAttribute("href", expectedUrl);
    },
  );

  it.each([
    null,
    "not a URL",
  ])("does not link a missing or invalid URL: %s", async (url) => {
    mockGetConnectedServices.mockResolvedValue([
      { clientId: "client-no-link", name: "Unlinked service", url },
    ]);

    render(<ConnectedServicesTable />);

    expect(await screen.findByText("Unlinked service")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("can be rendered independently and formats timestamps for the route language", async () => {
    mockLanguage = "fr";
    mockGetConnectedServices.mockResolvedValue([
      {
        clientId: "client-fr",
        name: "Service français",
        lastLogin: "2026-01-01T10:00:00Z",
      },
    ]);

    render(<ConnectedServicesTable />);

    expect(
      await screen.findByRole("rowheader", { name: "Service français" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", {
        name: new Intl.DateTimeFormat("fr", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        }).format(new Date("2026-01-01T10:00:00Z")),
      }),
    ).toBeInTheDocument();
  });
});
