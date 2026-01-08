'use client';

import { useState, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import Column from '../Column/Column';
import LeadCard from '../LeadCard/LeadCard';
import styles from './KanbanBoard.module.css';

// Wrapper for Sortable Column
function SortableColumn({ pipeline, ...props }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: pipeline.id,
        data: {
            type: 'column',
            pipeline,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none', // Prevent scrolling conflict on mobile
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {/* Listeners applied to handle for drag */}
            <div {...listeners} style={{ cursor: 'grab', height: '100%' }}>
                <Column pipeline={pipeline} {...props} />
            </div>
        </div>
    );
}

const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.4',
            },
        },
    }),
};

export default function KanbanBoard({
    pipelines = [],
    onLeadMove,
    onLeadClick,
    onAddLead,
    onAddColumn,
    onEditColumn,
    onDeleteColumn,
    onPipelineReorder,
    loading = false,
}) {
    const [activeId, setActiveId] = useState(null);
    const [activeLead, setActiveLead] = useState(null);
    const [activeColumn, setActiveColumn] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findLeadById = useCallback((id) => {
        for (const pipeline of pipelines) {
            const lead = pipeline.leads?.find((l) => l.id === id);
            if (lead) {
                return { lead, pipeline };
            }
        }
        return { lead: null, pipeline: null };
    }, [pipelines]);

    const findPipelineByLeadId = useCallback((id) => {
        return pipelines.find((p) => p.leads?.some((l) => l.id === id));
    }, [pipelines]);

    const handleDragStart = useCallback((event) => {
        const { active } = event;
        setActiveId(active.id);

        if (active.data.current?.type === 'column') {
            setActiveColumn(active.data.current.pipeline);
            return;
        }

        const { lead } = findLeadById(active.id);
        setActiveLead(lead);
    }, [findLeadById]);

    const handleDragOver = useCallback((event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // If dragging column, do nothing on drag over
        if (active.data.current?.type === 'column') return;

        // Find the pipelines containing the active and over items
        const activePipeline = findPipelineByLeadId(activeId);
        let overPipeline = findPipelineByLeadId(overId);

        // If over is a column (not a lead)
        if (!overPipeline && over.data.current?.type === 'column') {
            overPipeline = over.data.current.pipeline;
        }

        if (!activePipeline || !overPipeline) return;
        if (activePipeline.id === overPipeline.id) return;

        // Move lead to new pipeline
        onLeadMove?.(activeId, overPipeline.id, 0);
    }, [findPipelineByLeadId, onLeadMove]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveLead(null);
        setActiveColumn(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Column Reordering
        if (active.data.current?.type === 'column') {
            if (activeId !== overId) {
                const oldIndex = pipelines.findIndex((p) => p.id === activeId);
                const newIndex = pipelines.findIndex((p) => p.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(pipelines, oldIndex, newIndex);
                    // Call parent handler with new order (array of pipelines)
                    onPipelineReorder?.(newOrder);
                }
            }
            return;
        }

        // Lead Reordering (same column)
        const activePipeline = findPipelineByLeadId(activeId);
        const overPipeline = findPipelineByLeadId(overId);

        if (activePipeline && overPipeline && activePipeline.id === overPipeline.id) {
            const activeIndex = activePipeline.leads.findIndex(l => l.id === activeId);
            const overIndex = activePipeline.leads.findIndex(l => l.id === overId);

            if (activeIndex !== overIndex) {
                // Calculate new order index for API
                // Logic simplified, assuming backend handles relative position or frontend optimistic update handles arrayMove
                onLeadMove?.(activeId, activePipeline.id, overIndex);
            }
        } else if (activePipeline && overPipeline) {
            // Different column (already handled by dragOver, but final settle here)
            // We can just rely on dragOver for inter-column transport, usually enough in current logic
        }

    }, [pipelines, findPipelineByLeadId, onPipelineReorder, onLeadMove]);

    if (loading) {
        return (
            <div className={styles.loading}>
                {[...Array(5)].map((_, i) => (
                    <Column key={i} loading />
                ))}
            </div>
        );
    }

    // Sortable items for columns
    const pipelineIds = pipelines.map(p => p.id);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.board}>
                <SortableContext items={pipelineIds} strategy={horizontalListSortingStrategy}>
                    {pipelines.map((pipeline) => (
                        <SortableColumn
                            key={pipeline.id}
                            pipeline={pipeline}
                            leads={pipeline.leads || []}
                            onLeadClick={onLeadClick}
                            onAddLead={onAddLead}
                            onEditColumn={onEditColumn}
                            onDeleteColumn={onDeleteColumn}
                        />
                    ))}
                </SortableContext>

                <button className={styles.addColumn} onClick={onAddColumn}>
                    <Plus size={20} />
                    Adicionar Coluna
                </button>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeColumn ? (
                    <div style={{ transform: 'rotate(3deg)', opacity: 0.8 }}>
                        <Column
                            pipeline={activeColumn}
                            leads={activeColumn.leads || []}
                            // Pass empty handlers for overlay
                            onLeadClick={() => { }}
                            onAddLead={() => { }}
                            onEditColumn={() => { }}
                            onDeleteColumn={() => { }}
                        />
                    </div>
                ) : activeLead ? (
                    <div className={styles.dragOverlay}>
                        <LeadCard lead={activeLead} isDragging />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

