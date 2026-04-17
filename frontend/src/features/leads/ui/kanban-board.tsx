import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    pointerWithin,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import type { LeadRecord, LeadStatus } from "@/features/leads/types";
import type { LeadAction } from "@/lib/queries/leads";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { motion, AnimatePresence } from "@/shared/animations/motion";

import { KanbanCard } from "./kanban-card";

/* ── Column config ── */

type KanbanColumn = {
    id: string;
    title: string;
    statuses: LeadStatus[];
    color: string;
    dotColor: string;
};

const COLUMNS: KanbanColumn[] = [
    {
        id: "new",
        title: "Необработанные",
        statuses: ["new", "viewed"],
        color: "bg-slate-100/60 border border-slate-200/50",
        dotColor: "bg-amber-400",
    },
    {
        id: "in_progress",
        title: "В работе",
        statuses: ["in_progress"],
        color: "bg-slate-100/60 border border-slate-200/50",
        dotColor: "bg-blue-500",
    },
    {
        id: "rejected",
        title: "Обработанные",
        statuses: ["rejected"],
        color: "bg-slate-100/60 border border-slate-200/50",
        dotColor: "bg-stone-400",
    },
];

/* ── Types ── */

type KanbanBoardProps = {
    leads: LeadRecord[];
    onSelectLead: (lead: LeadRecord) => void;
    onSetAction: (leadId: number, action: LeadAction) => void;
    onStatusChange: (leadId: number, newStatus: LeadAction) => void;
    onCopyAndOpen: (lead: LeadRecord) => void;
};

/* ── Sortable Card Wrapper ── */

function SortableCard({
    lead,
    onSelectLead,
    onSetAction,
    onCopyAndOpen,
}: {
    lead: LeadRecord;
    onSelectLead: (lead: LeadRecord) => void;
    onSetAction: (leadId: number, action: LeadAction) => void;
    onCopyAndOpen: (lead: LeadRecord) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <KanbanCard
                lead={lead}
                onClick={() => onSelectLead(lead)}
                onSetAction={onSetAction}
                onCopyAndOpen={onCopyAndOpen}
                isDragging={isDragging}
                dragListeners={listeners}
                dragAttributes={attributes}
            />
        </div>
    );
}

/* ── Empty State ── */

const EMPTY_STATES: Record<string, { text: string }> = {
    new: {
        text: "Новые лиды появятся здесь",
    },
    in_progress: {
        text: "Перетащите сюда лидов в работу",
    },
    rejected: {
        text: "Обработанные лиды попадут сюда",
    },
};

function EmptyColumn({ columnId }: { columnId: string }) {
    const state = EMPTY_STATES[columnId] ?? EMPTY_STATES.new;
    return (
        <div className="flex flex-col items-center justify-center pt-36 pb-16 px-4">
            <p className="text-[13px] font-medium text-slate-400 text-center max-w-[200px] leading-relaxed">
                {state.text}
            </p>
        </div>
    );
}

/* ── Board ── */

export function KanbanBoard({
    leads,
    onSelectLead,
    onSetAction,
    onStatusChange,
    onCopyAndOpen,
}: KanbanBoardProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [overColumnId, setOverColumnId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const columnLeads = useMemo(() => {
        const result: Record<string, LeadRecord[]> = {};
        for (const col of COLUMNS) {
            result[col.id] = leads.filter((l) => {
                if (!l?.status) return false;
                // Favorited leads go to "Закрытые" column
                if (l.isFavorite && col.id === "rejected") return true;
                if (l.isFavorite) return false;
                return col.statuses.includes(l.status);
            });
        }
        return result;
    }, [leads]);

    const activeLead = activeId
        ? (leads.find((l) => l.id === activeId) ?? null)
        : null;

    const findColumnForLead = (leadId: number): string | null => {
        for (const col of COLUMNS) {
            if (columnLeads[col.id].some((l) => l.id === leadId)) {
                return col.id;
            }
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (!over) {
            setOverColumnId(null);
            return;
        }

        let targetCol: string | null = null;
        if (COLUMNS.some((c) => c.id === over.id)) {
            targetCol = over.id as string;
        } else {
            targetCol = findColumnForLead(over.id as number);
        }

        const sourceCol = activeId ? findColumnForLead(activeId) : null;
        setOverColumnId(targetCol !== sourceCol ? targetCol : null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverColumnId(null);

        if (!over) return;

        const activeLeadId = active.id as number;
        const sourceCol = findColumnForLead(activeLeadId);

        // Determine target column
        let targetCol: string | null = null;

        // Check if dropped over a column directly
        if (COLUMNS.some((c) => c.id === over.id)) {
            targetCol = over.id as string;
        } else {
            // Dropped over another card — find its column
            targetCol = findColumnForLead(over.id as number);
        }

        if (!targetCol || targetCol === sourceCol) return;

        // Map column id to action
        const actionMap: Record<string, LeadAction> = {
            new: "none",
            in_progress: "in_progress",
            rejected: "rejected",
        };

        const action = actionMap[targetCol];
        if (action) {
            onStatusChange(activeLeadId, action);
        }
    };

    const columns = COLUMNS.map((col) => {
        const items = columnLeads[col.id];
        const ids = items.map((l) => l.id);

        return (
            <KanbanColumnView
                key={col.id}
                column={col}
                count={items.length}
                leadIds={ids}
                isDropTarget={overColumnId === col.id}
            >
                {items.length === 0 ? (
                    <EmptyColumn columnId={col.id} />
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <AnimatePresence mode="popLayout">
                            {items.map((lead) => (
                                <motion.div
                                    key={lead.id}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.95,
                                        transition: { duration: 0.2 },
                                    }}
                                >
                                    <SortableCard
                                        lead={lead}
                                        onSelectLead={onSelectLead}
                                        onSetAction={onSetAction}
                                        onCopyAndOpen={onCopyAndOpen}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </KanbanColumnView>
        );
    });

    // Defer DndContext to client to avoid aria-describedby hydration mismatch
    if (!mounted) {
        return (
            <TooltipProvider>
                <div
                    className="grid grid-cols-3 gap-4"
                    style={{ minHeight: "calc(100vh - 220px)" }}
                >
                    {columns}
                </div>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div
                    className="grid grid-cols-3 gap-4"
                    style={{ minHeight: "calc(100vh - 220px)" }}
                >
                    {columns}
                </div>

                {/* Drag overlay */}
                <DragOverlay>
                    {activeLead ? (
                        <KanbanCard
                            lead={activeLead}
                            onClick={() => {}}
                            onSetAction={() => {}}
                            isDragging
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </TooltipProvider>
    );
}

/* ── Column component ── */

function DropPlaceholder() {
    return (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
                <svg
                    className="size-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                    />
                </svg>
            </div>
        </div>
    );
}

function KanbanColumnView({
    column,
    count,
    leadIds,
    isDropTarget,
    children,
}: {
    column: KanbanColumn;
    count: number;
    leadIds: number[];
    isDropTarget?: boolean;
    children: React.ReactNode;
}) {
    const { setNodeRef } = useSortable({
        id: column.id,
        data: { type: "column" },
        disabled: true,
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-2xl transition-colors duration-150 ${
                isDropTarget
                    ? "bg-blue-50/60 border border-blue-200/60"
                    : column.color
            }`}
        >
            {/* Column header */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
                <span
                    className={`inline-block size-2 rounded-full ${column.dotColor}`}
                />
                <h3 className="text-[14px] font-bold text-slate-900">
                    {column.title}
                </h3>
                <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[12px] font-bold tabular-nums text-slate-500">
                    {count}
                </span>
            </div>

            {/* Cards area */}
            <div className="flex-1 overflow-y-auto px-2.5 pb-2.5">
                <SortableContext
                    items={leadIds}
                    strategy={verticalListSortingStrategy}
                >
                    {isDropTarget && <DropPlaceholder />}
                    {children}
                </SortableContext>
            </div>
        </div>
    );
}
