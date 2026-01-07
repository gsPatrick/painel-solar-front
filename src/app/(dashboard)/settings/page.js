'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Palette,
    Bell,
    Save,
    Check,
    Target
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { useTheme } from '@/contexts/ThemeContext';
import { settingsService } from '@/services/api';
import styles from './page.module.css';

const COLORS = [
    '#4318FF', '#6AD2FF', '#F97316', '#10B981', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1'
];

export default function SettingsPage() {
    const {
        primaryColor,
        updatePrimaryColor,
        settings: globalSettings,
        updateSettings
    } = useTheme();

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [monthlyGoal, setMonthlyGoal] = useState({ target: 50000, current: 0 });

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

                {/* Appearance */}
                <motion.div
                    className={styles.section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                >
                    <div className={styles.sectionHeader}>
                        <div className={`${styles.sectionIcon} ${styles.primary}`}>
                            <Palette size={22} />
                        </div>
                        <div>
                            <h2 className={styles.sectionTitle}>Aparência</h2>
                            <p className={styles.sectionSubtitle}>Personalize o sistema</p>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Cor Principal</label>
                            <div className={styles.colorGrid}>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`${styles.colorBtn} ${primaryColor === color ? styles.active : ''}`}
                                        style={{ background: color }}
                                        onClick={() => updatePrimaryColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

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
