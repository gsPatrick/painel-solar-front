'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    RefreshCw,
    Check,
    User,
    Calendar,
    Edit2,
    Trash2,
    CheckSquare,
    Clock,
    AlertCircle,
    UserPlus
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import TaskModal from '@/components/tasks/TaskModal/TaskModal';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import ConfirmModal from '@/components/shared/ConfirmModal/ConfirmModal';
import { taskService, leadService, pipelineService } from '@/services/api';
import styles from './page.module.css';

// Demo data
const DEMO_TASKS = [
    { id: '1', title: 'Follow-up com Roberto Ferreira', type: 'FOLLOW_UP', status: 'pending', due_date: new Date(), lead: { name: 'Roberto Ferreira' } },
    { id: '2', title: 'Enviar proposta para Fernanda Lima', type: 'PROPOSAL', status: 'pending', due_date: new Date(Date.now() + 86400000), lead: { name: 'Fernanda Lima' } },
    { id: '3', title: 'Confirmar visita técnica Pedro', type: 'OTHER', status: 'pending', due_date: new Date(Date.now() - 86400000), lead: { name: 'Pedro Henrique' } },
    { id: '4', title: 'Negociar valor com Luciana', type: 'FOLLOW_UP', status: 'done', due_date: new Date(Date.now() - 172800000), lead: { name: 'Luciana Costa' } },
];

const DEMO_LEADS = [
    { id: '1', name: 'Roberto Ferreira' },
    { id: '2', name: 'Fernanda Lima' },
    { id: '3', name: 'Pedro Henrique' },
    { id: '4', name: 'Luciana Costa' },
];

const DEMO_PIPELINES = [
    { id: '1', title: 'Novo Lead', color: '#4318FF' },
    { id: '2', title: 'Qualificado', color: '#6AD2FF' },
];

export default function TasksPage() {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState([]);
    const [pipelines, setPipelines] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deleteTask, setDeleteTask] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [pendingTaskData, setPendingTaskData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksData, leadsData, pipelinesData] = await Promise.all([
                taskService.getAll(),
                leadService.getAll(),
                pipelineService.getAll(),
            ]);
            setTasks(tasksData);
            setLeads(leadsData);
            setPipelines(pipelinesData);
        } catch (error) {
            console.log('Using demo data');
            setTasks(DEMO_TASKS);
            setLeads(DEMO_LEADS);
            setPipelines(DEMO_PIPELINES);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenTaskModal = () => {
        if (leads.length === 0) {
            // No leads - show option to create one
            setShowLeadModal(true);
        } else {
            setShowTaskModal(true);
        }
    };

    const handleCreateLead = async (data) => {
        setModalLoading(true);
        try {
            const newLead = await leadService.create(data);
            setLeads(prev => [...prev, newLead]);
            setShowLeadModal(false);
            // Now open task modal
            setShowTaskModal(true);
        } catch (error) {
            // Demo mode
            const newLead = { id: Date.now().toString(), ...data };
            setLeads(prev => [...prev, newLead]);
            setShowLeadModal(false);
            setShowTaskModal(true);
        } finally {
            setModalLoading(false);
        }
    };

    const handleCreateTask = async (data) => {
        setModalLoading(true);
        try {
            const newTask = await taskService.create(data);
            setTasks((prev) => [newTask, ...prev]);
            setShowTaskModal(false);
        } catch (error) {
            // Demo mode
            const newTask = {
                id: Date.now().toString(),
                ...data,
                status: 'pending',
                lead: leads.find(l => l.id === data.lead_id)
            };
            setTasks((prev) => [newTask, ...prev]);
            setShowTaskModal(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdateTask = async (data) => {
        setModalLoading(true);
        try {
            const updated = await taskService.update(editingTask.id, data);
            setTasks((prev) => prev.map(t => t.id === editingTask.id ? updated : t));
            setEditingTask(null);
        } catch (error) {
            // Demo mode
            setTasks((prev) => prev.map(t => t.id === editingTask.id ? { ...t, ...data } : t));
            setEditingTask(null);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        setModalLoading(true);
        try {
            await taskService.delete(deleteTask.id);
            setTasks((prev) => prev.filter(t => t.id !== deleteTask.id));
            setDeleteTask(null);
        } catch (error) {
            setTasks((prev) => prev.filter(t => t.id !== deleteTask.id));
            setDeleteTask(null);
        } finally {
            setModalLoading(false);
        }
    };

    const handleToggleDone = async (task) => {
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        try {
            if (newStatus === 'done') {
                await taskService.markAsDone(task.id);
            } else {
                await taskService.update(task.id, { status: 'pending' });
            }
            setTasks((prev) => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            setTasks((prev) => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        }
    };

    const getTaskDueClass = (task) => {
        if (task.status === 'done') return styles.done;
        const now = new Date();
        const due = new Date(task.due_date);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return styles.overdue;
        if (diffDays === 0) return styles.today;
        return styles.upcoming;
    };

    const getTypeClass = (type) => {
        const classes = {
            FOLLOW_UP: styles.followUp,
            PROPOSAL: styles.proposal,
            OTHER: styles.other,
        };
        return classes[type] || styles.other;
    };

    const getTypeLabel = (type) => {
        const labels = { FOLLOW_UP: 'Follow-up', PROPOSAL: 'Proposta', OTHER: 'Outro' };
        return labels[type] || type;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'pending') return t.status === 'pending';
        if (filter === 'done') return t.status === 'done';
        if (filter === 'overdue') {
            return t.status === 'pending' && new Date(t.due_date) < new Date();
        }
        return true;
    });

    return (
        <>
            <Header title="Tarefas" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${filter === 'all' ? styles.active : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                Todas
                            </button>
                            <button
                                className={`${styles.tab} ${filter === 'pending' ? styles.active : ''}`}
                                onClick={() => setFilter('pending')}
                            >
                                Pendentes
                            </button>
                            <button
                                className={`${styles.tab} ${filter === 'overdue' ? styles.active : ''}`}
                                onClick={() => setFilter('overdue')}
                            >
                                Atrasadas
                            </button>
                            <button
                                className={`${styles.tab} ${filter === 'done' ? styles.active : ''}`}
                                onClick={() => setFilter('done')}
                            >
                                Concluídas
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={loadData}>
                            <RefreshCw size={16} />
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={handleOpenTaskModal}
                        >
                            <Plus size={16} />
                            Nova Tarefa
                        </button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard} />
                        ))
                    ) : filteredTasks.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <CheckSquare size={40} />
                            </div>
                            <h3 className={styles.emptyTitle}>Nenhuma tarefa encontrada</h3>
                            <p className={styles.emptyText}>
                                {filter === 'all'
                                    ? 'Crie sua primeira tarefa para começar a acompanhar seus leads.'
                                    : 'Não há tarefas nesta categoria.'}
                            </p>
                            {filter === 'all' && (
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={handleOpenTaskModal}
                                >
                                    <Plus size={16} />
                                    Criar Tarefa
                                </button>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredTasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    className={`${styles.taskCard} ${getTaskDueClass(task)}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <button
                                        className={`${styles.checkbox} ${task.status === 'done' ? styles.checked : ''}`}
                                        onClick={() => handleToggleDone(task)}
                                    >
                                        {task.status === 'done' && <Check size={14} />}
                                    </button>

                                    <div className={styles.taskContent}>
                                        <div className={styles.taskTitle}>{task.title}</div>
                                        <div className={styles.taskMeta}>
                                            <span className={styles.taskLead}>
                                                <User size={12} />
                                                {task.lead?.name || 'Lead'}
                                            </span>
                                            <span className={styles.taskDue}>
                                                <Calendar size={12} />
                                                {formatDate(task.due_date)}
                                            </span>
                                            <span className={`${styles.taskType} ${getTypeClass(task.type)}`}>
                                                {getTypeLabel(task.type)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.taskActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => setEditingTask(task)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.danger}`}
                                            onClick={() => setDeleteTask(task)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            <TaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSubmit={handleCreateTask}
                leads={leads}
                loading={modalLoading}
            />

            {/* Edit Task Modal */}
            <TaskModal
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                onSubmit={handleUpdateTask}
                task={editingTask}
                leads={leads}
                loading={modalLoading}
            />

            {/* Create Lead Modal (when no leads exist) */}
            <LeadModal
                isOpen={showLeadModal}
                onClose={() => setShowLeadModal(false)}
                onSubmit={handleCreateLead}
                pipelines={pipelines}
                loading={modalLoading}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={!!deleteTask}
                onClose={() => setDeleteTask(null)}
                onConfirm={handleDeleteTask}
                title="Excluir Tarefa"
                message={`Tem certeza que deseja excluir a tarefa "${deleteTask?.title}"? Esta ação não pode ser desfeita.`}
                loading={modalLoading}
            />
        </>
    );
}
