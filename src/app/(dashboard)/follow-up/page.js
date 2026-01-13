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

    ChevronUp,
    History
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
    const [history, setHistory] = useState([]); // New History State
    const [loadingLeads, setLoadingLeads] = useState(false);

    // Rules state
    const [pipelines, setPipelines] = useState([]);
    const [rules, setRules] = useState([]);
    const [expandedPipelines, setExpandedPipelines] = useState({});
    const [newRuleValues, setNewRuleValues] = useState({}); // { [pipelineId]: { delay: 24, message: '' } }
    const [showPropostaRules, setShowPropostaRules] = useState(false);
    const [entradaPipelineId, setEntradaPipelineId] = useState(null);
    const [propostaPipelineId, setPropostaPipelineId] = useState(null);

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
            const [pending, approval, historyData] = await Promise.all([
                followupService.getPending(),
                followupService.getApproval(),
                followupService.getHistory() // Fetch History
            ]);
            setPendingLeads(pending || []);
            setApprovalLeads(approval || []);
            setHistory(historyData || []);
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

            // Find Entrada and Proposta pipelines
            const entradaPipeline = fetchedPipelines.find(p =>
                p.title.toLowerCase().includes('entrada') ||
                p.title.toLowerCase().includes('primeiro contato')
            );
            const propostaPipeline = fetchedPipelines.find(p =>
                p.title.toLowerCase().includes('proposta')
            );

            if (entradaPipeline) setEntradaPipelineId(entradaPipeline.id);
            if (propostaPipeline) setPropostaPipelineId(propostaPipeline.id);
        } catch (err) {
            console.error('Error loading rules:', err);
        }
    };

    // Filter rules by current tab
    const filteredRules = rules.filter(r => {
        if (showPropostaRules) {
            return r.pipeline_id === propostaPipelineId;
        }
        return r.pipeline_id === entradaPipelineId;
    });

    // Filter leads by current tab
    const filterLeadsByTab = (leadsList) => {
        return leadsList.filter(l => {
            if (showPropostaRules) {
                return l.pipeline_id === propostaPipelineId;
            }
            // Match Entrada ID or fallback to "not Proposta" if strictly binary? 
            // Better to match Entrada EXACTLY to avoid confusing other pipelines.
            // But valid leads might be in "Qualificação".
            // For now, match entradaPipelineId exactly.
            return l.pipeline_id === entradaPipelineId;
        });
    };

    const filteredPendingLeads = filterLeadsByTab(pendingLeads);
    const filteredApprovalLeads = filterLeadsByTab(approvalLeads);

    // Format delay for display
    const formatDelay = (hours) => {
        if (hours < 1) return `${Math.round(hours * 60)} min`;
        if (hours < 24) return `${hours}h`;
        const days = hours / 24;
        return `${days} dia${days > 1 ? 's' : ''}`;
    };

    // Add rule for specific type
    const handleAddRuleForType = async (type) => {
        const pipelineId = type === 'proposta' ? propostaPipelineId : entradaPipelineId;
        if (!pipelineId) {
            alert(`Erro: Pipeline de ${type === 'proposta' ? 'Proposta Enviada' : 'Entrada'} não encontrado.`);
            return;
        }

        const values = newRuleValues['default'] || { delayValue: 1, delayUnit: 'hours', message: '' };

        // Convert to hours
        let delayHours = Number(values.delayValue || 1);
        if (values.delayUnit === 'minutes') {
            delayHours = delayHours / 60;
        } else if (values.delayUnit === 'days') {
            delayHours = delayHours * 24;
        }

        // Calculate next step number for this pipeline
        const pipelineRules = rules.filter(r => r.pipeline_id === pipelineId);
        const nextStep = pipelineRules.length + 1;

        try {
            const newRule = await followupService.createRule({
                pipeline_id: pipelineId,
                step_number: nextStep,
                delay_hours: delayHours,
                message_template: values.message || `Olá {nome}, tudo bem?`
            });

            setRules([...rules, newRule]);
            setNewRuleValues(prev => ({
                ...prev,
                ['default']: { delayValue: '', delayUnit: 'hours', message: '' }
            }));
        } catch (err) {
            console.error('Error creating rule:', err);
            alert('Erro ao criar regra: ' + (err.response?.data?.error || err.message));
        }
    };

    // Update rule message in local state
    const handleUpdateRuleMessage = (ruleId, newMessage) => {
        setRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, message_template: newMessage } : rule
        ));
    };

    // Save all rules to backend
    const handleSaveAllRules = async () => {
        setSaving(true);
        try {
            for (const rule of rules) {
                await followupService.updateRule(rule.id, {
                    message_template: rule.message_template
                });
            }
            alert('✅ Todas as regras foram salvas com sucesso!');
        } catch (err) {
            console.error('Error saving rules:', err);
            alert('❌ Erro ao salvar regras: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePipeline = (id) => {
        setExpandedPipelines(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddRule = async (pipelineId, valuesKey = null) => {
        const key = valuesKey || pipelineId;
        const values = newRuleValues[key] || { delayValue: 1, delayUnit: 'hours', message: '' };

        // Convert to hours (backend expects hours)
        let delayHours = Number(values.delayValue || 1);
        if (values.delayUnit === 'minutes') {
            delayHours = delayHours / 60; // Convert minutes to hours
        }

        // Calculate next step number
        const nextStep = rules.length + 1;

        try {
            const newRule = await followupService.createRule({
                pipeline_id: pipelineId,
                step_number: nextStep,
                delay_hours: delayHours,
                message_template: values.message || `Olá {nome}, tudo bem?`
            });

            setRules([...rules, newRule]);
            setNewRuleValues(prev => ({
                ...prev,
                [key]: { delayValue: '', delayUnit: 'hours', message: '' }
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

                    {/* Rules Configuration with Tabs */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <div className={styles.cardHeader}>
                            <Users size={20} />
                            <h2>Régua de Follow-up Automático</h2>
                        </div>

                        {/* Tabs for Entrada and Proposta */}
                        <div className={styles.followupTabs}>
                            <button
                                className={`${styles.followupTab} ${!showPropostaRules ? styles.active : ''}`}
                                onClick={() => setShowPropostaRules(false)}
                            >
                                📥 Leads de Entrada / Primeiro Contato
                            </button>
                            <button
                                className={`${styles.followupTab} ${showPropostaRules ? styles.active : ''}`}
                                onClick={() => setShowPropostaRules(true)}
                            >
                                📋 Proposta Enviada
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className={styles.followupInfo}>
                            {!showPropostaRules ? (
                                <>
                                    <strong>📥 Leads de Entrada / Primeiro Contato</strong>
                                    <p>Mensagens enviadas automaticamente quando o lead <strong>não responde</strong> às mensagens iniciais da IA.</p>
                                    <p>O follow-up para quando o lead <strong>responder qualquer mensagem</strong>.</p>
                                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
                                        💡 <strong>Dica:</strong> Comece com intervalos curtos (1h, 3h) e depois mais longos (24h, 48h, 72h).
                                    </p>
                                </>
                            ) : (
                                <>
                                    <strong>📋 Proposta Enviada</strong>
                                    <p>Mensagens enviadas automaticamente quando o lead recebe a proposta e <strong>não interage</strong>.</p>
                                    <p>Use mensagens mais suaves para não parecer cobrança. O objetivo é agendar uma visita técnica.</p>
                                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
                                        💡 <strong>Dica:</strong> Intervalos mais longos aqui (24h, 3 dias, 7 dias).
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Rules List - Editable Cards */}
                        <div className={styles.rulesList}>
                            {filteredRules.length > 0 ? (
                                filteredRules
                                    .sort((a, b) => a.step_number - b.step_number)
                                    .map(rule => (
                                        <div key={rule.id} className={styles.ruleCard}>
                                            <div className={styles.ruleCardHeader}>
                                                <div className={styles.ruleCardInfo}>
                                                    <Clock size={18} />
                                                    <span className={styles.ruleCardStep}>
                                                        Mensagem {rule.step_number}
                                                    </span>
                                                    <span className={styles.ruleCardDelay}>
                                                        após {formatDelay(rule.delay_hours)}
                                                    </span>
                                                </div>
                                                <button
                                                    className={styles.deleteRuleBtn}
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    title="Excluir regra"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            <div className={styles.ruleCardBody}>
                                                <label className={styles.ruleCardLabel}>
                                                    <MessageSquare size={16} />
                                                    Texto da mensagem (use <code>{'{nome}'}</code> para nome do lead)
                                                </label>
                                                <textarea
                                                    className={styles.ruleCardTextarea}
                                                    value={rule.message_template}
                                                    onChange={(e) => handleUpdateRuleMessage(rule.id, e.target.value)}
                                                    rows={3}
                                                    placeholder="Digite sua mensagem aqui..."
                                                />
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className={styles.emptyRules}>
                                    <AlertCircle size={32} />
                                    <p>Nenhuma regra configurada para {showPropostaRules ? 'Proposta Enviada' : 'Entrada'}.</p>
                                    <p>Adicione uma nova regra abaixo! 👇</p>
                                </div>
                            )}
                        </div>

                        {/* Add Rule Form */}
                        <div className={styles.addRuleSection}>
                            <h4 className={styles.addRuleTitle}>
                                <Plus size={20} />
                                Adicionar Nova Regra
                            </h4>

                            <div className={styles.addRuleForm}>
                                <div className={styles.addRuleDelay}>
                                    <label>⏱️ Enviar após:</label>
                                    <div className={styles.delayInputs}>
                                        <input
                                            type="number"
                                            placeholder="Ex: 1"
                                            min="1"
                                            value={newRuleValues['default']?.delayValue || ''}
                                            onChange={(e) => handleNewRuleChange('default', 'delayValue', e.target.value)}
                                            className={styles.delayNumber}
                                        />
                                        <select
                                            value={newRuleValues['default']?.delayUnit || 'hours'}
                                            onChange={(e) => handleNewRuleChange('default', 'delayUnit', e.target.value)}
                                            className={styles.delayUnit}
                                        >
                                            <option value="minutes">Minutos</option>
                                            <option value="hours">Horas</option>
                                            <option value="days">Dias</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.addRuleMessage}>
                                    <label>💬 Mensagem:</label>
                                    <textarea
                                        placeholder="Ex: Oi {nome}, ainda tem interesse em energia solar? 😊"
                                        value={newRuleValues['default']?.message || ''}
                                        onChange={(e) => handleNewRuleChange('default', 'message', e.target.value)}
                                        className={styles.addRuleTextarea}
                                        rows={2}
                                    />
                                </div>

                                <button
                                    onClick={() => handleAddRuleForType(showPropostaRules ? 'proposta' : 'entrada')}
                                    className={styles.addRuleButton}
                                >
                                    <Plus size={20} />
                                    Adicionar Regra
                                </button>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className={styles.saveRulesSection}>
                            <button
                                className={styles.saveRulesBtn}
                                onClick={handleSaveAllRules}
                                disabled={saving}
                            >
                                <Save size={20} />
                                {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
                            </button>
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
                            <span className={styles.badge}>{filteredPendingLeads.length}</span>
                        </div>

                        {filteredPendingLeads.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={32} />
                                <p>Nenhum lead aguardando follow-up</p>
                            </div>
                        ) : (
                            <div className={styles.leadsList}>
                                {filteredPendingLeads.map((lead) => (
                                    <div key={lead.id} className={styles.leadItem}>
                                        <div className={styles.leadInfo}>
                                            <span className={styles.leadName}>{lead.name}</span>
                                            <span className={styles.leadPhone}>{lead.phone}</span>
                                            <span className={styles.leadDate}>
                                                Última interação: {formatDate(lead.last_interaction_at)}
                                            </span>
                                            {lead.pipeline && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 6px',
                                                    background: '#f1f5f9',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    color: '#64748b',
                                                    marginTop: '4px',
                                                    width: 'fit-content'
                                                }}>
                                                    {lead.pipeline.title}
                                                </span>
                                            )}
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
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>{filteredApprovalLeads.length}</span>
                        </div>
                        <p className={styles.cardDescription}>
                            Leads com IA pausada que precisam de follow-up.
                        </p>

                        {filteredApprovalLeads.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={32} />
                                <p>Nenhum lead aguardando aprovação nesta etapa</p>
                            </div>
                        ) : (
                            <div className={styles.leadsList}>
                                {filteredApprovalLeads.map((lead) => (
                                    <div key={lead.id} className={`${styles.leadItem} ${styles.leadItemWarning}`}>
                                        <div className={styles.leadInfo}>
                                            <span className={styles.leadName}>{lead.name}</span>
                                            <span className={styles.leadPhone}>{lead.phone}</span>
                                            <span className={styles.leadStatus}>
                                                IA: {lead.ai_status}
                                            </span>
                                            {lead.pipeline && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 6px',
                                                    background: '#fff7ed',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    color: '#c2410c',
                                                    marginTop: '4px',
                                                    width: 'fit-content',
                                                    border: '1px solid #fed7aa'
                                                }}>
                                                    {lead.pipeline.title}
                                                </span>
                                            )}
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
                    <motion.div
                        className={styles.leadsCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{ gridColumn: '1 / -1', marginTop: '2rem' }}
                    >
                        <div className={styles.cardHeader}>
                            <History size={20} />
                            <h2>Histórico de Disparos Recentes</h2>
                            <span className={styles.badge}>{history.length}</span>
                        </div>

                        {history.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Nenhum disparo registrado ainda.</p>
                            </div>
                        ) : (
                            <div className={styles.listContainer} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                            <th style={{ padding: '8px' }}>Lead</th>
                                            <th style={{ padding: '8px' }}>Mensagem</th>
                                            <th style={{ padding: '8px' }}>Horário</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(msg => (
                                            <tr key={msg.id} style={{ borderBottom: '1px solid #f9f9f9', fontSize: '0.9rem' }}>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <strong>{msg.lead ? msg.lead.name : 'Desconhecido'}</strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{msg.lead?.phone}</div>
                                                    {msg.lead?.pipeline && (
                                                        <span style={{
                                                            display: 'inline-block',
                                                            fontSize: '0.7rem',
                                                            padding: '1px 5px',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#e2e8f0',
                                                            color: '#475569',
                                                            marginTop: '2px'
                                                        }}>
                                                            {msg.lead.pipeline.title}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 8px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {msg.content}
                                                </td>
                                                <td style={{ padding: '12px 8px', color: '#666' }}>
                                                    {new Date(msg.timestamp).toLocaleString('pt-BR')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
}
