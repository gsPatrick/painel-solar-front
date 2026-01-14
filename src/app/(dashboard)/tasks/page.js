'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Check,
    User,
    Calendar,
    Edit2,
    Trash2,
    Clock,
    Filter,
    CheckCircle
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import TaskModal from '@/components/tasks/TaskModal/TaskModal';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import { taskService, leadService, appointmentService } from '@/services/api';
import styles from './page.module.css';

export default function TasksPage() {
    // Data States
    const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'done'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'tomorrow', 'overdue', 'week'
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, dateFilter, searchQuery]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedTasks, fetchedLeads] = await Promise.all([
                taskService.getAll(),
                leadService.getAll()
            ]);
            setTasks(fetchedTasks || []);
            setLeads(fetchedLeads || []);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleCreateTask = async (data) => {
        setModalLoading(true);
        try {
            if (editingTask) {
                const updated = await taskService.update(editingTask.id, data);
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                setEditingTask(null);
            } else {
                const newT = await taskService.create(data);
                setTasks(prev => [newT, ...prev]);
            }
            setShowTaskModal(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar tarefa");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm('Excluir esta tarefa?')) return;
        try {
            await taskService.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleCompleteTask = async (task) => {
        try {
            if (task.status === 'done') {
                // Reopen
                await taskService.update(task.id, { status: 'pending' });
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'pending' } : t));
            } else {
                // Complete
                await taskService.markAsDone(task.id);
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' } : t));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Filtering Logic ---

    const getFilteredTasks = () => {
        return tasks.filter(task => {
            // 1. Status Filter
            if (statusFilter !== 'all' && task.status !== statusFilter) return false;

            // 2. Search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const leadName = task.lead?.name?.toLowerCase() || '';
                const title = task.title?.toLowerCase() || '';
                if (!leadName.includes(q) && !title.includes(q)) return false;
            }

            // 3. Date Filter
            if (dateFilter !== 'all') {
                const due = new Date(task.due_date);
                due.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dateFilter === 'today') {
                    if (due.getTime() !== today.getTime()) return false;
                } else if (dateFilter === 'tomorrow') {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    if (due.getTime() !== tomorrow.getTime()) return false;
                } else if (dateFilter === 'overdue') {
                    if (task.status !== 'done' && due < today) return true;
                    return false;
                } else if (dateFilter === 'week') {
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    if (due < today || due > nextWeek) return false;
                }
            }

            return true;
        })
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)); // Sort by date ascending
    };

    const filteredTasks = getFilteredTasks();
    const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // --- Helper UI ---

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        // e.g. "12 jan"
    };

    const isLate = (task) => {
        if (task.status === 'done') return false;
        const due = new Date(task.due_date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return due < now;
    };

    return (
        <>
            <Header title="Dashboard de Lembretes" />
            <div className={styles.container}>
                {/* Actions Toolbar */}
                <div className={styles.header}>
                    <div /> {/* Spacer to push button to right if needed, or just let justify-between work */}
                    <button
                        className={styles.btnNew}
                        onClick={() => {
                            if (leads.length === 0) setShowLeadModal(true);
                            else {
                                setEditingTask(null);
                                setShowTaskModal(true);
                            }
                        }}
                    >
                        <Plus size={20} />
                        Novo Lembrete
                    </button>
                </div>

                {/* Filter Bar */}
                <div className={styles.filtersContainer}>
                    {/* Search */}
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            className={styles.searchInput}
                            placeholder="🔍 Buscar tarefa ou cliente..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Groups */}
                    <div className={styles.filterGroups}>
                        {/* Status Toggle */}
                        <div className={styles.filterGroup}>
                            <button
                                className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('pending')}
                            >
                                Pendentes
                            </button>
                            <button
                                className={`${styles.filterBtn} ${statusFilter === 'done' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('done')}
                            >
                                Concluídas
                            </button>
                        </div>

                        {/* Date Filters */}
                        <div className={styles.filterGroup}>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'all' ? styles.active : ''}`}
                                onClick={() => setDateFilter('all')}
                            >
                                Todas
                            </button>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'overdue' ? styles.active : ''}`}
                                onClick={() => { setDateFilter('overdue'); setStatusFilter('pending'); }}
                                style={{ color: dateFilter === 'overdue' ? '#DC2626' : undefined }}
                            >
                                Atrasadas
                            </button>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'today' ? styles.active : ''}`}
                                onClick={() => setDateFilter('today')}
                            >
                                Hoje
                            </button>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'tomorrow' ? styles.active : ''}`}
                                onClick={() => setDateFilter('tomorrow')}
                            >
                                Amanhã
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task Grid */}
                <div className={styles.taskGrid}>
                    <AnimatePresence mode='wait'>
                        {paginatedTasks.length > 0 ? (
                            paginatedTasks.map(task => {
                                const late = isLate(task);
                                const statusClass = task.status === 'done' ? 'status-done' : late ? 'status-late' : 'status-pending';
                                const priorityClass = late ? 'priority-high' : 'priority-normal'; // Simplify priority logic to visual urgency

                                return (
                                    <motion.div
                                        key={task.id}
                                        className={`${styles.taskCard} ${styles[statusClass]} ${styles[priorityClass]}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => setEditingTask(task)} // Click card to view/edit? No, seperate edit button is safer
                                    >
                                        <div className={styles.cardLeftBorder}></div>

                                        <div className={styles.cardHeader}>
                                            <h3 className={styles.taskTitle}>{task.title}</h3>
                                            <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
                                                {task.status === 'done' ? 'Concluída' : late ? 'Atrasada' : 'Pendente'}
                                            </span>
                                        </div>

                                        <div className={styles.cardBody}>
                                            {task.lead && (
                                                <div className={styles.infoRow}>
                                                    <User size={14} className={styles.icon} />
                                                    <span className={styles.leadName}>{task.lead.name}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoRow}>
                                                <Calendar size={14} className={styles.icon} />
                                                <span>{formatDate(task.due_date)}</span>
                                                {task.due_date && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>}
                                            </div>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <button
                                                className={`${styles.actionBtn} ${task.status === 'done' ? styles.btnComplete : ''}`}
                                                title={task.status === 'done' ? "Reabrir" : "Concluir"}
                                                onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                                            >
                                                {task.status === 'done' ? <CheckCircle size={18} /> : <Check size={18} />}
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                title="Editar"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTask(task);
                                                    setShowTaskModal(true);
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                title="Excluir"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTask(task.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className={styles.emptyState}>
                                <p>Nenhuma tarefa encontrada com esses filtros.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                {filteredTasks.length > ITEMS_PER_PAGE && (
                    <div className={styles.pagination}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </button>
                        <span className={styles.pageInfo}>
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Próxima
                        </button>
                    </div>
                )}

                {/* Task Modal */}
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
                    onSubmit={handleCreateTask}
                    task={editingTask}
                    leads={leads}
                    loading={modalLoading}
                />

                {/* Lead Modal (Quick Create) */}
                <LeadModal
                    isOpen={showLeadModal}
                    onClose={() => setShowLeadModal(false)}
                    onSubmit={async (data) => {
                        const newLead = await leadService.create(data);
                        setLeads(prev => [newLead, ...prev]);
                        setShowLeadModal(false);
                        setShowTaskModal(true);
                    }}
                />
            </div>
        </>
    );
}
