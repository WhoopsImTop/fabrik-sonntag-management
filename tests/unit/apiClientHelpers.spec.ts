import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAuthHeaders,
  handleApiError,
  apiCall,
} from "../../utils/apiClientHelpers";

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: () => null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("getAuthHeaders", () => {
  it("liefert leeres Objekt ohne Token", () => {
    const storage = createMemoryStorage();
    expect(getAuthHeaders(storage)).toEqual({});
  });

  it("setzt Bearer-Header wenn JWT vorhanden", () => {
    const storage = createMemoryStorage({ jwt: "tok-123" });
    expect(getAuthHeaders(storage)).toEqual({
      Authorization: "Bearer tok-123",
    });
  });
});

describe("handleApiError", () => {
  const toast = { add: vi.fn() };
  const router = { push: vi.fn() };

  beforeEach(() => {
    toast.add.mockClear();
    router.push.mockClear();
  });

  it("bei 401: löscht JWT, Toast und Redirect", () => {
    const storage = createMemoryStorage({ jwt: "old-token" });
    handleApiError(
      { status: 401 },
      "users.get",
      toast,
      router,
      { storage, toastColor: "red" },
    );

    expect(storage.getItem("jwt")).toBeNull();
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sitzung abgelaufen", color: "red" }),
    );
    expect(router.push).toHaveBeenCalledWith("/login");
  });

  it("bei 404: zeigt Status-Toast ohne Logout", () => {
    const storage = createMemoryStorage({ jwt: "still-here" });
    handleApiError(
      { status: 404 },
      "resources.get",
      toast,
      router,
      { storage },
    );

    expect(storage.getItem("jwt")).toBe("still-here");
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Fehler",
        description: expect.stringMatching(/nicht gefunden/i),
      }),
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("respektiert custom statusMessages", () => {
    handleApiError(
      { status: 409 },
      "meters.create",
      toast,
      router,
      {
        storage: createMemoryStorage(),
        statusMessages: { 409: "Diese Meter ID existiert bereits." },
        toastColor: "error",
      },
    );

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Diese Meter ID existiert bereits.",
        color: "error",
      }),
    );
  });
});

describe("apiCall", () => {
  it("gibt Ergebnis bei Erfolg zurück", async () => {
    const result = await apiCall(
      async () => ({ ok: true }),
      "test",
      { add: vi.fn() },
      { push: vi.fn() },
    );
    expect(result).toEqual({ ok: true });
  });

  it("gibt null zurück und handled Fehler", async () => {
    const toast = { add: vi.fn() };
    const router = { push: vi.fn() };
    const result = await apiCall(
      async () => {
        throw { status: 500 };
      },
      "test",
      toast,
      router,
      { storage: createMemoryStorage() },
    );
    expect(result).toBeNull();
    expect(toast.add).toHaveBeenCalled();
  });
});
