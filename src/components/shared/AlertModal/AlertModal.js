'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Bell, Clock, XCircle, Bot, CheckCircle, Info } from 'lucide-react';
import styles from './AlertModal.module.css';

const icons = {
    sla: AlertTriangle,
    newLead: Bell,
    followup: Clock,
    conflict: XCircle,
    ai: Bot,
    success: CheckCircle,
    info: Info,
};

const colors = {
    sla: '#EF4444',
    newLead: '#10B981',
    followup: '#F59E0B',
    conflict: '#EF4444',
    ai: '#3B82F6',
    success: '#10B981',
    info: '#6366F1',
};

export default function AlertModal({
    isOpen,
    onClose,
    type = 'info', // sla, newLead, followup, conflict, ai, success, info
    title,
    message,
    primaryAction,
    primaryLabel = 'OK',
    secondaryAction,
    secondaryLabel = 'Fechar',
    persistent = false, // If true, cannot be dismissed by clicking outside
}) {
    const modalRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (isOpen && type === 'newLead') {
            // Play notification sound for new leads
            try {
                audioRef.current = new Audio('/notification.mp3');
                audioRef.current.play().catch(() => { });
            } catch (e) {
                // Ignore audio errors
            }
        }
    }, [isOpen, type]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !persistent) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, persistent, onClose]);

    const IconComponent = icons[type] || Info;
    const accentColor = colors[type] || colors.info;

    const handleBackdropClick = (e) => {
        if (!persistent && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.backdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        ref={modalRef}
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            ...(type === 'conflict' ? {
                                x: [0, -10, 10, -10, 10, 0],
                                transition: { x: { duration: 0.5 } }
                            } : {})
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Icon Header */}
                        <div
                            className={styles.iconHeader}
                            style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}
                        >
                            <div
                                className={styles.iconCircle}
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
                            >
                                <IconComponent size={32} color="white" />
                            </div>

                            {!persistent && (
                                <button className={styles.closeBtn} onClick={onClose}>
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className={styles.content}>
                            <h2 className={styles.title}>{title}</h2>
                            <p className={styles.message}>{message}</p>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            {secondaryAction && (
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={secondaryAction}
                                >
                                    {secondaryLabel}
                                </button>
                            )}
                            <button
                                className={styles.primaryBtn}
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
                                onClick={primaryAction || onClose}
                            >
                                {primaryLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
