import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "bb_chat_sessions_v1";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
    citations?: ChatCitation[];
    confidence?: number;
    escalated?: boolean;
    pending?: boolean;
}

export interface ChatCitation {
    source_id: string;
    title: string;
    url?: string | null;
    kind: "ticket" | "article" | "unknown";
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
}

type Listener = () => void;

interface StoreState {
    sessions: ChatSession[];
}

function load(): ChatSession[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as ChatSession[];
        if (!Array.isArray(parsed)) return [];
        return parsed.slice(0, 100);
    } catch {
        return [];
    }
}

function persist(sessions: ChatSession[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
        // ignore
    }
}

function randomId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createStore() {
    let state: StoreState = { sessions: [] };
    let initialized = false;
    const listeners = new Set<Listener>();
    const emit = () => {
        for (const l of listeners) l();
    };

    const ensureInit = () => {
        if (!initialized && typeof window !== "undefined") {
            state = { sessions: load() };
            initialized = true;
        }
    };

    return {
        subscribe(listener: Listener) {
            ensureInit();
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        getSnapshot(): StoreState {
            ensureInit();
            return state;
        },
        getServerSnapshot(): StoreState {
            return { sessions: [] };
        },
        createSession(): ChatSession {
            ensureInit();
            const session: ChatSession = {
                id: randomId(),
                title: "",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: [],
            };
            state = { sessions: [session, ...state.sessions] };
            persist(state.sessions);
            emit();
            return session;
        },
        upsertMessage(sessionId: string, message: ChatMessage): void {
            ensureInit();
            const sessions = state.sessions.map((s) => {
                if (s.id !== sessionId) return s;
                const existingIdx = s.messages.findIndex(
                    (m) => m.id === message.id,
                );
                let messages: ChatMessage[];
                if (existingIdx >= 0) {
                    messages = s.messages.slice();
                    messages[existingIdx] = message;
                } else {
                    messages = [...s.messages, message];
                }
                const nextTitle =
                    s.title ||
                    (message.role === "user"
                        ? message.content.slice(0, 60).trim()
                        : s.title);
                return {
                    ...s,
                    messages,
                    title: nextTitle,
                    updatedAt: Date.now(),
                };
            });
            state = { sessions };
            persist(sessions);
            emit();
        },
        renameSession(sessionId: string, title: string): void {
            ensureInit();
            const sessions = state.sessions.map((s) =>
                s.id === sessionId ? { ...s, title } : s,
            );
            state = { sessions };
            persist(sessions);
            emit();
        },
        deleteSession(sessionId: string): void {
            ensureInit();
            const sessions = state.sessions.filter((s) => s.id !== sessionId);
            state = { sessions };
            persist(sessions);
            emit();
        },
        getSession(sessionId: string): ChatSession | undefined {
            ensureInit();
            return state.sessions.find((s) => s.id === sessionId);
        },
    };
}

const chatStore = createStore();

export function useChatSessions() {
    const snapshot = useSyncExternalStore(
        chatStore.subscribe,
        chatStore.getSnapshot,
        chatStore.getServerSnapshot,
    );

    const createSession = useCallback(() => chatStore.createSession(), []);
    const upsertMessage = useCallback(
        (sessionId: string, message: ChatMessage) =>
            chatStore.upsertMessage(sessionId, message),
        [],
    );
    const deleteSession = useCallback(
        (sessionId: string) => chatStore.deleteSession(sessionId),
        [],
    );
    const renameSession = useCallback(
        (sessionId: string, title: string) =>
            chatStore.renameSession(sessionId, title),
        [],
    );

    return {
        sessions: snapshot.sessions,
        createSession,
        upsertMessage,
        deleteSession,
        renameSession,
    };
}

export function useChatSession(sessionId: string | undefined) {
    const snapshot = useSyncExternalStore(
        chatStore.subscribe,
        chatStore.getSnapshot,
        chatStore.getServerSnapshot,
    );
    const session = sessionId
        ? snapshot.sessions.find((s) => s.id === sessionId)
        : undefined;
    return session;
}

export { chatStore };
