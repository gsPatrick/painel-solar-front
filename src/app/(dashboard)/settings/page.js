'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    Save,
    Check,
    Target,
    RefreshCw,
    Facebook,
    Loader2
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { useTheme } from '@/contexts/ThemeContext';
import { settingsService } from '@/services/api';
import api from '@/services/api';
import styles from './page.module.css';

export default function SettingsPage() {
    const {
        settings: globalSettings,
        updateSettings
    } = useTheme();

    const formatDate = (isoString) => {
        if (!isoString) return '';
        // Fix: Parse manually to avoid timezone shift (YYYY-MM-DD -> UTC Midnight -> Previous Day in Local)
        const [year, month, day] = isoString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // Local midnight

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset times for accurate comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) return 'Hoje';
        if (date.getTime() === yesterday.getTime()) return 'Ontem';
        return date.toLocaleDateString('pt-BR');
    };

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [monthlyGoal, setMonthlyGoal] = useState({ target: 50000, current: 0 });

    // Meta Sync State
    const [metaSyncing, setMetaSyncing] = useState(false);
    const [metaSyncResult, setMetaSyncResult] = useState(null);
    const [metaPageId, setMetaPageId] = useState('534745156397254'); // DGE Energia Alternativa
    const [metaPreviewData, setMetaPreviewData] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState([]);

    const [localSettings, setLocalSettings] = useState({
        notifyOverdue: true,
        notifySla: true,
        notifyNewLead: true,
        ...globalSettings
    });

    useEffect(() => {
        setLocalSettings(prev => ({ ...prev, ...globalSettings }));
        loadMonthlyGoal();
    }, [globalSettings]);

    const loadMonthlyGoal = async () => {
        try {
            const goal = await settingsService.getMonthlyGoal();
            setMonthlyGoal(goal);
        } catch (error) {
            console.log('Using default monthly goal');
        }
    };

    const handleMetaPreview = async () => {
        if (!metaPageId) {
            alert('Por favor, informe o Page ID do Facebook');
            return;
        }

        setMetaSyncing(true);
        setMetaPreviewData(null);
        setMetaSyncResult(null);

        try {
            const { data } = await api.post('/webhook/meta/preview', {
                page_id: metaPageId,
                limit: 100,
            });

            setMetaPreviewData(data);

            // Auto-select all NEW leads
            const newIds = [];
            Object.values(data.grouped_leads).flat().forEach(lead => {
                if (lead.status === 'new') newIds.push(lead.id);
            });
            setSelectedLeads(newIds);

        } catch (err) {
            setMetaSyncResult({
                success: false,
                error: err.response?.data?.error || 'Erro ao buscar leads',
            });
        } finally {
            setMetaSyncing(false);
        }
    };

    const handleMetaSync = async () => {
        if (selectedLeads.length === 0) {
            alert('Selecione pelo menos um lead para sincronizar.');
            return;
        }

        setMetaSyncing(true);
        setMetaSyncResult(null);

        try {
            const response = await api.post('/webhook/meta/sync', {
                page_id: metaPageId,
                selected_ids: selectedLeads,
                limit: 100,
            });

            setMetaSyncResult({
                success: true,
                imported: response.data.imported_count,
                skipped: response.data.skipped_count,
                total: response.data.total_found,
                queued: response.data.queued_for_message,
                estimatedTime: response.data.queue_status?.estimatedTimeMinutes
            });

            // Clear preview after successful sync
            setMetaPreviewData(null);

        } catch (err) {
            setMetaSyncResult({
                success: false,
                error: err.response?.data?.error || 'Erro ao sincronizar',
            });
        } finally {
            setMetaSyncing(false);
        }
    };

    const toggleLeadSelection = (id) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleGroupSelection = (leads) => {
        const ids = leads.map(l => l.id);
        const allSelected = ids.every(id => selectedLeads.includes(id));

        if (allSelected) {
            setSelectedLeads(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedLeads(prev => [...new Set([...prev, ...ids])]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save to global context (which saves to localStorage)
            updateSettings(localSettings);

            // Save monthly goal to API
            await settingsService.updateMonthlyGoal(monthlyGoal.target, monthlyGoal.current);

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header title="Configurações" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Configurações</h1>
                    <p className={styles.subtitle}>Personalize o sistema conforme suas preferências</p>
                </div>



                {/* Monthly Goal */}
                <motion.div
                    className={styles.section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.sectionHeader}>
                        <div className={`${styles.sectionIcon} ${styles.success}`}>
                            <Target size={22} />
                        </div>
                        <div>
                            <h2 className={styles.sectionTitle}>Meta Mensal</h2>
                            <p className={styles.sectionSubtitle}>Defina sua meta de vendas</p>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Meta (R$)</label>
                            <input
                                type="number"
                                value={monthlyGoal.target}
                                onChange={(e) => setMonthlyGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                className={styles.input}
                                min="0"
                                step="1000"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Vendas Atuais (R$)</label>
                            <input
                                type="number"
                                value={monthlyGoal.current}
                                onChange={(e) => setMonthlyGoal(prev => ({ ...prev, current: parseInt(e.target.value) || 0 }))}
                                className={styles.input}
                                min="0"
                                step="1000"
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <div className={styles.progressInfo}>
                                <span>Progresso: {monthlyGoal.target > 0 ? Math.round((monthlyGoal.current / monthlyGoal.target) * 100) : 0}%</span>
                                <span>R$ {monthlyGoal.current.toLocaleString('pt-BR')} / R$ {monthlyGoal.target.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${Math.min((monthlyGoal.current / monthlyGoal.target) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    className={styles.section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.sectionHeader}>
                        <div className={`${styles.sectionIcon} ${styles.warning}`}>
                            <Bell size={22} />
                        </div>
                        <div>
                            <h2 className={styles.sectionTitle}>Notificações</h2>
                            <p className={styles.sectionSubtitle}>Configure os alertas do sistema</p>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <div className={styles.toggle}>
                                <div className={styles.toggleInfo}>
                                    <span className={styles.toggleLabel}>Tarefas Atrasadas</span>
                                    <span className={styles.toggleHint}>Receba alertas sobre tarefas vencidas</span>
                                </div>
                                <button
                                    className={`${styles.toggleSwitch} ${localSettings.notifyOverdue ? styles.active : ''}`}
                                    onClick={() => setLocalSettings(prev => ({ ...prev, notifyOverdue: !prev.notifyOverdue }))}
                                />
                            </div>
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <div className={styles.toggle}>
                                <div className={styles.toggleInfo}>
                                    <span className={styles.toggleLabel}>SLA Estourado</span>
                                    <span className={styles.toggleHint}>Alerta quando leads passam 3 dias sem interação</span>
                                </div>
                                <button
                                    className={`${styles.toggleSwitch} ${localSettings.notifySla ? styles.active : ''}`}
                                    onClick={() => setLocalSettings(prev => ({ ...prev, notifySla: !prev.notifySla }))}
                                />
                            </div>
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <div className={styles.toggle}>
                                <div className={styles.toggleInfo}>
                                    <span className={styles.toggleLabel}>Novos Leads</span>
                                    <span className={styles.toggleHint}>Notificação quando novos leads chegarem</span>
                                </div>
                                <button
                                    className={`${styles.toggleSwitch} ${localSettings.notifyNewLead ? styles.active : ''}`}
                                    onClick={() => setLocalSettings(prev => ({ ...prev, notifyNewLead: !prev.notifyNewLead }))}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Meta Integration Section */}
                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.cardHeader}>
                        <Facebook className={styles.cardIcon} style={{ color: '#1877F2' }} />
                        <h2>Integração Meta (Facebook/Instagram)</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                            Sincronize leads antigos dos formulários do Facebook que chegaram antes da integração com o webhook.
                        </p>

                        <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>
                                Page ID do Facebook
                            </label>
                            <input
                                type="text"
                                value={metaPageId}
                                onChange={(e) => setMetaPageId(e.target.value)}
                                placeholder="Ex: 123456789012345"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'var(--color-bg-input)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '10px',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '0.95rem',
                                }}
                            />
                            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                Encontre no Meta Business Suite → Configurações da Página → ID da Página
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                            <button
                                onClick={handleMetaPreview}
                                disabled={metaSyncing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 24px',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '10px',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    cursor: metaSyncing ? 'not-allowed' : 'pointer',
                                    opacity: metaSyncing ? 0.7 : 1,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {metaSyncing && !metaPreviewData ? (
                                    <Loader2 size={18} className={styles.spin} />
                                ) : (
                                    <>
                                        <RefreshCw size={18} />
                                        Buscar Leads
                                    </>
                                )}
                            </button>

                            {metaPreviewData && (
                                <button
                                    onClick={handleMetaSync}
                                    disabled={metaSyncing || selectedLeads.length === 0}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 24px',
                                        background: '#22C55E', // Green for action
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        cursor: (metaSyncing || selectedLeads.length === 0) ? 'not-allowed' : 'pointer',
                                        opacity: (metaSyncing || selectedLeads.length === 0) ? 0.7 : 1,
                                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
                                    }}
                                >
                                    {metaSyncing ? (
                                        <Loader2 size={18} className={styles.spin} />
                                    ) : (
                                        <>
                                            🚀 Sincronizar ({selectedLeads.length})
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* List of Leads */}
                        {metaPreviewData && !metaSyncResult?.success && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    marginBottom: '20px',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--color-border)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        <strong>{metaPreviewData.stats.found}</strong> encontrados
                                    </span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <span style={{ color: '#22C55E' }}><strong>{metaPreviewData.stats.new}</strong> novos</span>
                                        <span style={{ opacity: 0.6 }}>{metaPreviewData.stats.exists} existentes</span>
                                    </div>
                                </div>

                                {Object.entries(metaPreviewData.grouped_leads).map(([date, leads]) => (
                                    <div key={date} style={{ marginBottom: '15px' }}>
                                        <div
                                            style={{
                                                fontSize: '0.85rem',
                                                textTransform: 'uppercase',
                                                color: 'var(--color-text-secondary)',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                            onClick={() => toggleGroupSelection(leads)}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px',
                                                borderRadius: '4px',
                                                border: '2px solid var(--color-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: leads.every(l => selectedLeads.includes(l.id)) ? '#22C55E' : 'transparent',
                                                borderColor: leads.every(l => selectedLeads.includes(l.id)) ? '#22C55E' : 'var(--color-border)'
                                            }}>
                                                {leads.every(l => selectedLeads.includes(l.id)) && <Check size={12} color="white" />}
                                            </div>
                                            {formatDate(date)} ({leads.length})
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {leads.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    onClick={() => toggleLeadSelection(lead.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px 12px',
                                                        background: 'var(--color-bg-primary)',
                                                        borderRadius: '8px',
                                                        opacity: lead.status === 'exists' ? 0.6 : 1,
                                                        border: selectedLeads.includes(lead.id) ? '1px solid #22C55E' : '1px solid transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '18px', height: '18px',
                                                        borderRadius: '4px',
                                                        border: '2px solid var(--color-border)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: selectedLeads.includes(lead.id) ? '#22C55E' : 'transparent',
                                                        borderColor: selectedLeads.includes(lead.id) ? '#22C55E' : 'var(--color-border)'
                                                    }}>
                                                        {selectedLeads.includes(lead.id) && <Check size={12} color="white" />}
                                                    </div>

                                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                                                            Lead do Facebook <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>#{lead.id.substr(-4)}</span>
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                                                {new Date(lead.created_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {lead.status === 'exists' && (
                                                                <span style={{ fontSize: '0.7rem', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                                                                    Já existe
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {metaSyncResult && (
                            <div
                                style={{
                                    marginTop: '16px',
                                    padding: '14px 18px',
                                    background: metaSyncResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${metaSyncResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    borderRadius: '10px',
                                    color: metaSyncResult.success ? '#22C55E' : '#EF4444',
                                }}
                            >
                                {metaSyncResult.success ? (
                                    <>
                                        <div>✅ <strong>{metaSyncResult.imported}</strong> leads processados!</div>
                                        {metaSyncResult.queued > 0 && (
                                            <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                                                📬 <strong>{metaSyncResult.queued}</strong> mensagens na fila de envio.
                                                <br />
                                                <span style={{ opacity: 0.85 }}>
                                                    ⏱️ Tempo estimado: ~{metaSyncResult.estimatedTime} min (envio gradual para segurança).
                                                </span>
                                            </div>
                                        )}
                                        {metaSyncResult.skipped > 0 && (
                                            <div style={{ marginTop: '4px', fontSize: '0.85rem', opacity: 0.7 }}>
                                                ({metaSyncResult.skipped} já existiam/sem telefone)
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>❌ {metaSyncResult.error}</>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : saved ? (
                            <>
                                <Check size={16} />
                                Salvo!
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
