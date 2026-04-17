import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "bb_access_list_v1";

export interface AccessEntry {
    id: string;
    email: string;
    password: string;
    createdAt: number;
}

type Listener = () => void;

let cache: AccessEntry[] = [];
let initialized = false;
const listeners = new Set<Listener>();

function emit() {
    for (const l of listeners) l();
}

function load(): AccessEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as AccessEntry[];
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

function persist(next: AccessEntry[]) {
    cache = next;
    if (typeof window !== "undefined") {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore
        }
    }
    emit();
}

function ensureInit() {
    if (!initialized && typeof window !== "undefined") {
        cache = load();
        initialized = true;
    }
}

function randomId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generatePassword(length = 16): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#%&*?";
    let out = "";
    const values = new Uint32Array(length);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        crypto.getRandomValues(values);
    } else {
        for (let i = 0; i < length; i++)
            values[i] = Math.floor(Math.random() * 0xffffffff);
    }
    for (let i = 0; i < length; i++) {
        out += chars[values[i] % chars.length];
    }
    return out;
}

export const accessStore = {
    subscribe(listener: Listener): () => void {
        ensureInit();
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot(): AccessEntry[] {
        ensureInit();
        return cache;
    },
    getServerSnapshot(): AccessEntry[] {
        return [];
    },
    create(email: string, password: string): AccessEntry {
        ensureInit();
        const entry: AccessEntry = {
            id: randomId(),
            email,
            password,
            createdAt: Date.now(),
        };
        persist([entry, ...cache]);
        return entry;
    },
    remove(id: string): void {
        ensureInit();
        persist(cache.filter((e) => e.id !== id));
    },
};

export function useAccessEntries() {
    const entries = useSyncExternalStore(
        accessStore.subscribe,
        accessStore.getSnapshot,
        accessStore.getServerSnapshot,
    );
    const create = useCallback(
        (email: string, password: string) => accessStore.create(email, password),
        [],
    );
    const remove = useCallback((id: string) => accessStore.remove(id), []);
    return { entries, create, remove };
}
