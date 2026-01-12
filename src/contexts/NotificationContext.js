'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AlertModal from '@/components/shared/AlertModal/AlertModal';
import { authService, leadService, taskService } from '@/services/api';

const NotificationContext = createContext({});

// SLA polling interval (60 seconds)
const SLA_POLL_INTERVAL = 60000;

export function NotificationProvider({ children }) {
    const [alert, setAlert] = useState(null);
    const [alertQueue, setAlertQueue] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [counts, setCounts] = useState({
        messages: 0,
        tasks: 0,
        alerts: 0
    });
    const [slaLeads, setSlaLeads] = useState([]);
    const [seenSlaLeads, setSeenSlaLeads] = useState(new Set());

    const socketRef = useRef();
    const slaPollingRef = useRef();

    // Add notification to history
    const addNotification = useCallback((notif) => {
        const newNotif = {
            id: Date.now().toString(),
            time: new Date().toISOString(),
            read: false,
            ...notif
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50
    }, []);

    // Process alert queue
    useEffect(() => {
        if (!alert && alertQueue.length > 0) {
            const [nextAlert, ...rest] = alertQueue;
            setAlert(nextAlert);
            setAlertQueue(rest);
        }
    }, [alert, alertQueue]);

    // Initial Badge Load
    useEffect(() => {
        const loadCounts = async () => {
            if (!authService.isAuthenticated()) return;
            try {
                const tasks = await taskService.getAll({ status: 'pending' });
                setCounts(prev => ({ ...prev, tasks: tasks.length }));
            } catch (e) {
                console.error("Error loading notification counts", e);
            }
        };
        loadCounts();
    }, []);

    // SLA Polling - DISABLED (cliente reclamou dos modais)
    const checkSlaAlerts = useCallback(async () => {
        if (!authService.isAuthenticated()) return;

        try {
            const overdueLeads = await leadService.getSlaAlerts();
            setSlaLeads(overdueLeads);
            setCounts(prev => ({ ...prev, alerts: overdueLeads.length }));

            // SLA alerts desabilitados - apenas log no console
            for (const lead of overdueLeads) {
                if (!seenSlaLeads.has(lead.id)) {
                    console.log(`[SLA] Lead ${lead.name} está parado há ${lead.days_overdue} dias`);
                    setSeenSlaLeads(prev => new Set([...prev, lead.id]));
                }
            }
        } catch (e) {
            console.error("Error checking SLA alerts", e);
        }
    }, [seenSlaLeads]);

    useEffect(() => {
        // Initial check
        const timer = setTimeout(() => {
            checkSlaAlerts();
        }, 5000); // Wait 5s after page load

        // Start polling
        slaPollingRef.current = setInterval(checkSlaAlerts, SLA_POLL_INTERVAL);

        return () => {
            clearTimeout(timer);
            if (slaPollingRef.current) {
                clearInterval(slaPollingRef.current);
            }
        };
    }, [checkSlaAlerts]);

    // Socket Listener
    useEffect(() => {
        if (!authService.isAuthenticated()) return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        socketRef.current = io(socketUrl.replace('/api', ''));

        const socket = socketRef.current;
        const user = authService.getStoredUser();

        socket.on('connect', () => {
            if (user) {
                socket.emit('join_chat', { room: `user_${user.id}` });
            }
        });

        // Listen for new leads - APENAS LOG, SEM MODAL
        socket.on('new_lead', (data) => {
            addNotification({
                type: 'lead',
                title: 'Novo Lead',
                message: `${data.name} chegou via ${data.source === 'meta_ads' ? 'Meta Ads' : data.source === 'whatsapp' ? 'WhatsApp' : 'entrada manual'}`
            });
            console.log(`[Notify] Novo lead: ${data.name}`);
            // Modal desabilitado a pedido do cliente
        });

        // Listen for follow-up reminders
        socket.on('followup_due', (data) => {
            addNotification({
                type: 'task',
                title: 'Tarefa Pendente',
                message: `"${data.title}" para ${data.lead_name}`
            });
            console.log(`[Notify] Follow-up: ${data.title} para ${data.lead_name}`);
            // Modal desabilitado a pedido do cliente
        });

        // Listen for AI responses
        socket.on('ai_response', (data) => {
            showAlert({
                type: 'ai',
                title: '☀️ Sol Respondeu',
                message: `Sol enviou uma mensagem para ${data.lead_name} com sucesso.`,
                primaryLabel: 'OK',
                primaryAction: () => closeAlert(),
            });
        });

        // Listen for generic notifications
        socket.on('notification', (data) => {
            showAlert({
                type: data.type || 'info',
                title: data.title,
                message: data.message,
                primaryLabel: 'OK',
                primaryAction: () => closeAlert(),
            });
        });

        // Listen for messages
        socket.on('receive_message', (data) => {
            if (window.location.pathname !== '/messages') {
                addNotification({
                    type: 'message',
                    title: 'Nova Mensagem',
                    message: `Mensagem de ${data.sender_name || 'um contato'}`
                });
                showAlert({
                    type: 'info',
                    title: '💬 Nova Mensagem',
                    message: `Você recebeu uma mensagem de ${data.sender_name || 'um contato'}.`,
                    primaryLabel: 'Ver Mensagem',
                    primaryAction: () => {
                        window.location.href = '/messages';
                        closeAlert();
                    },
                    secondaryLabel: 'OK',
                    secondaryAction: () => closeAlert(),
                });
                setCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const showAlert = (alertData) => {
        if (alert) {
            // Queue if another alert is showing
            setAlertQueue(prev => [...prev, alertData]);
        } else {
            setAlert(alertData);
        }
    };

    const closeAlert = () => {
        setAlert(null);
    };

    // Show conflict alert (called programmatically from other components)
    const showConflictAlert = (message) => {
        showAlert({
            type: 'conflict',
            title: '❌ Conflito de Agenda!',
            message,
            primaryLabel: 'Entendi',
            primaryAction: () => closeAlert(),
            persistent: true,
        });
    };

    // Show success alert
    const showSuccessAlert = (title, message) => {
        showAlert({
            type: 'success',
            title,
            message,
            primaryLabel: 'OK',
            primaryAction: () => closeAlert(),
        });
    };

    // Mark notification as read
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <NotificationContext.Provider value={{
            counts,
            notifications,
            slaLeads,
            showAlert,
            showConflictAlert,
            showSuccessAlert,
            closeAlert,
            markAsRead,
            markAllAsRead
        }}>
            {children}
            {alert && (
                <AlertModal
                    isOpen={true}
                    onClose={closeAlert}
                    type={alert.type}
                    title={alert.title}
                    message={alert.message}
                    primaryAction={alert.primaryAction}
                    primaryLabel={alert.primaryLabel}
                    secondaryAction={alert.secondaryAction}
                    secondaryLabel={alert.secondaryLabel}
                    persistent={alert.persistent}
                />
            )}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);
