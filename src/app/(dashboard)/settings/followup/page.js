'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Save, ToggleLeft, ToggleRight, Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { followupService, pipelineService } from '@/services/api';
import styles from './page.module.css';

// Default follow-up intervals
const ENTRADA_DEFAULTS = [
    { step: 1, delay: 1, label: '1 hora', message: 'Olá {nome}! Vi que você demonstrou interesse em energia solar. Posso te ajudar? 😊' },
    { step: 2, delay: 3, label: '3 horas', message: 'Oi {nome}, ainda está aí? Fico à disposição para tirar suas dúvidas sobre energia solar! ☀️' },
    { step: 3, delay: 24, label: '24 horas', message: '{nome}, passando para lembrar que tenho uma proposta especial esperando por você. Quer saber mais? 📋' },
    { step: 4, delay: 48, label: '48 horas', message: 'Olá {nome}! Não quero ser insistente, mas percebi que você ainda não respondeu. Tudo bem por aí? 🤔' },
    { step: 5, delay: 72, label: '72 horas', message: '{nome}, última tentativa! Se mudar de ideia, é só me chamar. A economia com energia solar pode chegar a 95%! ⚡' },
];

const PROPOSTA_DEFAULTS = [
    { step: 1, delay: 24, label: '24 horas', message: 'Olá {nome}! Conseguiu avaliar a proposta que enviei? Fico à disposição para esclarecer qualquer dúvida! 😊' },
    { step: 2, delay: 72, label: '3 dias', message: '{nome}, passando para saber se você teve tempo de analisar nossa proposta. Posso agendar uma visita técnica para explicar melhor? 📍' },
    { step: 3, delay: 168, label: '7 dias', message: 'Oi {nome}! A proposta ainda está válida. Que tal marcarmos uma conversa para fecharmos negócio? O investimento se paga em poucos anos! 💰' },
];

export default function FollowupSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('entrada');
    const [pipelines, setPipelines] = useState([]);
    const [entradaRules, setEntradaRules] = useState([]);
    const [propostaRules, setPropostaRules] = useState([]);
    const [entradaPipelineId, setEntradaPipelineId] = useState(null);
    const [propostaPipelineId, setPropostaPipelineId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rulesData, pipelinesData] = await Promise.all([
                followupService.getRules(),
                pipelineService.getAll()
            ]);

            setPipelines(pipelinesData);

            // Find Entrada and Proposta pipelines
            const entradaPipeline = pipelinesData.find(p =>
                p.title.toLowerCase().includes('entrada') ||
                p.title.toLowerCase().includes('primeiro contato')
            );
            const propostaPipeline = pipelinesData.find(p =>
                p.title.toLowerCase().includes('proposta')
            );

            if (entradaPipeline) setEntradaPipelineId(entradaPipeline.id);
            if (propostaPipeline) setPropostaPipelineId(propostaPipeline.id);

            // Filter rules by pipeline
            const entradaRulesFiltered = rulesData.filter(r =>
                r.pipeline_id === entradaPipeline?.id
            );
            const propostaRulesFiltered = rulesData.filter(r =>
                r.pipeline_id === propostaPipeline?.id
            );

            // Use existing rules or defaults
            if (entradaRulesFiltered.length > 0) {
                setEntradaRules(entradaRulesFiltered.map(r => ({
                    id: r.id,
                    step: r.step_number,
                    delay: r.delay_hours,
                    message: r.message_template,
                    active: r.active,
                    label: getDelayLabel(r.delay_hours)
                })));
            } else {
                setEntradaRules(ENTRADA_DEFAULTS.map(d => ({ ...d, active: true })));
            }

            if (propostaRulesFiltered.length > 0) {
                setPropostaRules(propostaRulesFiltered.map(r => ({
                    id: r.id,
                    step: r.step_number,
                    delay: r.delay_hours,
                    message: r.message_template,
                    active: r.active,
                    label: getDelayLabel(r.delay_hours)
                })));
            } else {
                setPropostaRules(PROPOSTA_DEFAULTS.map(d => ({ ...d, active: true })));
            }

        } catch (error) {
            console.error('Error loading followup data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDelayLabel = (hours) => {
        if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
        const days = hours / 24;
        return `${days} dia${days > 1 ? 's' : ''}`;
    };

    const handleToggle = (type, index) => {
        if (type === 'entrada') {
            setEntradaRules(prev => prev.map((r, i) =>
                i === index ? { ...r, active: !r.active } : r
            ));
        } else {
            setPropostaRules(prev => prev.map((r, i) =>
                i === index ? { ...r, active: !r.active } : r
            ));
        }
    };

    const handleMessageChange = (type, index, value) => {
        if (type === 'entrada') {
            setEntradaRules(prev => prev.map((r, i) =>
                i === index ? { ...r, message: value } : r
            ));
        } else {
            setPropostaRules(prev => prev.map((r, i) =>
                i === index ? { ...r, message: value } : r
            ));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save Entrada rules
            if (entradaPipelineId) {
                for (const rule of entradaRules) {
                    const data = {
                        pipeline_id: entradaPipelineId,
                        step_number: rule.step,
                        delay_hours: rule.delay,
                        message_template: rule.message,
                        active: rule.active
                    };

                    if (rule.id) {
                        await followupService.updateRule(rule.id, data);
                    } else {
                        const created = await followupService.createRule(data);
                        rule.id = created.id;
                    }
                }
            }

            // Save Proposta rules
            if (propostaPipelineId) {
                for (const rule of propostaRules) {
                    const data = {
                        pipeline_id: propostaPipelineId,
                        step_number: rule.step,
                        delay_hours: rule.delay,
                        message_template: rule.message,
                        active: rule.active
                    };

                    if (rule.id) {
                        await followupService.updateRule(rule.id, data);
                    } else {
                        const created = await followupService.createRule(data);
                        rule.id = created.id;
                    }
                }
            }

            alert('✅ Configurações de follow-up salvas com sucesso!');
        } catch (error) {
            console.error('Error saving rules:', error);
            alert('❌ Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const rules = activeTab === 'entrada' ? entradaRules : propostaRules;
    const type = activeTab;

    if (loading) {
        return (
            <>
                <Header title="Configuração de Follow-up" />
                <div className={styles.container}>
                    <div className={styles.loading}>Carregando...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Configuração de Follow-up" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <RefreshCw size={28} className={styles.titleIcon} />
                        <div>
                            <h1 className={styles.title}>Follow-up Automático</h1>
                            <p className={styles.subtitle}>
                                Configure as mensagens automáticas para leads que não respondem
                            </p>
                        </div>
                    </div>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Salvando...' : 'Salvar Tudo'}
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'entrada' ? styles.active : ''}`}
                        onClick={() => setActiveTab('entrada')}
                    >
                        📥 Leads de Entrada
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'proposta' ? styles.active : ''}`}
                        onClick={() => setActiveTab('proposta')}
                    >
                        📋 Proposta Enviada
                    </button>
                </div>

                {/* Info Box */}
                <div className={styles.infoBox}>
                    {activeTab === 'entrada' ? (
                        <>
                            <strong>📥 Leads de Entrada / Primeiro Contato</strong>
                            <p>Mensagens enviadas automaticamente quando o lead <strong>não responde</strong> às mensagens iniciais da IA.</p>
                            <p>O follow-up para quando o lead <strong>responder qualquer mensagem</strong>.</p>
                        </>
                    ) : (
                        <>
                            <strong>📋 Proposta Enviada</strong>
                            <p>Mensagens enviadas automaticamente quando o lead recebe a proposta e <strong>não interage</strong>.</p>
                            <p>Use mensagens mais suaves para não parecer cobrança.</p>
                        </>
                    )}
                </div>

                {/* Rules List */}
                <div className={styles.rulesList}>
                    {rules.map((rule, index) => (
                        <div key={index} className={`${styles.ruleCard} ${!rule.active ? styles.disabled : ''}`}>
                            <div className={styles.ruleHeader}>
                                <div className={styles.ruleInfo}>
                                    <Clock size={16} />
                                    <span className={styles.ruleStep}>Mensagem {rule.step}</span>
                                    <span className={styles.ruleDelay}>após {rule.label}</span>
                                </div>
                                <button
                                    className={`${styles.toggleBtn} ${rule.active ? styles.active : ''}`}
                                    onClick={() => handleToggle(type, index)}
                                >
                                    {rule.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                            </div>
                            <div className={styles.ruleBody}>
                                <label className={styles.label}>
                                    <MessageSquare size={14} />
                                    Mensagem (use {'{nome}'} para nome do lead)
                                </label>
                                <textarea
                                    value={rule.message}
                                    onChange={(e) => handleMessageChange(type, index, e.target.value)}
                                    className={styles.textarea}
                                    rows={3}
                                    disabled={!rule.active}
                                    placeholder="Digite a mensagem de follow-up..."
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Variable Help */}
                <div className={styles.helpBox}>
                    <strong>📝 Variáveis disponíveis:</strong>
                    <div className={styles.variables}>
                        <code>{'{nome}'}</code> - Nome do lead
                        <code>{'{valor}'}</code> - Valor da proposta
                    </div>
                </div>
            </div>
        </>
    );
}
