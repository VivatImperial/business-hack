import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Bars3BottomLeftIcon } from "@heroicons/react/24/solid";
import {
    type CSSProperties,
    type ComponentProps,
    type ReactNode,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
    state: "expanded" | "collapsed";
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContext | null>(null);

function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }
    return context;
}

const SidebarProvider = forwardRef<
    HTMLDivElement,
    ComponentProps<"div"> & {
        defaultOpen?: boolean;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }
>(
    (
        {
            defaultOpen = true,
            open: openProp,
            onOpenChange: setOpenProp,
            className,
            style,
            children,
            ...props
        },
        ref,
    ) => {
        const isMobile = useIsMobile();
        const [openMobile, setOpenMobile] = useState(false);
        const [_open, _setOpen] = useState(defaultOpen);
        const open = openProp ?? _open;

        const setOpen = useCallback(
            (value: boolean | ((value: boolean) => boolean)) => {
                const openState =
                    typeof value === "function" ? value(open) : value;
                if (setOpenProp) {
                    setOpenProp(openState);
                } else {
                    _setOpen(openState);
                }
                if (typeof document !== "undefined") {
                    document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
                }
            },
            [setOpenProp, open],
        );

        const toggleSidebar = useCallback(() => {
            return isMobile
                ? setOpenMobile((open) => !open)
                : setOpen((open) => !open);
        }, [isMobile, setOpen, setOpenMobile]);

        useEffect(() => {
            if (typeof window === "undefined") return;
            const handleKeyDown = (event: KeyboardEvent) => {
                if (
                    event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
                    (event.metaKey || event.ctrlKey)
                ) {
                    event.preventDefault();
                    toggleSidebar();
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [toggleSidebar]);

        const state = open ? "expanded" : "collapsed";

        const contextValue = useMemo<SidebarContext>(
            () => ({
                state,
                open,
                setOpen,
                isMobile,
                openMobile,
                setOpenMobile,
                toggleSidebar,
            }),
            [
                state,
                open,
                setOpen,
                isMobile,
                openMobile,
                setOpenMobile,
                toggleSidebar,
            ],
        );

        return (
            <SidebarContext.Provider value={contextValue}>
                <TooltipProvider delayDuration={0}>
                    <div
                        style={style}
                        className={cn(
                            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
                            className,
                        )}
                        ref={ref}
                        {...props}
                    >
                        {children}
                    </div>
                </TooltipProvider>
            </SidebarContext.Provider>
        );
    },
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = forwardRef<
    HTMLDivElement,
    ComponentProps<"div"> & {
        side?: "left" | "right";
        variant?: "sidebar" | "floating" | "inset";
        collapsible?: "offcanvas" | "icon" | "none";
    }
>(
    (
        { side = "left", variant = "sidebar", className, children, ...props },
        ref,
    ) => {
        const { isMobile, openMobile, setOpenMobile } = useSidebar();

        if (isMobile) {
            return (
                <Sheet
                    open={openMobile}
                    onOpenChange={setOpenMobile}
                    {...props}
                >
                    <SheetContent
                        data-sidebar="sidebar"
                        data-mobile="true"
                        className="w-[250px] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
                        side={side}
                    >
                        <div className="flex h-full w-full flex-col">
                            {children}
                        </div>
                    </SheetContent>
                </Sheet>
            );
        }

        return (
            <div
                ref={ref}
                className="group peer hidden md:block text-sidebar-foreground"
                data-variant={variant}
                data-side={side}
            >
                <div className="relative h-svh w-[250px] bg-transparent" />
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-10 hidden h-svh w-[250px] md:flex",
                        className,
                    )}
                    {...props}
                >
                    <div
                        data-sidebar="sidebar"
                        className="flex h-full w-full flex-col bg-sidebar"
                    >
                        {children}
                    </div>
                </div>
            </div>
        );
    },
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = forwardRef<
    HTMLButtonElement,
    ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
        <Button
            ref={ref}
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", className)}
            onClick={(event) => {
                onClick?.(event);
                toggleSidebar();
            }}
            {...props}
        >
            <Bars3BottomLeftIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = forwardRef<HTMLButtonElement, ComponentProps<"button">>(
    ({ className, ...props }, ref) => {
        const { toggleSidebar } = useSidebar();

        return (
            <button
                ref={ref}
                data-sidebar="rail"
                aria-label="Toggle Sidebar"
                tabIndex={-1}
                onClick={toggleSidebar}
                title="Toggle Sidebar"
                className={cn(
                    "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]:right-[-8px] group-data-[side=right]:left-[-8px] hover:after:bg-sidebar-border sm:flex",
                    "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
                    "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
                    "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
                    "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
                    "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
                    className,
                )}
                {...props}
            />
        );
    },
);
SidebarRail.displayName = "SidebarRail";

const SidebarInset = forwardRef<
    HTMLDivElement,
    ComponentProps<"main"> & {
        topContent?: ReactNode;
        footerContent?: ReactNode;
    }
>(({ className, topContent, footerContent, children, ...props }, ref) => {
    return (
        <main
            ref={ref}
            className={cn(
                "relative flex min-h-svh flex-1 flex-col px-4",
                "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
                className,
            )}
            {...props}
        >
            {topContent}
            <div className="mt-4 mb-4 flex-1 flex flex-col ">{children}</div>
            {footerContent}
        </main>
    );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                data-sidebar="input"
                className={cn(
                    "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    className,
                )}
                {...props}
            />
        );
    },
);
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = forwardRef<HTMLDivElement, ComponentProps<"div">>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-sidebar="header"
                className={cn("flex flex-col gap-2 p-2", className)}
                {...props}
            />
        );
    },
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = forwardRef<HTMLDivElement, ComponentProps<"div">>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-sidebar="footer"
                className={cn("flex flex-col gap-2 p-2", className)}
                {...props}
            />
        );
    },
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = forwardRef<
    HTMLDivElement,
    ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
    return (
        <Separator
            ref={ref}
            data-sidebar="separator"
            className={cn("mx-2 w-auto bg-sidebar-border", className)}
            {...props}
        />
    );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = forwardRef<HTMLDivElement, ComponentProps<"div">>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-sidebar="content"
                className={cn(
                    "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
                    className,
                )}
                {...props}
            />
        );
    },
);
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = forwardRef<HTMLDivElement, ComponentProps<"div">>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-sidebar="group"
                className={cn(
                    "relative flex w-full min-w-0 flex-col p-2",
                    className,
                )}
                {...props}
            />
        );
    },
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = forwardRef<
    HTMLDivElement,
    ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
        <Comp
            ref={ref}
            data-sidebar="group-label"
            className={cn(
                "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
                className,
            )}
            {...props}
        />
    );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = forwardRef<
    HTMLButtonElement,
    ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            ref={ref}
            data-sidebar="group-action"
            className={cn(
                "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "after:absolute after:-inset-2 after:md:hidden",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = forwardRef<HTMLDivElement, ComponentProps<"div">>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            data-sidebar="group-content"
            className={cn("w-full text-sm", className)}
            {...props}
        />
    ),
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = forwardRef<HTMLUListElement, ComponentProps<"ul">>(
    ({ className, ...props }, ref) => (
        <ul
            ref={ref}
            data-sidebar="menu"
            className={cn("flex w-full min-w-0 flex-col gap-1", className)}
            {...props}
        />
    ),
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = forwardRef<HTMLLIElement, ComponentProps<"li">>(
    ({ className, ...props }, ref) => (
        <li
            ref={ref}
            data-sidebar="menu-item"
            className={cn("group/menu-item relative", className)}
            {...props}
        />
    ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
    "peer/menu-button relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-2.5 text-left text-foreground outline-none ring-sidebar-ring cursor-pointer transition-all duration-200 ease-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=open]:bg-sidebar-accent data-[state=open]:text-foreground [&>span:last-child]:truncate [&>svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "hover:bg-sidebar-accent hover:text-foreground",
                outline:
                    "bg-background hover:bg-sidebar-accent hover:text-foreground",
            },
            size: {
                default: "h-10 text-[15px] font-medium [&>svg]:size-5",
                sm: "h-8 text-[13px] font-medium [&>svg]:size-4",
                lg: "h-12 text-[15px] font-medium [&>svg]:size-5",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

const SidebarMenuButton = forwardRef<
    HTMLButtonElement,
    ComponentProps<"button"> & {
        asChild?: boolean;
        isActive?: boolean;
        tooltip?: string | ComponentProps<typeof TooltipContent>;
    } & VariantProps<typeof sidebarMenuButtonVariants>
>(
    (
        {
            asChild = false,
            isActive = false,
            variant = "default",
            size = "default",
            tooltip,
            className,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";
        const { isMobile, state } = useSidebar();

        const button = (
            <Comp
                ref={ref}
                data-sidebar="menu-button"
                data-size={size}
                data-active={isActive}
                className={cn(
                    sidebarMenuButtonVariants({ variant, size }),
                    className,
                )}
                {...props}
            />
        );

        if (!tooltip) {
            return button;
        }

        if (typeof tooltip === "string") {
            tooltip = { children: tooltip };
        }

        return (
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent
                    side="right"
                    align="center"
                    hidden={state !== "collapsed" || isMobile}
                    {...tooltip}
                />
            </Tooltip>
        );
    },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = forwardRef<
    HTMLButtonElement,
    ComponentProps<"button"> & {
        asChild?: boolean;
        showOnHover?: boolean;
    }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            ref={ref}
            data-sidebar="menu-action"
            className={cn(
                "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
                "after:absolute after:-inset-2 after:md:hidden",
                "group-data-[collapsible=icon]:hidden",
                showOnHover &&
                    "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
                className,
            )}
            {...props}
        />
    );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = forwardRef<HTMLDivElement, ComponentProps<"div">>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            data-sidebar="menu-badge"
            className={cn(
                "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
                "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    ),
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = forwardRef<
    HTMLDivElement,
    ComponentProps<"div"> & { showIcon?: boolean }
>(({ className, showIcon = false, ...props }, ref) => {
    const width = "70%";

    return (
        <div
            ref={ref}
            data-sidebar="menu-skeleton"
            className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2",
                className,
            )}
            style={{ "--skeleton-width": width } as CSSProperties}
            {...props}
        >
            {showIcon && (
                <Skeleton
                    className="size-4 rounded-md"
                    data-sidebar="menu-skeleton-icon"
                />
            )}
            <Skeleton
                className="h-4 max-w-[--skeleton-width] flex-1"
                data-sidebar="menu-skeleton-text"
            />
        </div>
    );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = forwardRef<HTMLUListElement, ComponentProps<"ul">>(
    ({ className, ...props }, ref) => (
        <ul
            ref={ref}
            data-sidebar="menu-sub"
            className={cn(
                "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    ),
);
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = forwardRef<HTMLLIElement, ComponentProps<"li">>(
    ({ ...props }, ref) => <li ref={ref} {...props} />,
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = forwardRef<
    HTMLAnchorElement,
    ComponentProps<"a"> & {
        asChild?: boolean;
        size?: "sm" | "md";
        isActive?: boolean;
    }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return (
        <Comp
            ref={ref}
            data-sidebar="menu-sub-button"
            data-size={size}
            data-active={isActive}
            className={cn(
                "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
};
