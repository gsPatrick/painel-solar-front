'use client';

import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Plus, Inbox, Edit2, Trash2 } from 'lucide-react';
import LeadCard from '../LeadCard/LeadCard';
import styles from './Column.module.css';

export default function Column({
    pipeline,
    leads = [],
    onLeadClick,
    onAddLead,
    onEditColumn,
    onDeleteColumn,
    loading = false,
}) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const { setNodeRef, isOver } = useDroppable({
        id: pipeline?.id || 'skeleton',
        data: {
            type: 'column',
            pipeline,
        },
    });

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div className={`${styles.column} ${styles.skeleton}`}>
                <div className={styles.header}>
                    <div className={styles.titleWrapper}>
                        <div className={styles.colorDot} />
                        <div className="skeleton" style={{ width: 100, height: 18 }} />
                    </div>
                    <div className={styles.count}>0</div>
                </div>
                <div className={styles.content}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            </div>
        );
    }

    const columnStyle = {
        '--column-color': pipeline.color || '#4318FF',
    };

    const handleEdit = () => {
        setShowMenu(false);
        onEditColumn?.(pipeline);
    };

    const handleDelete = () => {
        setShowMenu(false);
        onDeleteColumn?.(pipeline);
    };

    return (
        <motion.div
            className={styles.column}
            style={columnStyle}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.header}>
                <div className={styles.titleWrapper}>
                    <span className={styles.colorDot} />
                    <span className={styles.title}>{pipeline.title}</span>
                    <span className={styles.count}>{leads.length}</span>
                </div>
                <div className={styles.actions} ref={menuRef}>
                    <button className={styles.actionBtn} onClick={() => onAddLead?.(pipeline)}>
                        <Plus size={16} />
                    </button>
                    <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)}>
                        <MoreHorizontal size={16} />
                    </button>

                    {showMenu && (
                        <div className={styles.dropdown}>
                            <button className={styles.dropdownItem} onClick={handleEdit}>
                                <Edit2 size={14} />
                                Editar Funil
                            </button>
                            <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleDelete}>
                                <Trash2 size={14} />
                                Excluir Funil
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <SortableContext
                items={leads.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className={`${styles.content} ${isOver ? styles.dragOver : ''}`}
                >
                    {leads.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Inbox className={styles.emptyIcon} />
                            <span className={styles.emptyText}>
                                Nenhum lead nesta etapa
                            </span>
                            <button
                                className={styles.addButton}
                                onClick={() => onAddLead?.(pipeline)}
                            >
                                <Plus size={16} />
                                Adicionar Lead
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {leads.map((lead, index) => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    onClick={onLeadClick}
                                />
                            ))}
                        </AnimatePresence>
                    )}

                    {leads.length > 0 && (
                        <button
                            className={styles.addButton}
                            onClick={() => onAddLead?.(pipeline)}
                        >
                            <Plus size={16} />
                            Adicionar Lead
                        </button>
                    )}
                </div>
            </SortableContext>
        </motion.div>
    );
}

