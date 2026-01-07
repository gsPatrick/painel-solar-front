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
    AlertCircle
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

    const dragging = isDragging || isSortableDragging;

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
                }
            )}
            onClick={() => onClick?.(lead)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2 }}
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
                        <AlertCircle size={16} className={styles.alertPulse} color="#EF4444" />
                    )}
                    {getSourceIcon()}
                </div>
            </div>

            <div className={styles.body}>
                <span className={styles.phone}>
                    <Phone size={12} />
                    {formatPhone(lead.phone)}
                </span>
                {/* Campaign badge for Meta Ads leads */}
                {lead.source === 'meta_ads' && lead.meta_campaign_data?.campaign_name && (
                    <span className={styles.campaignBadge}>
                        📣 {lead.meta_campaign_data.campaign_name}
                    </span>
                )}
            </div>

            <div className={styles.footer}>
                <span className={clsx(styles.value, { [styles.empty]: !lead.proposal_value })}>
                    {formatCurrency(lead.proposal_value) || 'Sem proposta'}
                </span>
                <div className={styles.meta}>
                    <span className={styles.lastInteraction}>
                        <Clock size={10} />
                        {getRelativeTime(lead.last_interaction_at)}
                    </span>
                    <span className={clsx(styles.slaIndicator, getSlaIndicatorClass())} />
                </div>
            </div>
        </motion.div>
    );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
