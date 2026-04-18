import { useMeApiV1AdminMeGet } from "@/lib/api/generated/admin-auth/admin-auth";
import { useMeApiV1ClientMeGet } from "@/lib/api/generated/client-auth/client-auth";
import { getRole } from "@/lib/auth";

/**
 * Role-aware "me" hook: calls the right `/me` endpoint based on the stored
 * auth role. Returns a normalized `{ login, role, isLoading }` object.
 */
export function useMe() {
    const role = getRole();
    const isAdmin = role === "admin";

    const adminQuery = useMeApiV1AdminMeGet({
        query: {
            enabled: isAdmin,
            staleTime: 60_000,
            retry: false,
        },
    });

    const clientQuery = useMeApiV1ClientMeGet({
        query: {
            enabled: !isAdmin,
            staleTime: 60_000,
            retry: false,
        },
    });

    const active = isAdmin ? adminQuery : clientQuery;
    const data = active.data?.status === 200 ? active.data.data : undefined;

    return {
        login: data?.login ?? "",
        role,
        isAdmin,
        isLoading: active.isLoading,
    };
}
