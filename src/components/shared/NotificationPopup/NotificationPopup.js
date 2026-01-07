'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageSquare, CheckSquare } from 'lucide-react';
import styles from './NotificationPopup.module.css';
import { useEffect } from 'react';

export default function NotificationPopup({ notification, onClose }) {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto close after 5s
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'message': return <MessageSquare size={20} />;
            case 'task': return <CheckSquare size={20} />;
            default: return <Bell size={20} />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.popupOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className={styles.popupCard}
                    initial={{ scale: 0.5, y: 100, opacity: 0 }}
                    animate={{
                        scale: [0.5, 1.1, 1],
                        y: 0,
                        opacity: 1
                    }}
                    exit={{ scale: 0.5, y: 50, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                    }}
                >
                    <div className={styles.iconContainer}>
                        {getIcon()}
                    </div>
                    <div className={styles.content}>
                        <h4 className={styles.title}>{notification.title}</h4>
                        <p className={styles.message}>{notification.message}</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={16} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
