'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { AlertTriangle, MessageSquare, Play, X } from 'lucide-react';
import styles from './AiPauseModal.module.css';
import { leadService } from '@/services/api';

export default function AiPauseModal() {
    const [notification, setNotification] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

        socket.on('ai_paused_notification', (data) => {
            console.log('AI Paused Notification:', data);
            setNotification(data);
        });

        // Cleanup
        return () => socket.disconnect();
    }, []);

    if (!notification) return null;

    const handleGoToLead = () => {
        router.push(`/messages?leadId=${notification.leadId}`);
        setNotification(null);
    };

    const handleKeepDisabled = () => {
        setNotification(null);
    };

    const handleActivateAi = async () => {
        try {
            await leadService.updateAiStatus(notification.leadId, 'active');
            setNotification(null);
            router.push(`/messages?leadId=${notification.leadId}`);
        } catch (error) {
            console.error('Failed to activate AI:', error);
            alert('Erro ao ativar IA. Tente novamente.');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.icon}>
                        <AlertTriangle />
                    </div>
                    <h3 className={styles.title}>Intervenção Humana Detectada</h3>
                </div>

                <div className={styles.content}>
                    <p>
                        A IA foi desativada para o lead <span className={styles.leadName}>{notification.leadName}</span> porque você enviou uma mensagem manual.
                    </p>
                    <p>
                        O que deseja fazer?
                    </p>
                </div>

                <div className={styles.actions}>
                    <button className={`${styles.button} ${styles.primary}`} onClick={handleGoToLead}>
                        <MessageSquare />
                        Ir para o Lead
                    </button>

                    <div className={styles.row}>
                        <button className={`${styles.button} ${styles.secondary}`} onClick={handleKeepDisabled}>
                            <X />
                            Continuar desativada
                        </button>

                        <button className={`${styles.button} ${styles.outline}`} onClick={handleActivateAi}>
                            <Play />
                            Ativar IA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
