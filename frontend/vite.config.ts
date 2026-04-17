import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
    plugins: [tsConfigPaths(), tailwindcss(), tanstackStart(), nitro()],
    ssr: {
        noExternal: ["@gravity-ui/icons"],
    },
});
