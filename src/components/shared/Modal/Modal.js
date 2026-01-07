'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import styles from './Modal.module.css';

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    iconVariant = 'primary',
    size = 'md',
    children,
    footer,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
}) {
    // Handle ESC key
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape' && closeOnEsc) {
                onClose();
            }
        },
        [closeOnEsc, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
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
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        className={clsx(styles.modal, styles[size])}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.titleWrapper}>
                                {Icon && (
                                    <div className={clsx(styles.iconWrapper, styles[iconVariant])}>
                                        <Icon size={22} />
                                    </div>
                                )}
                                <div>
                                    <h2 className={styles.title}>{title}</h2>
                                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                                </div>
                            </div>
                            {showCloseButton && (
                                <button className={styles.closeBtn} onClick={onClose}>
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className={styles.body}>{children}</div>

                        {/* Footer */}
                        {footer && <div className={styles.footer}>{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Export form utilities
export { styles as modalStyles };
