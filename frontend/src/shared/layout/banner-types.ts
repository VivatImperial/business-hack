import type { ReactNode } from "react";
import type { SettingsIssue } from "@/features/settings/types";

export interface Banner {
    id: string;
    title: string;
    description: ReactNode;
    variant: "default" | "warning" | "error";
    isDismissible: boolean;
    /** For issues banner — the raw issue list for structured rendering */
    issues?: SettingsIssue[];
    action?: {
        label: string;
        to: string;
    };
}
