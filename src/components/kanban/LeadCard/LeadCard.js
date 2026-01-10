'use client';

import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
    Star,
    Phone,
    Clock,
    Facebook,
    MessageCircle,
    User,
    AlertCircle,
    Calendar
} from 'lucide-react';
import clsx from 'clsx';
import styles from './LeadCard.module.css';

const LeadCard = forwardRef(({ lead, onClick, isDragging, loading = false }, ref) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: lead?.id || 'skeleton' });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (loading) {
        return (
            <div className={`${styles.leadCard} ${styles.skeleton}`} ref={ref}>
                <div className={`${styles.skeletonName} skeleton`} />
                <div className={`${styles.skeletonPhone} skeleton`} />
                <div className={`${styles.skeletonValue} skeleton`} />
            </div>
        );
    }

    // Calculate SLA from date if not provided by backend
    const calculateSlaFromDate = (lastInteraction) => {
        if (!lastInteraction) return 'RED';
        const now = new Date();
        const past = new Date(lastInteraction);
        const diffDays = Math.floor((now - past) / 86400000);

        if (diffDays < 1) return 'GREEN';
        if (diffDays < 3) return 'YELLOW';
        return 'RED';
    };

    const slaStatus = lead.sla_status || calculateSlaFromDate(lead.last_interaction_at);
    const isOverdue = slaStatus === 'RED';

    const getSlaClass = () => {
        switch (slaStatus) {
            case 'GREEN': return styles.statusGreen;
            case 'YELLOW': return styles.statusYellow;
            case 'RED': return styles.statusRed;
            default: return '';
        }
    };

    const getSlaIndicatorClass = () => {
        switch (slaStatus) {
            case 'GREEN': return styles.green;
            case 'YELLOW': return styles.yellow;
            case 'RED': return styles.red;
            default: return '';
        }
    };

    const getSourceIcon = () => {
        switch (lead.source) {
            case 'meta_ads':
                return (
                    <div className={`${styles.sourceIcon} ${styles.meta}`}>
                        <Facebook size={14} />
                    </div>
                );
            case 'whatsapp':
                return (
                    <div className={`${styles.sourceIcon} ${styles.whatsapp}`}>
                        <MessageCircle size={14} />
                    </div>
                );
            default:
                return (
                    <div className={`${styles.sourceIcon} ${styles.manual}`}>
                        <User size={14} />
                    </div>
                );
        }
    };

    const formatCurrency = (value) => {
        if (!value || value === 0) return null;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    const getRelativeTime = (date) => {
        if (!date) return 'Sem interação';
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias`;
        return `${Math.floor(diffDays / 7)} sem`;
    };

    // Calculate time in current stage (using pipeline_changed_at or created_at as fallback)
    const getTimeInStage = () => {
        const stageDate = lead.pipeline_changed_at || lead.createdAt || lead.created_at;
        if (!stageDate) return null;

        const now = new Date();
        const past = new Date(stageDate);
        const diffMs = now - past;
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    const timeInStage = getTimeInStage();

    const dragging = isDragging || isSortableDragging;

    // Build comprehensive tooltip for the card
    const buildCardTooltip = () => {
        const lines = [];

        // Header info
        lines.push(`📋 ${lead.name}`);
        lines.push(`📞 ${formatPhone(lead.phone) || 'Sem telefone'}`);

        // Source info
        if (lead.source === 'meta_ads') {
            lines.push(`📣 Origem: Facebook/Instagram Ads`);
            if (lead.meta_campaign_data?.campaign_name) {
                lines.push(`   Campanha: ${lead.meta_campaign_data.campaign_name}`);
            }
        } else if (lead.source === 'whatsapp') {
            lines.push(`💬 Origem: WhatsApp`);
        } else {
            lines.push(`📝 Origem: Manual`);
        }

        lines.push(''); // Separator

        // Time information
        if (lead.last_interaction_at) {
            const lastDate = new Date(lead.last_interaction_at);
            lines.push(`⏰ Última interação: ${lastDate.toLocaleDateString('pt-BR')} às ${lastDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
        } else {
            lines.push(`⏰ Última interação: Nunca`);
        }

        if (timeInStage) {
            lines.push(`🕐 Tempo na etapa atual: ${timeInStage}`);
        }

        // SLA Status explanation
        if (slaStatus === 'RED') {
            lines.push('');
            lines.push(`🔴 ATENÇÃO: Sem resposta há mais de 3 dias!`);
            lines.push(`   Ação recomendada: Fazer follow-up urgente.`);
        } else if (slaStatus === 'YELLOW') {
            lines.push('');
            lines.push(`🟡 ALERTA: Sem resposta há 1-3 dias.`);
            lines.push(`   Ação recomendada: Enviar lembrete.`);
        } else {
            lines.push('');
            lines.push(`🟢 OK: Interação recente (menos de 24h).`);
        }

        // Appointment info
        if (lead.appointments?.some(a => a.status === 'scheduled')) {
            const apt = lead.appointments.find(a => a.status === 'scheduled');
            const aptDate = new Date(apt.date_time);
            lines.push('');
            lines.push(`📅 Agendamento: ${aptDate.toLocaleDateString('pt-BR')} às ${aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
            lines.push(`   Tipo: ${apt.type === 'visita_tecnica' ? 'Visita Técnica' : apt.type === 'instalacao' ? 'Instalação' : apt.type}`);
        }

        // Value info
        if (lead.proposal_value) {
            lines.push('');
            lines.push(`💰 Valor proposta: ${formatCurrency(lead.proposal_value)}`);
        }

        return lines.join('\n');
    };

    // Build tooltip for SLA indicator
    const getSlaTooltip = () => {
        if (slaStatus === 'RED') {
            return '🔴 URGENTE: Lead sem resposta há mais de 3 dias!\nFazer follow-up imediatamente.';
        } else if (slaStatus === 'YELLOW') {
            return '🟡 ATENÇÃO: Lead sem resposta há 1-3 dias.\nConsidere enviar um lembrete.';
        }
        return '🟢 OK: Lead com interação recente (< 24h)';
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            className={clsx(
                styles.leadCard,
                getSlaClass(),
                {
                    [styles.dragging]: dragging,
                    [styles.important]: lead.is_important,
                    [styles.appointment]: lead.appointments?.some(a => a.status === 'scheduled'), // Add highlight class
                }
            )}
            onClick={() => onClick?.(lead)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2 }}
            title={buildCardTooltip()}
            {...attributes}
            {...listeners}
        >
            <div className={styles.header}>
                <span className={clsx(styles.leadName, { [styles.important]: lead.is_important })}>
                    {lead.is_important && (
                        <Star size={14} className={styles.importantIcon} fill="currentColor" />
                    )}
                    {lead.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isOverdue && (
                        <AlertCircle
                            size={16}
                            className={styles.alertPulse}
                            color="#EF4444"
                            title="⚠️ Lead sem interação há mais de 3 dias!"
                        />
                    )}
                    {getSourceIcon()}
                </div>
            </div>

            <div className={styles.body}>
                <span className={styles.phone}>
                    <Phone size={12} />
                    {formatPhone(lead.phone) || <span className={styles.missingInfo}>Telefone não informado</span>}
                </span>
                {/* Campaign badge for Meta Ads leads */}
                {lead.source === 'meta_ads' && lead.meta_campaign_data?.campaign_name && (
                    <span className={styles.campaignBadge}>
                        📣 {lead.meta_campaign_data.campaign_name}
                    </span>
                )}

                {/* Active Appointment Badge */}
                {lead.appointments && lead.appointments.some(a => a.status === 'scheduled') && (
                    <div className={styles.appointmentBadge}>
                        <Calendar size={12} />
                        {new Date(lead.appointments.find(a => a.status === 'scheduled').date_time).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <span className={clsx(styles.value, { [styles.empty]: !lead.proposal_value })}>
                    {formatCurrency(lead.proposal_value) || 'Sem proposta'}
                </span>
                <div className={styles.meta}>
                    {timeInStage && (
                        <span className={styles.stageBadge} title={`Tempo na etapa atual: ${timeInStage}`}>
                            🕐 {timeInStage}
                        </span>
                    )}
                    <span
                        className={styles.lastInteraction}
                        title={lead.last_interaction_at ?
                            `Última mensagem: ${new Date(lead.last_interaction_at).toLocaleDateString('pt-BR')} às ${new Date(lead.last_interaction_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` :
                            'Nenhuma interação registrada'
                        }
                    >
                        <Clock size={10} />
                        {getRelativeTime(lead.last_interaction_at)}
                    </span>
                    <span
                        className={clsx(styles.slaIndicator, getSlaIndicatorClass())}
                        title={getSlaTooltip()}
                    />
                </div>
            </div>
        </motion.div >
    );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
