'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, Save, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { settingsService } from '@/services/api';
import styles from '../page.module.css';

export default function ReminderSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        reminder_enabled: true,
        reminder_1day_enabled: true,
        reminder_2hours_enabled: true,
        reminder_1day_message: '',
        reminder_2hours_message: '',
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await settingsService.getAll();
            const reminderSettings = {};

            data.forEach(s => {
                if (s.key.startsWith('reminder_')) {
                    if (s.type === 'boolean') {
                        reminderSettings[s.key] = s.value === 'true';
                    } else {
                        reminderSettings[s.key] = s.value;
                    }
                }
            });

            setSettings(prev => ({ ...prev, ...reminderSettings }));
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const [key, value] of Object.entries(settings)) {
                await settingsService.update(key, String(value));
            }
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Carregando...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <Bell size={28} className={styles.titleIcon} />
                    <div>
                        <h1 className={styles.title}>Lembretes de Agendamento</h1>
                        <p className={styles.subtitle}>
                            Configure os lembretes automáticos enviados antes dos agendamentos
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* Master Toggle */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>⚙️ Configuração Geral</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleLabel}>Ativar lembretes automáticos</span>
                                <span className={styles.toggleDesc}>
                                    Enviar mensagens de lembrete para clientes antes dos agendamentos
                                </span>
                            </div>
                            <button
                                className={`${styles.toggleBtn} ${settings.reminder_enabled ? styles.active : ''}`}
                                onClick={() => handleToggle('reminder_enabled')}
                            >
                                {settings.reminder_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 1 Day Reminder */}
                <div className={`${styles.card} ${!settings.reminder_enabled ? styles.disabled : ''}`}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>📅 Lembrete 1 Dia Antes</h2>
                        <button
                            className={`${styles.toggleBtn} ${settings.reminder_1day_enabled ? styles.active : ''}`}
                            onClick={() => handleToggle('reminder_1day_enabled')}
                            disabled={!settings.reminder_enabled}
                        >
                            {settings.reminder_1day_enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>
                    <div className={styles.cardBody}>
                        <label className={styles.label}>
                            <MessageSquare size={16} />
                            Mensagem do lembrete
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={settings.reminder_1day_message}
                            onChange={(e) => handleChange('reminder_1day_message', e.target.value)}
                            disabled={!settings.reminder_enabled || !settings.reminder_1day_enabled}
                            rows={5}
                            placeholder="Use {nome}, {tipo}, {data}, {hora} como variáveis"
                        />
                        <div className={styles.helpText}>
                            Variáveis: <code>{'{nome}'}</code>, <code>{'{tipo}'}</code>, <code>{'{data}'}</code>, <code>{'{hora}'}</code>
                        </div>
                    </div>
                </div>

                {/* 2 Hours Reminder */}
                <div className={`${styles.card} ${!settings.reminder_enabled ? styles.disabled : ''}`}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>⏰ Lembrete 2 Horas Antes</h2>
                        <button
                            className={`${styles.toggleBtn} ${settings.reminder_2hours_enabled ? styles.active : ''}`}
                            onClick={() => handleToggle('reminder_2hours_enabled')}
                            disabled={!settings.reminder_enabled}
                        >
                            {settings.reminder_2hours_enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>
                    <div className={styles.cardBody}>
                        <label className={styles.label}>
                            <MessageSquare size={16} />
                            Mensagem do lembrete
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={settings.reminder_2hours_message}
                            onChange={(e) => handleChange('reminder_2hours_message', e.target.value)}
                            disabled={!settings.reminder_enabled || !settings.reminder_2hours_enabled}
                            rows={5}
                            placeholder="Use {nome}, {tipo}, {hora} como variáveis"
                        />
                        <div className={styles.helpText}>
                            Variáveis: <code>{'{nome}'}</code>, <code>{'{tipo}'}</code>, <code>{'{hora}'}</code>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className={styles.actions}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
