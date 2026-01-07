'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    RefreshCw,
    Search,
    Star,
    Facebook,
    MessageCircle,
    User as UserIcon,
    Edit2,
    Trash2,
    Users,
    Eye,
    Ban,
    RotateCcw
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import ConfirmModal from '@/components/shared/ConfirmModal/ConfirmModal';
import { leadService, pipelineService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './page.module.css';

// Demo data
const DEMO_LEADS = [
    { id: '1', name: 'Roberto Ferreira', phone: '11999887766', source: 'meta_ads', proposal_value: 45000, is_important: false, sla_status: 'GREEN', pipeline: { id: '1', title: 'Proposta', color: '#F97316' }, last_interaction_at: new Date() },
    { id: '2', name: 'Fernanda Lima', phone: '11988776655', source: 'whatsapp', proposal_value: 32000, is_important: true, sla_status: 'YELLOW', pipeline: { id: '2', title: 'Qualificado', color: '#6AD2FF' }, last_interaction_at: new Date(Date.now() - 86400000) },
    { id: '3', name: 'Pedro Henrique', phone: '21998877665', source: 'manual', proposal_value: 78000, is_important: false, sla_status: 'GREEN', pipeline: { id: '3', title: 'Negociação', color: '#10B981' }, last_interaction_at: new Date() },
    { id: '4', name: 'Luciana Costa', phone: '31987654321', source: 'meta_ads', proposal_value: 0, is_important: true, sla_status: 'RED', pipeline: { id: '1', title: 'Novo Lead', color: '#4318FF' }, last_interaction_at: new Date(Date.now() - 259200000) },
];

const DEMO_PIPELINES = [
    { id: '1', title: 'Novo Lead', color: '#4318FF' },
    { id: '2', title: 'Qualificado', color: '#6AD2FF' },
    { id: '3', title: 'Proposta', color: '#F97316' },
    { id: '4', title: 'Negociação', color: '#10B981' },
];

export default function LeadsPage() {
    const { showSuccessAlert } = useNotification();
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);
    const [pipelines, setPipelines] = useState([]);
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [pipelineFilter, setPipelineFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [deleteLead, setDeleteLead] = useState(null);
    const [blockLead, setBlockLead] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leadsData, pipelinesData] = await Promise.all([
                leadService.getAll(),
                pipelineService.getAll(),
            ]);
            setLeads(leadsData);
            setPipelines(pipelinesData);
        } catch (error) {
            console.log('Using demo data');
            setLeads(DEMO_LEADS);
            setPipelines(DEMO_PIPELINES);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (data) => {
        setModalLoading(true);
        try {
            const newLead = await leadService.create(data);
            setLeads((prev) => [newLead, ...prev]);
            setShowModal(false);
        } catch (error) {
            const newLead = {
                id: Date.now().toString(),
                ...data,
                sla_status: 'GREEN',
                pipeline: pipelines.find(p => p.id === data.pipeline_id),
                last_interaction_at: new Date(),
            };
            setLeads((prev) => [newLead, ...prev]);
            setShowModal(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdateLead = async (data) => {
        setModalLoading(true);
        try {
            const updated = await leadService.update(editingLead.id, data);
            setLeads((prev) => prev.map(l => l.id === editingLead.id ? updated : l));
            setEditingLead(null);
        } catch (error) {
            setLeads((prev) => prev.map(l => l.id === editingLead.id ? { ...l, ...data } : l));
            setEditingLead(null);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteLead = async () => {
        setModalLoading(true);
        try {
            await leadService.delete(deleteLead.id);
            setLeads((prev) => prev.filter(l => l.id !== deleteLead.id));
            setDeleteLead(null);
            showSuccessAlert('Lead Removido', 'O lead foi excluído. Se ele entrar em contato novamente, será criado como novo lead.');
        } catch (error) {
            setLeads((prev) => prev.filter(l => l.id !== deleteLead.id));
            setDeleteLead(null);
        } finally {
            setModalLoading(false);
        }
    };

    const handleBlockLead = async () => {
        setModalLoading(true);
        try {
            await leadService.block(blockLead.id);
            setLeads((prev) => prev.filter(l => l.id !== blockLead.id));
            setBlockLead(null);
            showSuccessAlert('Lead Bloqueado', 'O lead foi bloqueado permanentemente e não aparecerá mais, mesmo se entrar em contato.');
        } catch (error) {
            console.error('Error blocking lead:', error);
            setBlockLead(null);
        } finally {
            setModalLoading(false);
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatCurrency = (value) => {
        if (!value) return null;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
    };

    const formatPhone = (phone) => {
        if (!phone) return '-';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'meta_ads': return <Facebook size={12} />;
            case 'whatsapp': return <MessageCircle size={12} />;
            default: return <UserIcon size={12} />;
        }
    };

    const getSourceLabel = (source) => {
        switch (source) {
            case 'meta_ads': return 'Meta Ads';
            case 'whatsapp': return 'WhatsApp';
            default: return 'Manual';
        }
    };

    const getSlaClass = (status) => {
        switch (status) {
            case 'GREEN': return styles.green;
            case 'YELLOW': return styles.yellow;
            case 'RED': return styles.red;
            default: return '';
        }
    };

    const getSlaLabel = (status) => {
        switch (status) {
            case 'GREEN': return 'Em dia';
            case 'YELLOW': return 'Atenção';
            case 'RED': return 'Atrasado';
            default: return '-';
        }
    };

    const filteredLeads = leads.filter(l => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (sourceFilter && l.source !== sourceFilter) return false;
        if (pipelineFilter && l.pipeline?.id !== pipelineFilter) return false;
        return true;
    });

    return (
        <>
            <Header title="Leads" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.searchBox}>
                            <Search size={18} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Buscar leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className={styles.filters}>
                            <select
                                className={styles.filterSelect}
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                            >
                                <option value="">Todas origens</option>
                                <option value="meta_ads">Meta Ads</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="manual">Manual</option>
                            </select>
                            <select
                                className={styles.filterSelect}
                                value={pipelineFilter}
                                onChange={(e) => setPipelineFilter(e.target.value)}
                            >
                                <option value="">Todos pipelines</option>
                                {pipelines.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={loadData}>
                            <RefreshCw size={16} />
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => setShowModal(true)}
                        >
                            <Plus size={16} />
                            Novo Lead
                        </button>
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Origem</th>
                                <th>Campanha</th>
                                <th>Pipeline</th>
                                <th>SLA</th>
                                <th>Valor Proposta</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className={styles.skeletonRow}>
                                        <td><div className={styles.skeletonCell} style={{ width: 200 }} /></td>
                                        <td><div className={styles.skeletonCell} style={{ width: 80 }} /></td>
                                        <td><div className={styles.skeletonCell} style={{ width: 120 }} /></td>
                                        <td><div className={styles.skeletonCell} style={{ width: 100 }} /></td>
                                        <td><div className={styles.skeletonCell} style={{ width: 80 }} /></td>
                                        <td><div className={styles.skeletonCell} style={{ width: 100 }} /></td>
                                        <td><div className={styles.skeletonCell} style={{ width: 80 }} /></td>
                                    </tr>
                                ))
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className={styles.emptyState}>
                                            <div className={styles.emptyIcon}>
                                                <Users size={40} />
                                            </div>
                                            <h3 className={styles.emptyTitle}>Nenhum lead encontrado</h3>
                                            <p className={styles.emptyText}>
                                                Crie seu primeiro lead para começar.
                                            </p>
                                            <button
                                                className={`${styles.btn} ${styles.btnPrimary}`}
                                                onClick={() => setShowModal(true)}
                                            >
                                                <Plus size={16} />
                                                Criar Lead
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <motion.tr
                                        key={lead.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td>
                                            <div className={styles.leadInfo}>
                                                <div className={styles.leadAvatar}>{getInitials(lead.name)}</div>
                                                <div>
                                                    <div className={styles.leadName}>
                                                        {lead.is_important && <Star size={14} fill="#F97316" className={styles.importantIcon} />}
                                                        {lead.name}
                                                    </div>
                                                    <div className={styles.leadPhone}>{formatPhone(lead.phone)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[lead.source === 'meta_ads' ? 'meta' : lead.source]}`}>
                                                {getSourceIcon(lead.source)}
                                                {getSourceLabel(lead.source)}
                                            </span>
                                        </td>
                                        <td>
                                            {lead.source === 'meta_ads' && lead.meta_campaign_data?.campaign_name ? (
                                                <div className={styles.campaignInfo}>
                                                    <span className={styles.campaignName}>
                                                        📣 {lead.meta_campaign_data.campaign_name}
                                                    </span>
                                                    {lead.meta_campaign_data.adset_name && (
                                                        <span className={styles.adsetName}>
                                                            {lead.meta_campaign_data.adset_name}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={styles.noCampaign}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={styles.pipelineBadge}
                                                style={{ background: lead.pipeline?.color || '#4318FF' }}
                                            >
                                                {lead.pipeline?.title || 'Novo Lead'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.slaIndicator}>
                                                <span className={`${styles.slaDot} ${getSlaClass(lead.sla_status)}`} />
                                                <span className={styles.slaText}>{getSlaLabel(lead.sla_status)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.value} ${!lead.proposal_value ? styles.empty : ''}`}>
                                                {formatCurrency(lead.proposal_value) || 'Sem proposta'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button className={styles.actionBtn} onClick={() => setEditingLead(lead)} title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className={`${styles.actionBtn} ${styles.warning}`} onClick={() => setDeleteLead(lead)} title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => setBlockLead(lead)} title="Bloquear">
                                                    <Ban size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <LeadModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleCreateLead}
                pipelines={pipelines}
                loading={modalLoading}
            />

            <LeadModal
                isOpen={!!editingLead}
                onClose={() => setEditingLead(null)}
                onSubmit={handleUpdateLead}
                lead={editingLead}
                pipelines={pipelines}
                loading={modalLoading}
            />

            <ConfirmModal
                isOpen={!!deleteLead}
                onClose={() => setDeleteLead(null)}
                onConfirm={handleDeleteLead}
                title="Excluir Lead"
                message={`Tem certeza que deseja excluir o lead "${deleteLead?.name}"? Se ele entrar em contato novamente, será criado como novo lead.`}
                loading={modalLoading}
            />

            <ConfirmModal
                isOpen={!!blockLead}
                onClose={() => setBlockLead(null)}
                onConfirm={handleBlockLead}
                title="Bloquear Lead"
                message={`Tem certeza que deseja BLOQUEAR o lead "${blockLead?.name}"? Este lead será permanentemente bloqueado e não aparecerá mais, mesmo se entrar em contato novamente.`}
                loading={modalLoading}
                confirmText="Bloquear"
                confirmColor="#EF4444"
            />
        </>
    );
}
