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
    Settings,
    Trash2,
    Plus,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { systemSettingsService, followupService, leadService, pipelineService } from '@/services/api';
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
    const [systemPrompt, setSystemPrompt] = useState('');

    // Leads state
    const [pendingLeads, setPendingLeads] = useState([]);
    const [approvalLeads, setApprovalLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);

    // Rules state
    const [pipelines, setPipelines] = useState([]);
    const [rules, setRules] = useState([]);
    const [expandedPipelines, setExpandedPipelines] = useState({});
    const [newRuleValues, setNewRuleValues] = useState({}); // { [pipelineId]: { delay: 24, message: '' } }

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([loadSettings(), loadLeads(), loadRulesAndPipelines()]);
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
            if (settings.openai_system_prompt) {
                setSystemPrompt(settings.openai_system_prompt.value || '');
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

    const loadRulesAndPipelines = async () => {
        try {
            const [fetchedPipelines, fetchedRules] = await Promise.all([
                pipelineService.getAll(),
                followupService.getRules()
            ]);
            setPipelines(fetchedPipelines || []);
            setRules(fetchedRules || []);
        } catch (err) {
            console.error('Error loading rules:', err);
        }
    };

    const togglePipeline = (id) => {
        setExpandedPipelines(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddRule = async (pipelineId, valuesKey = null) => {
        const key = valuesKey || pipelineId;
        const values = newRuleValues[key] || { delay: 1, message: '' };

        // Calculate next step number based on all rules (for first pipeline)
        const nextStep = rules.length + 1;

        try {
            const newRule = await followupService.createRule({
                pipeline_id: pipelineId,
                step_number: nextStep,
                delay_hours: Number(values.delay || 1),
                message_template: values.message || `Olá {nome}, tudo bem?`
            });

            setRules([...rules, newRule]);
            setNewRuleValues(prev => ({
                ...prev,
                [key]: { delay: '', message: '' }
            }));
        } catch (err) {
            console.error('Error creating rule:', err);
            alert('Erro ao criar regra: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta regra?')) return;
        try {
            await followupService.deleteRule(id);
            setRules(rules.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting rule:', err);
            alert('Erro ao excluir regra');
        }
    };

    const handleNewRuleChange = (pipelineId, field, value) => {
        setNewRuleValues(prev => ({
            ...prev,
            [pipelineId]: {
                ...prev[pipelineId],
                [field]: value
            }
        }));
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
                openai_system_prompt: systemPrompt,
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

                    {/* System Prompt Editor */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <div className={styles.cardHeader}>
                            <Settings size={20} />
                            <h2>Script da IA (Prompt do Sistema)</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Este é o script que a Sol (IA) segue para atender os leads. Modifique conforme necessário.
                        </p>
                        <textarea
                            className={styles.textarea}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Você é a Sol, consultora em redução de custos de energia..."
                            rows={15}
                            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                    </motion.div>

                    {/* Rules Configuration */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <div className={styles.cardHeader}>
                            <Users size={20} />
                            <h2>Régua de Follow-up (Primeiro Contato)</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Configure a sequência de mensagens automáticas para leads que <strong>não responderam</strong>.<br />
                            <small style={{ color: '#888' }}>Ex: 1 hora após silêncio → 3 horas → 24 horas. Aplica-se apenas ao funil "Primeiro Contato".</small>
                        </p>

                        {/* Simple Rules List & Add Form */}
                        <div className={styles.pipelineRules}>
                            {/* Existing Rules Table */}
                            <table className={styles.rulesTable}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Delay</th>
                                        <th>Mensagem</th>
                                        <th style={{ width: 50 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.length > 0 ? rules
                                        .sort((a, b) => a.step_number - b.step_number)
                                        .map(rule => (
                                            <tr key={rule.id}>
                                                <td>#{rule.step_number}</td>
                                                <td>{rule.delay_hours}h</td>
                                                <td className={styles.msgPreview}>{rule.message_template}</td>
                                                <td>
                                                    <button
                                                        className={styles.iconBtn}
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                                                Nenhuma regra configurada. Adicione abaixo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Add Rule Form */}
                            <div className={styles.addRuleForm} style={{ marginTop: '20px', padding: '16px', background: 'rgba(67, 24, 255, 0.05)', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                                    <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Adicionar Nova Regra
                                </h4>
                                <div className={styles.inputGroupRow}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.75rem', color: '#888' }}>Delay (horas)</label>
                                        <input
                                            type="number"
                                            placeholder="Ex: 1"
                                            min="0.5"
                                            step="0.5"
                                            className={styles.inputSmall}
                                            value={newRuleValues['default']?.delay || ''}
                                            onChange={(e) => handleNewRuleChange('default', 'delay', e.target.value)}
                                            style={{ width: '100px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: '#888' }}>Mensagem (use {'{nome}'} para nome do lead)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Oi {nome}, vi que começamos seu atendimento..."
                                            className={styles.inputFlex}
                                            value={newRuleValues['default']?.message || ''}
                                            onChange={(e) => handleNewRuleChange('default', 'message', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className={styles.addBtn}
                                        onClick={() => {
                                            const firstPipeline = pipelines[0];
                                            if (firstPipeline) {
                                                handleAddRule(firstPipeline.id, 'default');
                                            } else {
                                                alert('Erro: Nenhum pipeline encontrado. Verifique as configurações do Kanban.');
                                            }
                                        }}
                                        style={{ alignSelf: 'flex-end', padding: '10px 20px' }}
                                    >
                                        <Plus size={18} /> Adicionar Regra
                                    </button>
                                </div>
                            </div>
                        </div>
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
