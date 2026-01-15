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
    CheckCircle,
    Bell
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import TaskModal from '@/components/tasks/TaskModal/TaskModal';
import { appointmentService, leadService } from '@/services/api';
import styles from '../tasks/page.module.css';

export default function RemindersPage() {
    // Data States
    const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('scheduled'); // 'scheduled', 'completed'
    const [dateFilter, setDateFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
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
            const [fetchedAppointments, fetchedLeads] = await Promise.all([
                appointmentService.getAll({ type: 'LEMBRETE' }),
                leadService.getAll()
            ]);
            setTasks(fetchedAppointments || []);
            setLeads(fetchedLeads || []);
        } catch (error) {
            console.error("Error loading reminders:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleCreateTask = async (data) => {
        setModalLoading(true);
        try {
            // Map Modal Data (Task format) to Appointment format
            const payload = {
                title: data.title,
                description: data.description,
                lead_id: data.lead_id || null,
                date_time: data.due_date, // Map due_date -> date_time
                type: 'LEMBRETE',
                status: 'scheduled'
            };

            if (editingTask) {
                const updated = await appointmentService.update(editingTask.id, payload);
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                setEditingTask(null);
            } else {
                const newT = await appointmentService.create(payload);
                setTasks(prev => [newT, ...prev]);
            }
            setShowTaskModal(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar lembrete");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm('Excluir este lembrete?')) return;
        try {
            await appointmentService.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleCompleteTask = async (task) => {
        try {
            if (task.status === 'completed') {
                // Reopen
                await appointmentService.update(task.id, { status: 'scheduled' });
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'scheduled' } : t));
            } else {
                // Complete
                await appointmentService.complete(task.id);
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
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
                const due = new Date(task.date_time); // Use date_time
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
                    if (task.status !== 'completed' && due < today) return true;
                    return false;
                }
            }

            return true;
        })
            .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
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
    };

    const isLate = (task) => {
        if (task.status === 'completed') return false;
        const due = new Date(task.date_time);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return due < now;
    };

    return (
        <>
            <Header title="Meus Lembretes" />
            <div className={styles.container}>
                {/* Actions Toolbar */}
                <div className={styles.header}>
                    <div />
                    <button
                        className={styles.btnNew}
                        onClick={() => {
                            setEditingTask(null);
                            setShowTaskModal(true);
                        }}
                    >
                        <Plus size={20} />
                        Novo Lembrete
                    </button>
                </div>

                {/* Filter Bar */}
                <div className={styles.filtersContainer}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            className={styles.searchInput}
                            placeholder="🔍 Buscar lembrete..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.filterGroups}>
                        <div className={styles.filterGroup}>
                            <button
                                className={`${styles.filterBtn} ${statusFilter === 'scheduled' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('scheduled')}
                            >
                                Pendentes
                            </button>
                            <button
                                className={`${styles.filterBtn} ${statusFilter === 'completed' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('completed')}
                            >
                                Concluídos
                            </button>
                        </div>

                        <div className={styles.filterGroup}>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'all' ? styles.active : ''}`}
                                onClick={() => setDateFilter('all')}
                            >
                                Todos
                            </button>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'overdue' ? styles.active : ''}`}
                                onClick={() => { setDateFilter('overdue'); setStatusFilter('scheduled'); }}
                                style={{ color: dateFilter === 'overdue' ? '#DC2626' : undefined }}
                            >
                                Atrasados
                            </button>
                            <button
                                className={`${styles.filterBtn} ${dateFilter === 'today' ? styles.active : ''}`}
                                onClick={() => setDateFilter('today')}
                            >
                                Hoje
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
                                const statusClass = task.status === 'completed' ? 'status-done' : late ? 'status-late' : 'status-pending';

                                return (
                                    <motion.div
                                        key={task.id}
                                        className={`${styles.taskCard} ${styles[statusClass]}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <div className={styles.cardLeftBorder}></div>

                                        <div className={styles.cardHeader}>
                                            <h3 className={styles.taskTitle}>{task.title || 'Sem título'}</h3>
                                            <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
                                                {task.status === 'completed' ? 'Concluído' : late ? 'Atrasado' : 'Pendente'}
                                            </span>
                                        </div>

                                        <div className={styles.cardBody}>
                                            {task.description && (
                                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                                                    {task.description}
                                                </p>
                                            )}
                                            {task.lead && (
                                                <div className={styles.infoRow}>
                                                    <User size={14} className={styles.icon} />
                                                    <span className={styles.leadName}>{task.lead.name}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoRow}>
                                                <Calendar size={14} className={styles.icon} />
                                                <span>{formatDate(task.date_time)}</span>
                                                {task.date_time && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({new Date(task.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>}
                                            </div>
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <button
                                                className={`${styles.actionBtn} ${task.status === 'completed' ? styles.btnComplete : ''}`}
                                                title={task.status === 'completed' ? "Reabrir" : "Concluir"}
                                                onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                                            >
                                                {task.status === 'completed' ? <CheckCircle size={18} /> : <Check size={18} />}
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                title="Editar"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTask({
                                                        ...task,
                                                        due_date: task.date_time, // Map date_time -> due_date for modal
                                                        status: task.status === 'completed' ? 'done' : 'pending'
                                                    });
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
                                <p>Nenhum lembrete encontrado.</p>
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

                {/* Task Modal - reusing with forced type logic */}
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
                    onSubmit={handleCreateTask}
                    task={editingTask}
                    leads={leads}
                    loading={modalLoading}
                />
            </div>
        </>
    );
}
