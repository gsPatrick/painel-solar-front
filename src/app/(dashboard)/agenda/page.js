'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    MapPin,
    Wrench,
    Clock,
    CheckSquare,
    Bell
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import AppointmentModal from '@/components/appointments/AppointmentModal/AppointmentModal';
import TaskModal from '@/components/tasks/TaskModal/TaskModal';
import DayDetailsModal from '@/components/agenda/DayDetailsModal/DayDetailsModal';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal/AppointmentDetailsModal';
import { appointmentService, leadService } from '@/services/api';
import styles from './page.module.css';

// ... (code)

export default function AgendaPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');
    const [filter, setFilter] = useState('ALL'); // ALL, VISITA_TECNICA, INSTALACAO, LEMBRETE

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);

    // Details Modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Day Details & Editing
    const [selectedDay, setSelectedDay] = useState(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editingAppointment, setEditingAppointment] = useState(null);

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedAppointments, fetchedLeads] = await Promise.all([
                appointmentService.getAll(),
                leadService.getAll(),
            ]);

            setAppointments(fetchedAppointments || []);
            setLeads(fetchedLeads || []);
        } catch (error) {
            console.error("Error loading agenda data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAppointment = async (data) => {
        setModalLoading(true);
        try {
            if (editingAppointment) {
                const updated = await appointmentService.update(editingAppointment.id, data);
                setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
                setEditingAppointment(null);
            } else {
                const newApt = await appointmentService.create(data);
                setAppointments(prev => [...prev, newApt]);
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving appointment:", error);
            alert("Erro ao salvar agendamento.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleCreateLead = async (data) => {
        // Implement lead creation logic
        try {
            const newLead = await leadService.create(data);
            setLeads(prev => [newLead, ...prev]); // Add to list so it appears in selector
            setShowLeadModal(false);
            // Optionally auto-select in appointment modal if we had access to its state from here,
            // but AppointmentModal is controlled by 'showModal' and its internal state for form.
            // Ideally we'd pass the new lead ID down to AppointmentModal to pre-select it.
            // For now, it will just appear in the list.
        } catch (error) {
            console.error("Error creating lead:", error);
            // Demo fallback
            setLeads(prev => [{ id: Date.now().toString(), ...data }, ...prev]);
            setShowLeadModal(false);
        }
    };

    const handleDayClick = (date) => {
        setSelectedDay(date);
        setShowDayModal(true);
    };

    const handleEventClick = (event) => {
        if (event.type === 'TASK') return; // Ignore tasks if any

        setSelectedAppointment(event);
        setShowDetailsModal(true);
        // Optional: Keep day modal open or close it. Closing feels more drill-down.
        // setShowDayModal(false); 
        // Actually, user might want to go back to day view easily. 
        // But Details Modal usually overlays everything.
    };

    const handleDeleteAppointment = async (apt) => {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

        try {
            // Assuming appointmentService has delete method
            await appointmentService.delete(apt.id);
            setAppointments(prev => prev.filter(a => a.id !== apt.id));
            setShowDetailsModal(false);
            setSelectedAppointment(null);

            // Also close day modal if open, to force refresh if needed or just keep UI clean
            setShowDayModal(false);
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Erro ao excluir agendamento.");
        }
    };

    const handleEditFromDetails = (apt) => {
        setShowDetailsModal(false);
        setEditingAppointment(apt);
        setShowModal(true);
        setShowDayModal(false);
    };

    const monthDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];

        // Add days from previous month
        const startDayOfWeek = firstDay.getDay();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({ date, isOtherMonth: true });
        }

        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({ date, isOtherMonth: false });
        }

        // Add days from next month
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isOtherMonth: true });
        }

        return days;
    }, [currentDate]);

    // Optimize: Pre-calculate appointments by day key (YYYY-MM-DD) with filter
    const appointmentsByDate = useMemo(() => {
        const map = new Map();
        const filteredAppointments = filter === 'ALL'
            ? appointments
            : appointments.filter(apt => apt.type === filter);

        filteredAppointments.forEach(apt => {
            const dateStr = new Date(apt.date_time).toISOString().split('T')[0];
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr).push(apt);
        });
        return map;
    }, [appointments, filter]);

    const getAppointmentsForDay = (date) => {
        // Handle timezone issues by using local date string components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return appointmentsByDate.get(dateStr) || [];
    };

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const formatTime = (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const formatMonthYear = (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <>
            <Header title="Agenda" />

            <div className={styles.container}>
                {/* ... (calendar UI) ... */}
                <div className={styles.header}>
                    {/* ... (nav and view toggle) ... */}
                    <div className={styles.dateNav}>
                        <button className={styles.navBtn} onClick={goToPrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <span className={styles.currentDate}>
                            {formatMonthYear(currentDate)}
                        </span>
                        <button className={styles.navBtn} onClick={goToNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${view === 'month' ? styles.active : ''}`}
                            onClick={() => setView('month')}
                        >
                            Mês
                        </button>
                        <button
                            className={`${styles.viewBtn} ${view === 'week' ? styles.active : ''}`}
                            onClick={() => setView('week')}
                        >
                            Semana
                        </button>
                        <button
                            className={`${styles.viewBtn} ${view === 'day' ? styles.active : ''}`}
                            onClick={() => setView('day')}
                        >
                            Dia
                        </button>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.btn} onClick={goToToday}>
                            Hoje
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={16} />
                            Novo Agendamento
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.filterTab} ${filter === 'ALL' ? styles.active : ''}`}
                        onClick={() => setFilter('ALL')}
                    >
                        📋 Todos
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'VISITA_TECNICA' ? styles.active : ''}`}
                        onClick={() => setFilter('VISITA_TECNICA')}
                    >
                        📍 Visita Técnica
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'INSTALACAO' ? styles.active : ''}`}
                        onClick={() => setFilter('INSTALACAO')}
                    >
                        🔧 Instalação
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'LEMBRETE' ? styles.active : ''}`}
                        onClick={() => setFilter('LEMBRETE')}
                    >
                        🔔 Lembretes
                    </button>
                </div>

                <motion.div
                    className={styles.calendarGrid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {weekDays.map((day) => (
                        <div key={day} className={styles.dayHeader}>
                            {day}
                        </div>
                    ))}

                    {loading ? (
                        [...Array(35)].map((_, i) => (
                            <div key={i} className={styles.skeletonCell} />
                        ))
                    ) : (
                        monthDays.map(({ date, isOtherMonth }, index) => {
                            const dayAppointments = getAppointmentsForDay(date);
                            const displayAppointments = dayAppointments.slice(0, 3);
                            const moreCount = dayAppointments.length - 3;

                            return (
                                <motion.div
                                    key={index}
                                    className={`
                    ${styles.dayCell} 
                    ${isOtherMonth ? styles.otherMonth : ''} 
                    ${isToday(date) ? styles.today : ''}
                  `}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.01 }}
                                    onClick={() => handleDayClick(date)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className={styles.dayNumber}>{date.getDate()}</span>
                                    <div className={styles.events}>
                                        {displayAppointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className={`
                          ${styles.event} 
                          ${apt.type === 'VISITA_TECNICA' ? styles.visitaTecnica :
                                                        apt.type === 'INSTALACAO' ? styles.instalacao :
                                                            apt.type === 'LEMBRETE' ? styles.lembrete :
                                                                apt.type === 'TASK' ? styles.task : styles.instalacao}
                          ${apt.status === 'cancelled' ? styles.cancelled : ''}
                        `}
                                            >
                                                {apt.type === 'VISITA_TECNICA' ? (
                                                    <MapPin size={10} />
                                                ) : apt.type === 'INSTALACAO' ? (
                                                    <Wrench size={10} />
                                                ) : apt.type === 'LEMBRETE' ? (
                                                    <Bell size={10} />
                                                ) : apt.type === 'TASK' ? (
                                                    <CheckSquare size={10} />
                                                ) : (
                                                    <Wrench size={10} />
                                                )}
                                                <span>{formatTime(apt.date_time)}</span>
                                                <span>{apt.lead?.name?.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                        {moreCount > 0 && (
                                            <span className={styles.moreEvents}>
                                                +{moreCount} mais
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>

                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.visitaTecnica}`} />
                        <MapPin size={14} />
                        Visita Técnica
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.instalacao}`} />
                        <Wrench size={14} />
                        Instalação
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.task}`} />
                        <CheckSquare size={14} />
                        Tarefas
                    </div>
                </div>
            </div>

            {/* Appointment Modal */}
            <AppointmentModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingAppointment(null);
                }}
                onSubmit={handleCreateAppointment}
                leads={leads}
                loading={modalLoading}
                onCreateLead={() => setShowLeadModal(true)}
                appointment={editingAppointment} // Pass for editing
                isEditing={!!editingAppointment}
            />

            {/* Task Modal for Editing */}
            <TaskModal
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                onSubmit={async (data) => {
                    // Quick update logic here or refresh
                    await loadData();
                    setEditingTask(null);
                }}
                task={editingTask}
                leads={leads}
                loading={modalLoading}
            />

            {/* Day Details Modal */}
            <DayDetailsModal
                isOpen={showDayModal}
                onClose={() => setShowDayModal(false)}
                date={selectedDay}
                events={selectedDay ? getAppointmentsForDay(selectedDay) : []}
                onItemClick={handleEventClick}
            />

            {/* Appointment Details Modal */}
            <AppointmentDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                appointment={selectedAppointment}
                onEdit={handleEditFromDetails}
                onDelete={handleDeleteAppointment}
            />

            {/* Lead Modal for Creating New Lead */}
            <LeadModal
                isOpen={showLeadModal}
                onClose={() => setShowLeadModal(false)}
                onSubmit={handleCreateLead}
            // Assuming simple creation without pipeline selection or using default
            />
        </>
    );
}
