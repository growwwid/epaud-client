"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getJson, type TahunAjaran } from "@/components/api";

const STORAGE_KEY = "epaud.tahun_ajaran";

type Ctx = {
  list: TahunAjaran[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  reload: () => Promise<void>;
  withTahunAjaran: (path: string) => string;
};

const TahunAjaranContext = createContext<Ctx | null>(null);

export function TahunAjaranProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [list, setList] = useState<TahunAjaran[]>([]);
  const [selectedId, setSelectedIdState] = useState("");

  const fetchList = useCallback(async () => {
    const res = await getJson<TahunAjaran[]>("/api/tahun-ajaran");
    if (!res.ok) return [] as TahunAjaran[];
    return Array.isArray(res.data) ? res.data : [];
  }, []);

  const apply = useCallback((items: TahunAjaran[]) => {
    setList(items);
    setSelectedIdState((prev) => {
      if (prev && items.some((t) => t.id === prev)) return prev;
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (stored && items.some((t) => t.id === stored)) return stored;
      return items.find((t) => t.is_active)?.id ?? items[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchList().then(apply);
  }, [enabled, fetchList, apply]);

  const reload = useCallback(async () => {
    apply(await fetchList());
  }, [fetchList, apply]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage bisa penuh / diblokir di mode privat; abaikan.
    }
  }, []);

  const withTahunAjaran = useCallback(
    (path: string) => {
      if (!selectedId) return path;
      return `${path}${path.includes("?") ? "&" : "?"}tahun_ajaran_id=${selectedId}`;
    },
    [selectedId],
  );

  const value = useMemo<Ctx>(
    () => ({
      list,
      selectedId,
      setSelectedId,
      reload,
      withTahunAjaran,
    }),
    [list, selectedId, setSelectedId, reload, withTahunAjaran],
  );

  return (
    <TahunAjaranContext.Provider value={value}>
      {children}
    </TahunAjaranContext.Provider>
  );
}

export function useTahunAjaran() {
  const ctx = useContext(TahunAjaranContext);
  if (!ctx) {
    throw new Error("useTahunAjaran harus dipakai di dalam TahunAjaranProvider");
  }
  return ctx;
}
