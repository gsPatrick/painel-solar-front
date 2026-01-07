'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw,
    Save,
    Clock,
    MessageSquare,
    Users,
    CheckCircle,
    AlertCircle,
    Send,
    Play,
    Pause,
    Settings
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { systemSettingsService, followupService, leadService } from '@/services/api';
import styles from './page.module.css';

export default function FollowUpPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [runningJob, setRunningJob] = useState(false);

    // Settings state
    const [followupDelayHours, setFollowupDelayHours] = useState(24);
    const [maxFollowups, setMaxFollowups] = useState(3);
    const [followupMessage, setFollowupMessage] = useState('');
    const [businessHoursStart, setBusinessHoursStart] = useState(8);
    const [businessHoursEnd, setBusinessHoursEnd] = useState(20);

    // Leads state
    const [pendingLeads, setPendingLeads] = useState([]);
    const [approvalLeads, setApprovalLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([loadSettings(), loadLeads()]);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const settings = await systemSettingsService.getAll();

            if (settings.followup_delay_hours) {
                setFollowupDelayHours(settings.followup_delay_hours.value || 24);
            }
            if (settings.followup_message) {
                setFollowupMessage(settings.followup_message.value || '');
            }
            if (settings.max_followups) {
                setMaxFollowups(settings.max_followups.value || 3);
            }
            if (settings.business_hours_start) {
                setBusinessHoursStart(settings.business_hours_start.value || 8);
            }
            if (settings.business_hours_end) {
                setBusinessHoursEnd(settings.business_hours_end.value || 20);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    const loadLeads = async () => {
        setLoadingLeads(true);
        try {
            const [pending, approval] = await Promise.all([
                followupService.getPending(),
                followupService.getApproval(),
            ]);
            setPendingLeads(pending || []);
            setApprovalLeads(approval || []);
        } catch (err) {
            console.error('Error loading leads:', err);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);

        try {
            await systemSettingsService.bulkUpdate({
                followup_delay_hours: String(followupDelayHours),
                followup_message: followupMessage,
                max_followups: String(maxFollowups),
                business_hours_start: String(businessHoursStart),
                business_hours_end: String(businessHoursEnd),
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleRunJob = async () => {
        setRunningJob(true);
        try {
            const result = await followupService.runJob();
            alert(`Job executado! ${result.sent}/${result.total} mensagens enviadas.`);
            loadLeads();
        } catch (err) {
            alert('Erro ao executar job de follow-up');
        } finally {
            setRunningJob(false);
        }
    };

    const handleSendFollowup = async (leadId) => {
        try {
            await followupService.send(leadId);
            alert('Follow-up enviado com sucesso!');
            loadLeads();
        } catch (err) {
            alert('Erro ao enviar follow-up');
        }
    };

    const handleApprove = async (leadId) => {
        try {
            await followupService.approve(leadId);
            alert('IA reativada e follow-up enviado!');
            loadLeads();
        } catch (err) {
            alert('Erro ao aprovar follow-up');
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <>
                <Header title="Follow-up" />
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <RefreshCw className={styles.spin} size={32} />
                        <p>Carregando configurações...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Follow-up" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <RefreshCw size={28} className={styles.headerIcon} />
                        <div>
                            <h1>Sistema de Follow-up</h1>
                            <p>Configure e gerencie follow-ups automáticos</p>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            className={styles.runBtn}
                            onClick={handleRunJob}
                            disabled={runningJob}
                        >
                            {runningJob ? <RefreshCw className={styles.spin} size={18} /> : <Play size={18} />}
                            {runningJob ? 'Executando...' : 'Executar Agora'}
                        </button>
                        <button
                            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <RefreshCw className={styles.spin} size={18} />
                            ) : saved ? (
                                <CheckCircle size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className={styles.errorBanner}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className={styles.grid}>
                    {/* Configurações */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.cardHeader}>
                            <Settings size={20} />
                            <h2>Configurações</h2>
                        </div>

                        <div className={styles.settingsGrid}>
                            <div className={styles.inputGroup}>
                                <label>Delay para Follow-up (horas)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="168"
                                    value={followupDelayHours}
                                    onChange={(e) => setFollowupDelayHours(parseInt(e.target.value) || 24)}
                                />
                                <span className={styles.inputHint}>
                                    Tempo sem resposta para enviar follow-up
                                </span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Máximo de Tentativas</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={maxFollowups}
                                    onChange={(e) => setMaxFollowups(parseInt(e.target.value) || 3)}
                                />
                                <span className={styles.inputHint}>
                                    Quantidade máxima de follow-ups por lead
                                </span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Horário Comercial - Início</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={businessHoursStart}
                                    onChange={(e) => setBusinessHoursStart(parseInt(e.target.value) || 8)}
                                />
                                <span className={styles.inputHint}>
                                    Hora de início (ex: 8 = 8:00)
                                </span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Horário Comercial - Fim</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={businessHoursEnd}
                                    onChange={(e) => setBusinessHoursEnd(parseInt(e.target.value) || 20)}
                                />
                                <span className={styles.inputHint}>
                                    Hora de término (ex: 20 = 20:00)
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mensagem de Follow-up */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.cardHeader}>
                            <MessageSquare size={20} />
                            <h2>Mensagem Padrão</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Mensagem enviada automaticamente. Use <code>{'{nome}'}</code> para incluir o nome do lead.
                        </p>
                        <textarea
                            className={styles.textarea}
                            value={followupMessage}
                            onChange={(e) => setFollowupMessage(e.target.value)}
                            placeholder="Olá {nome}! Tudo bem? Passando para saber se..."
                            rows={5}
                        />
                    </motion.div>
                </div>

                {/* Leads pendentes */}
                <div className={styles.leadsSection}>
                    <motion.div
                        className={styles.leadsCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.cardHeader}>
                            <Clock size={20} />
                            <h2>Leads Aguardando Follow-up</h2>
                            <span className={styles.badge}>{pendingLeads.length}</span>
                        </div>

                        {pendingLeads.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={32} />
                                <p>Nenhum lead aguardando follow-up</p>
                            </div>
                        ) : (
                            <div className={styles.leadsList}>
                                {pendingLeads.map((lead) => (
                                    <div key={lead.id} className={styles.leadItem}>
                                        <div className={styles.leadInfo}>
                                            <span className={styles.leadName}>{lead.name}</span>
                                            <span className={styles.leadPhone}>{lead.phone}</span>
                                            <span className={styles.leadDate}>
                                                Última interação: {formatDate(lead.last_interaction_at)}
                                            </span>
                                        </div>
                                        <div className={styles.leadActions}>
                                            <span className={styles.followupCount}>
                                                {lead.followup_count || 0}/{maxFollowups}
                                            </span>
                                            <button
                                                className={styles.sendBtn}
                                                onClick={() => handleSendFollowup(lead.id)}
                                            >
                                                <Send size={14} />
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        className={styles.leadsCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className={styles.cardHeader}>
                            <Pause size={20} />
                            <h2>Aguardando Aprovação</h2>
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>{approvalLeads.length}</span>
                        </div>
                        <p className={styles.cardDescription}>
                            Leads com IA pausada que precisam de follow-up.
                        </p>

                        {approvalLeads.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={32} />
                                <p>Nenhum lead aguardando aprovação</p>
                            </div>
                        ) : (
                            <div className={styles.leadsList}>
                                {approvalLeads.map((lead) => (
                                    <div key={lead.id} className={`${styles.leadItem} ${styles.leadItemWarning}`}>
                                        <div className={styles.leadInfo}>
                                            <span className={styles.leadName}>{lead.name}</span>
                                            <span className={styles.leadPhone}>{lead.phone}</span>
                                            <span className={styles.leadStatus}>
                                                IA: {lead.ai_status}
                                            </span>
                                        </div>
                                        <div className={styles.leadActions}>
                                            <button
                                                className={styles.approveBtn}
                                                onClick={() => handleApprove(lead.id)}
                                            >
                                                <Play size={14} />
                                                Aprovar e Enviar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
}
