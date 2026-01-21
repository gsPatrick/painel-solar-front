import { MapPin, Wrench, Calendar, Clock, Edit2, Trash2, Bell, User, StickyNote } from 'lucide-react';
import Modal from '../../shared/Modal/Modal';
import styles from './AppointmentDetailsModal.module.css';
import { authService } from '@/services/api';

const TYPES = {
    'VISITA_TECNICA': { label: 'Visita Técnica', icon: MapPin, color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    'INSTALACAO': { label: 'Instalação', icon: Wrench, color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    'LEMBRETE': { label: 'Lembrete', icon: Bell, color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
    'TASK': { label: 'Tarefa', icon: Calendar, color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' }
};

export default function AppointmentDetailsModal({
    isOpen,
    onClose,
    appointment,
    onEdit,
    onDelete,
    loading = false
}) {
    if (!appointment) return null;

    const user = authService.getStoredUser();
    const isViewer = user?.role === 'viewer';

    const typeConfig = TYPES[appointment.type] || TYPES['VISITA_TECNICA'];
    const Icon = typeConfig.icon;

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes do Agendamento"
            subtitle="Visualize as informações completas"
            icon={Icon}
            iconVariant="primary"
            size="md"
        >
            <div className={styles.container}>
                {/* Header Badge */}
                <div className={styles.typeBadge} style={{ color: typeConfig.color, background: typeConfig.bgColor }}>
                    <Icon size={16} />
                    <span>{typeConfig.label}</span>
                </div>

                {/* Main Info */}
                <div className={styles.section}>
                    <div className={styles.row}>
                        <Calendar size={18} className={styles.icon} />
                        <div>
                            <span className={styles.label}>Data</span>
                            <p className={styles.value}>{formatDate(appointment.date_time)}</p>
                        </div>
                    </div>
                    <div className={styles.row}>
                        <Clock size={18} className={styles.icon} />
                        <div>
                            <span className={styles.label}>Horário</span>
                            <p className={styles.value}>{formatTime(appointment.date_time)}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Lead Info */}
                <div className={styles.section}>
                    <div className={styles.labelRow}>
                        <User size={16} className={styles.sectionIcon} />
                        <span className={styles.sectionTitle}>Cliente</span>
                    </div>
                    <div className={styles.leadCard}>
                        <div className={styles.leadAvatar}>
                            {appointment.lead?.name?.charAt(0) || '?'}
                        </div>
                        <div className={styles.leadInfo}>
                            <p className={styles.leadName}>{appointment.lead?.name || 'Cliente sem nome'}</p>
                            <p className={styles.leadPhone}>{appointment.lead?.phone || 'Sem telefone'}</p>
                        </div>
                    </div>
                </div>

                {/* Notes if any */}
                {appointment.notes && (
                    <>
                        <div className={styles.divider} />
                        <div className={styles.section}>
                            <div className={styles.labelRow}>
                                <StickyNote size={16} className={styles.sectionIcon} />
                                <span className={styles.sectionTitle}>Observações</span>
                            </div>
                            <p className={styles.notes}>{appointment.notes}</p>
                        </div>
                    </>
                )}

                {/* Actions */}
                {!isViewer && (
                    <div className={styles.actions}>
                        <button
                            className={styles.btnDelete}
                            onClick={() => onDelete(appointment)}
                            disabled={loading}
                        >
                            <Trash2 size={16} />
                            Excluir
                        </button>
                        <button
                            className={styles.btnEdit}
                            onClick={() => onEdit(appointment)}
                            disabled={loading}
                        >
                            <Edit2 size={16} />
                            Editar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
