import { createContext, useContext } from "react";

export type AppLayoutCtx = Record<string, never>;
export const AppLayoutContext = createContext<AppLayoutCtx>({});
export const useAppLayout = () => useContext(AppLayoutContext);
