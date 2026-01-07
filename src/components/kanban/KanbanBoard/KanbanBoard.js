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
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import Column from '../Column/Column';
import LeadCard from '../LeadCard/LeadCard';
import styles from './KanbanBoard.module.css';

export default function KanbanBoard({
    pipelines = [],
    onLeadMove,
    onLeadClick,
    onAddLead,
    onAddColumn,
    onEditColumn,
    onDeleteColumn,
    loading = false,
}) {
    const [activeId, setActiveId] = useState(null);
    const [activeLead, setActiveLead] = useState(null);

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

        const { lead } = findLeadById(active.id);
        setActiveLead(lead);
    }, [findLeadById]);

    const handleDragOver = useCallback((event) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

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

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activePipeline = findPipelineByLeadId(activeId);
        let overPipeline = findPipelineByLeadId(overId);

        // If over is a column
        if (!overPipeline && over.data.current?.type === 'column') {
            overPipeline = over.data.current.pipeline;
        }

        if (!activePipeline || !overPipeline) return;

        // Calculate new order index
        const overLeads = overPipeline.leads || [];
        const overIndex = overLeads.findIndex((l) => l.id === overId);
        const newOrderIndex = overIndex >= 0 ? overIndex : overLeads.length;

        onLeadMove?.(activeId, overPipeline.id, newOrderIndex);
    }, [findPipelineByLeadId, onLeadMove]);

    if (loading) {
        return (
            <div className={styles.loading}>
                {[...Array(5)].map((_, i) => (
                    <Column key={i} loading />
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.board}>
                {pipelines.map((pipeline) => (
                    <Column
                        key={pipeline.id}
                        pipeline={pipeline}
                        leads={pipeline.leads || []}
                        onLeadClick={onLeadClick}
                        onAddLead={onAddLead}
                        onEditColumn={onEditColumn}
                        onDeleteColumn={onDeleteColumn}
                    />
                ))}

                <button className={styles.addColumn} onClick={onAddColumn}>
                    <Plus size={20} />
                    Adicionar Coluna
                </button>
            </div>

            <DragOverlay>
                {activeLead ? (
                    <div className={styles.dragOverlay}>
                        <LeadCard lead={activeLead} isDragging />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

