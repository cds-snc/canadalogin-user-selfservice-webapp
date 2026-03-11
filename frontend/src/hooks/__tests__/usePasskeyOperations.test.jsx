/**
 * Unit tests for usePasskeyOperations hook
 *
 * Tests verify hook behaviour:
 * - Initial loading state based on `enabled` flag
 * - Fetching FIDO2 credentials on mount when enabled
 * - Skipping fetch when disabled
 * - Populating fido2Data after a successful fetch
 * - Forwarding setErrorCode to fetchUserFIDO2Credentials
 * - The refetch function re-triggers the fetch
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePasskeyOperations } from "../usePasskeyOperations";
import { fetchUserFIDO2Credentials } from "../../features/ManageFIDO2/utils/fetchUserFIDO2Credentials";

vi.mock("../../features/ManageFIDO2/utils/fetchUserFIDO2Credentials", () => ({
  fetchUserFIDO2Credentials: vi.fn(),
}));

const sampleCredentials = [
  {
    id: "cred-1",
    attributes: { nickname: "My Passkey" },
    created: "2026-01-01T00:00:00.000Z",
  },
];

/** Default mock: simulates a successful fetch that populates data and clears loading */
const mockSuccessfulFetch = ({ setLoading, setData }) => {
  setLoading(true);
  setData(sampleCredentials);
  setLoading(false);
};

describe("usePasskeyOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchUserFIDO2Credentials).mockImplementation(async (opts) =>
      mockSuccessfulFetch(opts),
    );
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it("initialises loading=true when enabled (default)", () => {
    // Pause the fetch so we can observe the initial state before it resolves
    vi.mocked(fetchUserFIDO2Credentials).mockImplementation(
      () => new Promise(() => {}),
    );
    const { result } = renderHook(() => usePasskeyOperations());
    expect(result.current.loading).toBe(true);
  });

  it("initialises fido2Data as an empty array", () => {
    vi.mocked(fetchUserFIDO2Credentials).mockImplementation(
      () => new Promise(() => {}),
    );
    const { result } = renderHook(() => usePasskeyOperations());
    expect(result.current.fido2Data).toEqual([]);
  });

  it("initialises loading=false when enabled=false", () => {
    const { result } = renderHook(() =>
      usePasskeyOperations({ enabled: false }),
    );
    expect(result.current.loading).toBe(false);
  });

  it("initialises fido2Data as an empty array when enabled=false", () => {
    const { result } = renderHook(() =>
      usePasskeyOperations({ enabled: false }),
    );
    expect(result.current.fido2Data).toEqual([]);
  });

  // ── Fetch on mount ─────────────────────────────────────────────────────────

  it("calls fetchUserFIDO2Credentials on mount when enabled", async () => {
    renderHook(() => usePasskeyOperations());
    await waitFor(() =>
      expect(fetchUserFIDO2Credentials).toHaveBeenCalledOnce(),
    );
  });

  it("does NOT call fetchUserFIDO2Credentials when enabled=false", () => {
    renderHook(() => usePasskeyOperations({ enabled: false }));
    expect(fetchUserFIDO2Credentials).not.toHaveBeenCalled();
  });

  // ── Post-fetch state ───────────────────────────────────────────────────────

  it("sets loading=false after the fetch completes", async () => {
    const { result } = renderHook(() => usePasskeyOperations());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("populates fido2Data with credentials returned by the fetch", async () => {
    const { result } = renderHook(() => usePasskeyOperations());
    await waitFor(() =>
      expect(result.current.fido2Data).toEqual(sampleCredentials),
    );
  });

  // ── setErrorCode forwarding ─────────────────────────────────────────────────

  it("passes setErrorCode to fetchUserFIDO2Credentials", async () => {
    const setErrorCode = vi.fn();
    renderHook(() => usePasskeyOperations({ setErrorCode }));
    await waitFor(() =>
      expect(fetchUserFIDO2Credentials).toHaveBeenCalledWith(
        expect.objectContaining({ setErrorCode }),
      ),
    );
  });

  it("passes setLoading and setData to fetchUserFIDO2Credentials", async () => {
    renderHook(() => usePasskeyOperations());
    await waitFor(() =>
      expect(fetchUserFIDO2Credentials).toHaveBeenCalledWith(
        expect.objectContaining({
          setLoading: expect.any(Function),
          setData: expect.any(Function),
        }),
      ),
    );
  });

  // ── refetch ────────────────────────────────────────────────────────────────

  it("exposes a refetch function", async () => {
    const { result } = renderHook(() => usePasskeyOperations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("calling refetch re-invokes fetchUserFIDO2Credentials", async () => {
    const { result } = renderHook(() => usePasskeyOperations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchUserFIDO2Credentials).toHaveBeenCalledTimes(2);
  });

  it("refetch updates fido2Data with newly returned credentials", async () => {
    const updatedCredentials = [
      ...sampleCredentials,
      {
        id: "cred-2",
        attributes: { nickname: "Second Key" },
        created: "2026-06-01T00:00:00.000Z",
      },
    ];

    const { result } = renderHook(() => usePasskeyOperations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Now change what the fetch returns
    vi.mocked(fetchUserFIDO2Credentials).mockImplementationOnce(
      async ({ setLoading, setData }) => {
        setLoading(true);
        setData(updatedCredentials);
        setLoading(false);
      },
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.fido2Data).toEqual(updatedCredentials);
  });

  // ── Return shape ───────────────────────────────────────────────────────────

  it("returns fido2Data, loading, and refetch", async () => {
    const { result } = renderHook(() => usePasskeyOperations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toHaveProperty("fido2Data");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("refetch");
  });
});
