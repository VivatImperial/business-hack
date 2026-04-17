type SnackbarMessage = string | { text: string; variant: "error" };
type Listener = () => void;

let current: SnackbarMessage | null = null;
const listeners = new Set<Listener>();

function emit() {
    for (const l of listeners) l();
}

export const snackbarStore = {
    show(message: string) {
        current = message;
        emit();
    },
    showError(message: string) {
        current = { text: message, variant: "error" };
        emit();
    },
    clear() {
        current = null;
        emit();
    },
    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot(): SnackbarMessage | null {
        return current;
    },
};
