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

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [monthlyGoal, setMonthlyGoal] = useState({ target: 50000, current: 0 });

    // Meta Sync State
    const [metaSyncing, setMetaSyncing] = useState(false);
    const [metaSyncResult, setMetaSyncResult] = useState(null);
    const [metaPageId, setMetaPageId] = useState('');

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

    const handleMetaSync = async () => {
        if (!metaPageId) {
            alert('Por favor, informe o Page ID do Facebook');
            return;
        }

        setMetaSyncing(true);
        setMetaSyncResult(null);

        try {
            const response = await api.post('/webhook/meta/sync', {
                page_id: metaPageId,
                limit: 100,
            });

            setMetaSyncResult({
                success: true,
                imported: response.data.imported_count,
                skipped: response.data.skipped_count,
                total: response.data.total_found,
            });
        } catch (err) {
            setMetaSyncResult({
                success: false,
                error: err.response?.data?.error || 'Erro ao sincronizar',
            });
        } finally {
            setMetaSyncing(false);
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

                        <button
                            onClick={handleMetaSync}
                            disabled={metaSyncing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '14px 24px',
                                background: metaSyncing ? '#ccc' : 'linear-gradient(135deg, #1877F2, #0866FF)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: metaSyncing ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
                            }}
                        >
                            {metaSyncing ? (
                                <>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                    Buscando leads no Facebook...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={18} />
                                    Sincronizar Leads do Facebook
                                </>
                            )}
                        </button>

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
                                        ✅ <strong>{metaSyncResult.imported}</strong> leads importados e contatados pela IA!
                                        {metaSyncResult.skipped > 0 && (
                                            <span style={{ opacity: 0.7 }}> ({metaSyncResult.skipped} já existiam)</span>
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
