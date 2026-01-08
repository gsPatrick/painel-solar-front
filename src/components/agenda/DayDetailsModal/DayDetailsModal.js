import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Wrench, CheckSquare, User } from 'lucide-react';
import styles from './DayDetailsModal.module.css';

export default function DayDetailsModal({ isOpen, onClose, date, events = [], onItemClick }) {
    if (!isOpen) return null;

    const formattedDate = date ? new Date(date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }) : '';

    const sortedEvents = [...events].sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

    const getTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AnimatePresence>
            <div className={styles.overlay} onClick={onClose}>
                <motion.div
                    className={styles.modal}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <div className={styles.titleWrapper}>
                            <Calendar size={20} className={styles.icon} />
                            <h3>{formattedDate}</h3>
                            <span className={styles.badge}>{events.length} eventos</span>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.content}>
                        {sortedEvents.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <Calendar size={32} />
                                </div>
                                <p>Nenhum evento para este dia.</p>
                            </div>
                        ) : (
                            <div className={styles.list}>
                                {sortedEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className={`${styles.item} ${styles[event.type === 'VISITA_TECNICA' ? 'visita' : event.type === 'TASK' ? 'task' : 'instalacao']}`}
                                        onClick={() => onItemClick(event)}
                                    >
                                        <div className={styles.timeWrapper}>
                                            <Clock size={14} />
                                            <span>{getTime(event.date_time)}</span>
                                        </div>

                                        <div className={styles.info}>
                                            <div className={styles.typeTag}>
                                                {event.type === 'VISITA_TECNICA' && <><MapPin size={10} /> Visita Técnica</>}
                                                {event.type === 'INSTALACAO' && <><Wrench size={10} /> Instalação</>}
                                                {event.type === 'TASK' && <><CheckSquare size={10} /> Tarefa</>}
                                            </div>
                                            <h4 className={styles.itemTitle}>
                                                {event.type === 'TASK' ? event.title : (event.lead?.name || 'Lead sem nome')}
                                            </h4>
                                            {event.lead && (
                                                <div className={styles.leadInfo}>
                                                    <User size={12} />
                                                    {event.lead.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
