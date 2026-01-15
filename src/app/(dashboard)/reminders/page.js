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
    BellOff,
    Bell
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import TaskModal from '@/components/tasks/TaskModal/TaskModal';
import { appointmentService, leadService } from '@/services/api';
import styles from './page.module.css'; // Use new specific styles

export default function RemindersPage() {
    // Data States
    const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('scheduled'); // Default to pending
    const [dateFilter, setDateFilter] = useState('all'); // Show all future/past pending by default
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10; // More items for table view

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
            console.log("Fetching reminders...");
            // Fetch ALL reminders (both scheduled and completed) to handle filtering client-side
            const [fetchedAppointments, fetchedLeads] = await Promise.all([
                appointmentService.getAll({ type: 'LEMBRETE' }),
                leadService.getAll()
            ]);
            console.log("Reminders fetched:", fetchedAppointments);
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
            // Handle Notification logic
            // If data.notify === 'none', we manually set reminded flags to true so cron skips them
            const suppress = data.notify === 'none';

            const payload = {
                title: data.title,
                description: data.description,
                lead_id: data.lead_id || null,
                date_time: data.due_date,
                type: 'LEMBRETE',
                status: 'scheduled',
                reminded_1day: suppress,  // Set to true if suppressed
                reminded_2hours: suppress // Set to true if suppressed
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
                const due = new Date(task.date_time);
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

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isLate = (task) => {
        if (task.status === 'completed') return false;
        const due = new Date(task.date_time);
        const now = new Date();
        return due < now;
    };

    return (
        <>
            <Header title="Meus Lembretes" />
            <div className={styles.container}>
                {/* Actions Toolbar */}
                <div className={styles.header}>
                    <div className={styles.headerActions}>
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${statusFilter === 'scheduled' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('scheduled')}
                            >
                                Pendentes
                            </button>
                            <button
                                className={`${styles.filterTab} ${statusFilter === 'completed' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('completed')}
                            >
                                Concluídos
                            </button>
                        </div>
                    </div>

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

                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${dateFilter === 'all' ? styles.active : ''}`}
                            onClick={() => setDateFilter('all')}
                        >
                            Todos
                        </button>
                        <button
                            className={`${styles.filterTab} ${dateFilter === 'overdue' ? styles.active : ''}`}
                            onClick={() => { setDateFilter('overdue'); setStatusFilter('scheduled'); }}
                            style={{ color: dateFilter === 'overdue' ? '#DC2626' : undefined }}
                        >
                            Atrasados
                        </button>
                        <button
                            className={`${styles.filterTab} ${dateFilter === 'today' ? styles.active : ''}`}
                            onClick={() => setDateFilter('today')}
                        >
                            Hoje
                        </button>
                    </div>
                </div>

                {/* Table View */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tr}>
                                <th className={styles.th}>Título / Descrição</th>
                                <th className={styles.th}>Data & Hora</th>
                                <th className={styles.th}>Lead</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='wait'>
                                {paginatedTasks.length > 0 ? (
                                    paginatedTasks.map(task => {
                                        const late = isLate(task);
                                        const statusBadgeClass = task.status === 'completed' ? styles.badgeCompleted : late ? styles.badgeLate : styles.badgePending;
                                        const statusLabel = task.status === 'completed' ? 'Concluído' : late ? 'Atrasado' : 'Pendente';

                                        return (
                                            <motion.tr
                                                key={task.id}
                                                className={styles.tr}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                layout
                                            >
                                                <td className={styles.td}>
                                                    <div style={{ fontWeight: 500, color: '#0F172A' }}>
                                                        {task.title || 'Sem título'}
                                                    </div>
                                                    {task.description && (
                                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: 2, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {task.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className={styles.td}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Calendar size={14} color="#64748B" />
                                                        {formatDateTime(task.date_time)}
                                                    </div>
                                                </td>
                                                <td className={styles.td}>
                                                    {task.lead ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <User size={14} color="#64748B" />
                                                            {task.lead.name}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#94A3B8' }}>-</span>
                                                    )}
                                                </td>
                                                <td className={styles.td}>
                                                    <span className={`${styles.badge} ${statusBadgeClass}`}>
                                                        {statusLabel}
                                                    </span>
                                                    {(task.reminded_1day && task.reminded_2hours) && (
                                                        <BellOff size={12} color="#94A3B8" style={{ marginLeft: 6 }} title="Notificações desativadas" />
                                                    )}
                                                </td>
                                                <td className={styles.td} style={{ textAlign: 'right' }}>
                                                    <button
                                                        className={`${styles.actionBtn} ${task.status === 'completed' ? '' : styles.btnComplete}`}
                                                        title={task.status === 'completed' ? "Reabrir" : "Concluir"}
                                                        onClick={() => handleCompleteTask(task)}
                                                    >
                                                        {task.status === 'completed' ? <CheckCircle size={18} /> : <Check size={18} />}
                                                    </button>
                                                    <button
                                                        className={styles.actionBtn}
                                                        title="Editar"
                                                        onClick={() => {
                                                            setEditingTask({
                                                                ...task,
                                                                // Convert ISO back to simpler string if needed, or let Modal handle ISO
                                                                // Modal handles ISO if valid.
                                                                notify: (task.reminded_1day && task.reminded_2hours) ? 'none' : 'normal'
                                                            });
                                                            setShowTaskModal(true);
                                                        }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                                                        title="Excluir"
                                                        onClick={() => handleDeleteTask(task.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className={styles.emptyState}>
                                            {loading ? 'Carregando...' : 'Nenhum lembrete encontrado.'}
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
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

                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
                    onSubmit={handleCreateTask}
                    task={editingTask}
                    leads={leads}
                    loading={modalLoading}
                    forcedType="LEMBRETE" // Force specific type logic
                />
            </div>
        </>
    );
}
