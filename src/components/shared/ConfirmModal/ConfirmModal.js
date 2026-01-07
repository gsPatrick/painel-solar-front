'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import styles from '../Modal/Modal.module.css';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar exclusão',
    message = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
    confirmText = 'Excluir',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false,
}) {
    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={`${styles.modal} ${styles.sm}`}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.25, type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.titleWrapper}>
                                <div className={`${styles.iconWrapper} ${styles[variant]}`}>
                                    {variant === 'danger' ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
                                </div>
                                <div>
                                    <h2 className={styles.title}>{title}</h2>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={styles.body}>
                            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                {message}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <button
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                onClick={onClose}
                                disabled={loading}
                            >
                                {cancelText}
                            </button>
                            <button
                                className={`${styles.btn} ${variant === 'danger' ? styles.btnDanger : styles.btnPrimary}`}
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? <span className={styles.spinner} /> : confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
