import { useSyncExternalStore } from "react";
import { snackbarStore } from "@/shared/lib/snackbar-store";

export function useSnackbar() {
    const message = useSyncExternalStore(
        snackbarStore.subscribe,
        snackbarStore.getSnapshot,
        snackbarStore.getSnapshot,
    );
    return {
        message,
        show: snackbarStore.show,
        showError: snackbarStore.showError,
        clear: snackbarStore.clear,
    };
}
