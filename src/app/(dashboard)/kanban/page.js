'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
    Plus,
    Filter,
    RefreshCw,
    X,
    Phone,
    Mail,
    DollarSign,
    Calendar,
    MessageSquare,
    Star,
    AlertCircle,
    CheckCircle,
    Clock,
    Edit2,
    Trash2,
    MapPin,
    Wrench
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import KanbanBoard from '@/components/kanban/KanbanBoard/KanbanBoard';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import PipelineModal from '@/components/pipeline/PipelineModal/PipelineModal';
import AppointmentModal from '@/components/appointments/AppointmentModal/AppointmentModal';
import ConfirmModal from '@/components/shared/ConfirmModal/ConfirmModal';
import { pipelineService, leadService, appointmentService, messageService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-painelsolar-sistema.r954jc.easypanel.host';

export default function KanbanPage() {
    const { showSuccessAlert } = useNotification();
    const [loading, setLoading] = useState(true);
    const [pipelines, setPipelines] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPipelineModal, setShowPipelineModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [editingPipeline, setEditingPipeline] = useState(null);
    const [deleteLead, setDeleteLead] = useState(null);
    const [deletePipeline, setDeletePipeline] = useState(null);
    const [targetPipeline, setTargetPipeline] = useState('');
    const [addToPipeline, setAddToPipeline] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [isRealtime, setIsRealtime] = useState(false);
    const socketRef = useRef(null);

    // Socket.io connection for real-time updates
    useEffect(() => {
        socketRef.current = io(API_URL.replace('/api', ''), {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('[Kanban] Socket connected for real-time updates');
            setIsRealtime(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('[Kanban] Socket disconnected');
            setIsRealtime(false);
        });

        // Listen for new leads
        socketRef.current.on('new_lead', (newLead) => {
            console.log('[Kanban] New lead received:', newLead);
            setPipelines(prev => prev.map(p => {
                if (p.id === newLead.pipeline_id) {
                    // Check if lead already exists to avoid duplicates
                    const exists = p.leads?.some(l => l.id === newLead.id);
                    if (!exists) {
                        return { ...p, leads: [...(p.leads || []), newLead] };
                    }
                }
                return p;
            }));
            showSuccessAlert('Novo Lead!', `${newLead.name} entrou no funil.`);
        });

        // Listen for lead updates (e.g., pipeline changes)
        socketRef.current.on('lead_update', (updatedLead) => {
            console.log('[Kanban] Lead updated:', updatedLead);
            setPipelines(prev => {
                // Remove lead from old pipeline and add to new one
                let leadFound = null;
                const updated = prev.map(p => {
                    const existingLead = p.leads?.find(l => l.id === updatedLead.id);
                    if (existingLead) {
                        leadFound = { ...existingLead, ...updatedLead };
                    }
                    return {
                        ...p,
                        leads: p.leads?.filter(l => l.id !== updatedLead.id) || []
                    };
                });

                // Add to correct pipeline
                if (leadFound) {
                    return updated.map(p => {
                        if (p.id === updatedLead.pipeline_id) {
                            return { ...p, leads: [...(p.leads || []), leadFound] };
                        }
                        return p;
                    });
                }
                return updated;
            });
        });

        // Listen for AI pause notifications
        socketRef.current.on('ai_paused_notification', (data) => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            showSuccessAlert('IA Pausada', `Intervenção humana detectada para ${data.leadName} às ${timeStr}`);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [showSuccessAlert]);

    useEffect(() => {
        loadKanbanData();
    }, []);

    const loadKanbanData = async () => {
        setLoading(true);
        try {
            const data = await pipelineService.getKanban();
            setPipelines(data);
        } catch (error) {
            console.error('Error fetching kanban data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePipelineReorder = async (newPipelines) => {
        // Optimistic update
        setPipelines(newPipelines);

        // API Call
        try {
            const orderedIds = newPipelines.map(p => p.id);
            await pipelineService.reorder(orderedIds);
        } catch (error) {
            console.error('Error reordering pipelines:', error);
            showSuccessAlert('Erro ao salvar ordem das etapas', 'error');
            loadKanbanData(); // Revert on error
        }
    };

    const handleLeadMove = async (leadId, newPipelineId, newOrderIndex) => {
        // Optimistic update
        setPipelines((prev) => {
            const updated = prev.map((p) => ({
                ...p,
                leads: p.leads?.filter((l) => l.id !== leadId) || [],
            }));

            const lead = prev.flatMap((p) => p.leads || []).find((l) => l.id === leadId);
            if (lead) {
                const targetIndex = updated.findIndex((p) => p.id === newPipelineId);
                if (targetIndex >= 0) {
                    const targetLeads = [...(updated[targetIndex].leads || [])];
                    targetLeads.splice(newOrderIndex, 0, lead);
                    updated[targetIndex] = { ...updated[targetIndex], leads: targetLeads };
                }
            }

            return updated;
        });

        // API call
        try {
            await leadService.move(leadId, newPipelineId, newOrderIndex);
        } catch (error) {
            console.error('Error moving lead:', error);
        }
    };

    const handleLeadClick = async (lead) => {
        setSelectedLead(lead);
        setShowDetailModal(true);

        try {
            const messages = await messageService.getHistory(lead.id);
            setSelectedLead(prev => ({ ...prev, messages }));
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedLead(null);
    };

    const handleAddLead = (pipeline) => {
        setAddToPipeline(pipeline);
        setShowLeadModal(true);
    };

    const handleCreateLead = async (data) => {
        setModalLoading(true);
        try {
            const targetPipeline = addToPipeline || pipelines[0];
            const leadData = { ...data, pipeline_id: targetPipeline.id };
            const newLead = await leadService.create(leadData);

            // Fetch new lead complete data (including order_index)
            const createdLead = await leadService.getById(newLead.id);

            setPipelines((prev) => prev.map(p => {
                if (p.id === targetPipeline.id) {
                    return { ...p, leads: [...(p.leads || []), createdLead] };
                }
                return p;
            }));
        } catch (error) {
            console.error('Error creating lead:', error);
        } finally {
            setModalLoading(false);
            setShowLeadModal(false);
            setAddToPipeline(null);
        }
    };

    const handleEditLead = () => {
        setEditingLead(selectedLead);
        setShowDetailModal(false);
    };

    const handleUpdateLead = async (data) => {
        setModalLoading(true);
        try {
            const updated = await leadService.update(editingLead.id, data);
            setPipelines((prev) => prev.map(p => ({
                ...p,
                leads: p.leads?.map(l => l.id === editingLead.id ? { ...l, ...updated } : l) || [],
            })));
        } catch (error) {
            console.error('Error updating lead:', error);
        } finally {
            setModalLoading(false);
            setEditingLead(null);
        }
    };

    const handleDeleteLead = async () => {
        setModalLoading(true);
        try {
            await leadService.delete(deleteLead.id);
            setPipelines((prev) => prev.map(p => ({
                ...p,
                leads: p.leads?.filter(l => l.id !== deleteLead.id) || [],
            })));
        } catch (error) {
            console.error('Error deleting lead:', error);
        } finally {
            setModalLoading(false);
            setDeleteLead(null);
            setShowDetailModal(false);
        }
    };

    const handleAddColumn = () => {
        setShowPipelineModal(true);
    };

    const handleCreatePipeline = async (data) => {
        setModalLoading(true);
        try {
            const newPipeline = await pipelineService.create(data);
            setPipelines((prev) => [...prev, { ...newPipeline, leads: [] }]);
            showSuccessAlert('Funil Criado', `O funil "${data.title}" foi criado com sucesso.`);
        } catch (error) {
            const newPipeline = {
                id: Date.now().toString(),
                ...data,
                order_index: pipelines.length,
                leads: []
            };
            setPipelines((prev) => [...prev, newPipeline]);
        } finally {
            setModalLoading(false);
            setShowPipelineModal(false);
        }
    };

    const handleEditColumn = (pipeline) => {
        setEditingPipeline(pipeline);
        setShowPipelineModal(true);
    };

    const handleUpdatePipeline = async (data) => {
        setModalLoading(true);
        try {
            const updated = await pipelineService.update(editingPipeline.id, data);
            setPipelines((prev) => prev.map(p => p.id === editingPipeline.id ? { ...p, ...updated } : p));
            showSuccessAlert('Funil Atualizado', `O funil "${data.title}" foi atualizado.`);
        } catch (error) {
            setPipelines((prev) => prev.map(p => p.id === editingPipeline.id ? { ...p, ...data } : p));
        } finally {
            setModalLoading(false);
            setShowPipelineModal(false);
            setEditingPipeline(null);
        }
    };

    const handleDeleteColumn = (pipeline) => {
        setDeletePipeline(pipeline);
        // Set default target to first available pipeline
        const otherPipelines = pipelines.filter(p => p.id !== pipeline.id);
        if (otherPipelines.length > 0) {
            setTargetPipeline(otherPipelines[0].id);
        }
    };

    const handleConfirmDeletePipeline = async () => {
        if (!deletePipeline) return;

        setModalLoading(true);
        try {
            const leadsToMove = deletePipeline.leads || [];

            // Move leads to target pipeline if there are any
            if (leadsToMove.length > 0 && targetPipeline) {
                for (const lead of leadsToMove) {
                    await leadService.move(lead.id, targetPipeline, 0);
                }
            }

            // Delete the pipeline
            await pipelineService.delete(deletePipeline.id);

            // Update local state
            setPipelines((prev) => {
                let updated = prev.filter(p => p.id !== deletePipeline.id);
                if (leadsToMove.length > 0 && targetPipeline) {
                    updated = updated.map(p => {
                        if (p.id === targetPipeline) {
                            return { ...p, leads: [...(p.leads || []), ...leadsToMove] };
                        }
                        return p;
                    });
                }
                return updated;
            });

            showSuccessAlert('Funil Excluído', `O funil "${deletePipeline.title}" foi excluído.${leadsToMove.length > 0 ? ` ${leadsToMove.length} leads foram realocados.` : ''}`);
        } catch (error) {
            console.error('Error deleting pipeline:', error);
        } finally {
            setModalLoading(false);
            setDeletePipeline(null);
            setTargetPipeline('');
        }
    };

    const handleScheduleVisit = () => {
        setShowAppointmentModal(true);
        setShowDetailModal(false);
    };

    const handleCreateAppointment = async (data) => {
        setModalLoading(true);
        try {
            await appointmentService.create(data);
        } catch (error) {
            console.log('Appointment created in demo mode');
        } finally {
            setModalLoading(false);
            setShowAppointmentModal(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatPhone = (phone) => {
        if (!phone) return '-';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const allLeads = pipelines.flatMap(p => p.leads || []);

    return (
        <>
            <Header title="Kanban" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Filtrar:</span>
                            <select className={styles.filterSelect}>
                                <option value="">Todos os leads</option>
                                <option value="important">Importantes</option>
                                <option value="overdue">SLA Vencido</option>
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Origem:</span>
                            <select className={styles.filterSelect}>
                                <option value="">Todas</option>
                                <option value="meta_ads">Meta Ads</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                        {/* Real-time indicator */}
                        <div
                            className={`${styles.realtimeIndicator} ${isRealtime ? styles.connected : ''}`}
                            title={isRealtime ? 'Conectado - atualizações automáticas ativas' : 'Desconectado - recarregue a página'}
                        >
                            <span className={styles.realtimeDot} />
                            <span className={styles.realtimeText}>
                                {isRealtime ? 'Atualizando em Tempo Real' : 'Desconectado'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={loadKanbanData}>
                            <RefreshCw size={16} />
                            Atualizar
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => setShowLeadModal(true)}
                        >
                            <Plus size={16} />
                            Novo Lead
                        </button>
                    </div>
                </div>

                <KanbanBoard
                    pipelines={pipelines}
                    onLeadMove={handleLeadMove}
                    onLeadClick={handleLeadClick}
                    onAddLead={handleAddLead}
                    onAddColumn={handleAddColumn}
                    onEditColumn={handleEditColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onPipelineReorder={handlePipelineReorder}
                    loading={loading}
                />

                {/* Lead Detail Modal */}
                <AnimatePresence>
                    {showDetailModal && selectedLead && (
                        <motion.div
                            className={styles.modalOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseDetailModal}
                        >
                            <motion.div
                                className={styles.detailModal}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalTitle}>
                                        {selectedLead.is_important && (
                                            <Star size={20} fill="#F97316" color="#F97316" />
                                        )}
                                        <h2>{selectedLead.name}</h2>
                                    </div>
                                    <button className={styles.closeBtn} onClick={handleCloseDetailModal}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className={styles.modalBody}>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <Phone size={16} />
                                            <span>{formatPhone(selectedLead.phone)}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <DollarSign size={16} />
                                            <span>{formatCurrency(selectedLead.proposal_value)}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <Clock size={16} />
                                            <span>Última interação: {formatDate(selectedLead.last_interaction_at)}</span>
                                        </div>
                                    </div>

                                    {/* Marketing Data Section for Meta Leads */}
                                    {selectedLead.source === 'meta_ads' && selectedLead.meta_campaign_data && (
                                        <div className={styles.section} style={{ marginTop: '16px' }}>
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1877F2' }}>
                                                📣 Dados de Marketing
                                            </h3>
                                            <div className={styles.marketingData}>
                                                {selectedLead.meta_campaign_data.campaign_name && (
                                                    <div className={styles.marketingItem}>
                                                        <span className={styles.marketingLabel}>Campanha:</span>
                                                        <span className={styles.marketingValue}>{selectedLead.meta_campaign_data.campaign_name}</span>
                                                    </div>
                                                )}
                                                {selectedLead.meta_campaign_data.adset_name && (
                                                    <div className={styles.marketingItem}>
                                                        <span className={styles.marketingLabel}>Conjunto:</span>
                                                        <span className={styles.marketingValue}>{selectedLead.meta_campaign_data.adset_name}</span>
                                                    </div>
                                                )}
                                                {selectedLead.meta_campaign_data.ad_name && (
                                                    <div className={styles.marketingItem}>
                                                        <span className={styles.marketingLabel}>Anúncio:</span>
                                                        <span className={styles.marketingValue}>{selectedLead.meta_campaign_data.ad_name}</span>
                                                    </div>
                                                )}
                                                {selectedLead.meta_campaign_data.form_id && (
                                                    <div className={styles.marketingItem}>
                                                        <span className={styles.marketingLabel}>Formulário:</span>
                                                        <span className={styles.marketingValue} style={{ fontSize: '0.75rem', color: '#888' }}>
                                                            {selectedLead.meta_campaign_data.form_id}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.section}>
                                        <h3>Histórico de Mensagens</h3>
                                        <div className={styles.messageList}>
                                            {selectedLead.messages?.length > 0 ? (
                                                selectedLead.messages.map((msg) => (
                                                    <div key={msg.id} className={`${styles.messageItem} ${styles[msg.sender]}`}>
                                                        {msg.content}
                                                        <div className={styles.messageTime}>
                                                            {formatDate(msg.timestamp)}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.emptyMessages}>
                                                    Nenhuma mensagem encontrada.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.modalFooter}>
                                    <button
                                        className={`${styles.btn} ${styles.btnDanger}`}
                                        onClick={() => setDeleteLead(selectedLead)}
                                    >
                                        <Trash2 size={16} />
                                        Excluir
                                    </button>
                                    <div className={styles.footerActions}>
                                        <button
                                            className={`${styles.btn} ${styles.btnSecondary}`}
                                            onClick={handleScheduleVisit}
                                        >
                                            <Calendar size={16} />
                                            Agendar Visita
                                        </button>
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            onClick={handleEditLead}
                                        >
                                            <Edit2 size={16} />
                                            Editar Lead
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Lead Modal */}
                <LeadModal
                    isOpen={showLeadModal}
                    onClose={() => { setShowLeadModal(false); setAddToPipeline(null); }}
                    onSubmit={handleCreateLead}
                    onCreatePipeline={() => {
                        setShowLeadModal(false);
                        setShowPipelineModal(true);
                    }}
                    pipelines={pipelines}
                    initialPipelineId={addToPipeline?.id}
                    loading={modalLoading}
                />

                {/* Edit Lead Modal */}
                <LeadModal
                    isOpen={!!editingLead}
                    onClose={() => setEditingLead(null)}
                    onSubmit={handleUpdateLead}
                    lead={editingLead}
                    pipelines={pipelines}
                    loading={modalLoading}
                />

                {/* Create Pipeline Modal */}
                <PipelineModal
                    isOpen={showPipelineModal}
                    onClose={() => { setShowPipelineModal(false); setEditingPipeline(null); }}
                    onSubmit={editingPipeline ? handleUpdatePipeline : handleCreatePipeline}
                    pipeline={editingPipeline}
                    loading={modalLoading}
                />

                {/* Appointment Modal */}
                <AppointmentModal
                    isOpen={showAppointmentModal}
                    onClose={() => setShowAppointmentModal(false)}
                    onSubmit={handleCreateAppointment}
                    leads={allLeads}
                    loading={modalLoading}
                />

                {/* Delete Lead Confirm */}
                <ConfirmModal
                    isOpen={!!deleteLead}
                    onClose={() => setDeleteLead(null)}
                    onConfirm={handleDeleteLead}
                    title="Excluir Lead"
                    message={`Tem certeza que deseja excluir o lead "${deleteLead?.name}"?`}
                    loading={modalLoading}
                />

                {/* Delete Pipeline Modal */}
                {deletePipeline && (
                    <div className={styles.modalOverlay} onClick={() => setDeletePipeline(null)}>
                        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.deleteModalHeader}>
                                <h3>Excluir Funil</h3>
                                <button className={styles.closeButton} onClick={() => setDeletePipeline(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className={styles.deleteModalContent}>
                                <p>
                                    Tem certeza que deseja excluir o funil <strong>"{deletePipeline.title}"</strong>?
                                </p>

                                {(deletePipeline.leads?.length || 0) > 0 && (
                                    <div className={styles.leadsWarning}>
                                        <AlertCircle size={20} color="#F59E0B" />
                                        <div>
                                            <p><strong>Este funil possui {deletePipeline.leads.length} lead(s).</strong></p>
                                            <p>Escolha para qual funil deseja mover os leads:</p>
                                            <select
                                                className={styles.pipelineSelect}
                                                value={targetPipeline}
                                                onChange={(e) => setTargetPipeline(e.target.value)}
                                            >
                                                {pipelines
                                                    .filter(p => p.id !== deletePipeline.id)
                                                    .map(p => (
                                                        <option key={p.id} value={p.id}>{p.title}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={styles.deleteModalActions}>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={() => setDeletePipeline(null)}
                                    disabled={modalLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={handleConfirmDeletePipeline}
                                    disabled={modalLoading}
                                >
                                    {modalLoading ? 'Excluindo...' : 'Excluir Funil'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

