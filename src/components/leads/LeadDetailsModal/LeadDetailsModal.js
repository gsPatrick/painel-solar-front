import { User, Phone, DollarSign, Zap, Star, LayoutGrid, Home, MapPin } from 'lucide-react';
import Modal from '../../shared/Modal/Modal';
import styles from './LeadDetailsModal.module.css';

export default function LeadDetailsModal({
    isOpen,
    onClose,
    lead,
    onEdit,
    onDelete,
    loading = false
}) {
    if (!lead) return null;

    const formatCurrency = (value) => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getSourceLabel = (source) => {
        const map = {
            'meta_ads': 'Meta Ads',
            'whatsapp': 'WhatsApp',
            'manual': 'Manual'
        };
        return map[source] || source;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes do Lead"
            subtitle="Informações completas do cliente"
            icon={User}
            iconVariant="primary"
            size="md"
        >
            <div className={styles.container}>
                {/* Header Info */}
                <div className={styles.headerInfo}>
                    <div className={styles.avatar}>
                        {lead.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.nameSection}>
                        <h3 className={styles.leadName}>
                            {lead.name}
                            {lead.is_important && <Star size={18} fill="#F97316" color="#F97316" />}
                        </h3>
                        <p className={styles.leadPhone}>{lead.phone}</p>
                    </div>
                    <div className={styles.badge} data-source={lead.source}>
                        {getSourceLabel(lead.source)}
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Main Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Valor Proposta</span>
                        <div className={styles.statValue}>
                            <DollarSign size={16} className={styles.iconGreen} />
                            {formatCurrency(lead.proposal_value)}
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Sistema</span>
                        <div className={styles.statValue}>
                            <Zap size={16} className={styles.iconYellow} />
                            {lead.system_size_kwp ? `${lead.system_size_kwp} kWp` : '-'}
                        </div>
                    </div>
                </div>

                {/* Qualificação */}
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>
                        <LayoutGrid size={16} />
                        Dados de Qualificação
                    </h4>
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Conta de Luz</span>
                            <span className={styles.value}>{formatCurrency(lead.monthly_bill)}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Segmento</span>
                            <span className={styles.value}>{lead.segment || '-'}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Telhado</span>
                            <span className={styles.value}>{lead.roof_type || '-'}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.label}>Aumento Carga</span>
                            <span className={styles.value}>{lead.equipment_increase || 'Não'}</span>
                        </div>
                    </div>
                </div>

                {/* Location */}
                {(lead.city || lead.neighborhood) && (
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            <MapPin size={16} />
                            Localização
                        </h4>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Cidade</span>
                                <span className={styles.value}>{lead.city || '-'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.label}>Bairro</span>
                                <span className={styles.value}>{lead.neighborhood || '-'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.btnEdit}
                        onClick={() => onEdit(lead)}
                        disabled={loading}
                    >
                        Editar Lead
                    </button>
                    <button
                        className={styles.btnClose}
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
