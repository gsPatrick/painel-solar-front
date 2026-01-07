'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bot,
    Save,
    Clock,
    MessageSquare,
    Settings,
    RefreshCw,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { systemSettingsService } from '@/services/api';
import styles from './page.module.css';

export default function AISettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    // Settings state
    const [prompt, setPrompt] = useState('');
    const [followupDelayHours, setFollowupDelayHours] = useState(24);
    const [messageDelaySeconds, setMessageDelaySeconds] = useState(3);
    const [followupMessage, setFollowupMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const settings = await systemSettingsService.getAll();

            if (settings.openai_system_prompt) {
                setPrompt(settings.openai_system_prompt.value || '');
            }
            if (settings.followup_delay_hours) {
                setFollowupDelayHours(settings.followup_delay_hours.value || 24);
            }
            if (settings.message_delay_seconds) {
                setMessageDelaySeconds(settings.message_delay_seconds.value || 3);
            }
            if (settings.followup_message) {
                setFollowupMessage(settings.followup_message.value || '');
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setError('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);

        try {
            await systemSettingsService.bulkUpdate({
                openai_system_prompt: prompt,
                followup_delay_hours: String(followupDelayHours),
                message_delay_seconds: String(messageDelaySeconds),
                followup_message: followupMessage,
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

    if (loading) {
        return (
            <>
                <Header title="Configurações da IA" />
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
            <Header title="Configurações da IA" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <Bot size={28} className={styles.headerIcon} />
                        <div>
                            <h1>Cérebro da Sol</h1>
                            <p>Configure o comportamento e respostas da IA</p>
                        </div>
                    </div>

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
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
                    </button>
                </div>

                {error && (
                    <div className={styles.errorBanner}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className={styles.grid}>
                    {/* Script da Sol */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.cardHeader}>
                            <MessageSquare size={20} />
                            <h2>Script da Sol</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Este é o prompt enviado para a IA. Defina a personalidade,
                            etapas de venda e regras de comportamento.
                        </p>
                        <textarea
                            className={styles.textarea}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Você é a Sol, especialista em energia solar..."
                            rows={20}
                        />
                        <div className={styles.charCount}>
                            {prompt.length} caracteres
                        </div>
                    </motion.div>

                    {/* Timing Settings */}
                    <div className={styles.sideCards}>
                        <motion.div
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className={styles.cardHeader}>
                                <Clock size={20} />
                                <h2>Timings</h2>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Delay de Digitação (segundos)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={messageDelaySeconds}
                                    onChange={(e) => setMessageDelaySeconds(parseInt(e.target.value) || 3)}
                                />
                                <span className={styles.inputHint}>
                                    Tempo que a IA "digita" antes de responder
                                </span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Delay de Follow-up (horas)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="168"
                                    value={followupDelayHours}
                                    onChange={(e) => setFollowupDelayHours(parseInt(e.target.value) || 24)}
                                />
                                <span className={styles.inputHint}>
                                    Tempo de espera para enviar follow-up
                                </span>
                            </div>
                        </motion.div>

                        <motion.div
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className={styles.cardHeader}>
                                <Settings size={20} />
                                <h2>Mensagem de Follow-up</h2>
                            </div>
                            <p className={styles.cardDescription}>
                                Mensagem enviada automaticamente quando não há resposta.
                            </p>
                            <textarea
                                className={styles.textareaSmall}
                                value={followupMessage}
                                onChange={(e) => setFollowupMessage(e.target.value)}
                                placeholder="Olá! Passando para saber se conseguiu avaliar..."
                                rows={4}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
