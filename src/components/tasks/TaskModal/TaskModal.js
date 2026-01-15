'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, Bell } from 'lucide-react';
import Modal, { modalStyles as styles } from '../../shared/Modal/Modal';

const TYPES = [
    { value: 'FOLLOW_UP', label: 'Follow-up' },
    { value: 'PROPOSAL', label: 'Proposta' },
    { value: 'LEMBRETE', label: 'Lembrete' }, // Added LEMBRETE explicitly
    { value: 'OTHER', label: 'Outro' },
];

export default function TaskModal({
    isOpen,
    onClose,
    onSubmit,
    task = null,
    leads = [],
    loading = false,
    forcedType = null // New prop to force/hide type
}) {
    const isEditing = !!task;

    const [formData, setFormData] = useState({
        lead_id: '',
        title: '',
        description: '',
        type: forcedType || 'FOLLOW_UP',
        due_date: '',
        notify: 'normal' // normal (1d+2h), none (silence)
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (task) {
            // Task.due_date comes as ISO string usually
            // datetime-local expects YYYY-MM-DDTHH:mm
            let dateStr = '';
            if (task.due_date || task.date_time) {
                const d = new Date(task.due_date || task.date_time);
                // Adjust for timezone offset to show local time correctly in input
                const offset = d.getTimezoneOffset() * 60000;
                dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
            }

            setFormData({
                lead_id: task.lead_id || '',
                title: task.title || '',
                description: task.description || '',
                type: task.type || forcedType || 'FOLLOW_UP',
                due_date: dateStr,
                notify: 'normal'
            });
        } else {
            // Default tomorrow 09:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            const offset = tomorrow.getTimezoneOffset() * 60000;
            const tomorrowStr = new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);

            setFormData({
                lead_id: leads[0]?.id || '',
                title: '',
                description: '',
                type: forcedType || (forcedType === 'LEMBRETE' ? 'LEMBRETE' : 'FOLLOW_UP'),
                due_date: tomorrowStr,
                notify: 'normal'
            });
        }
        setErrors({});
    }, [task, isOpen, leads, forcedType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.due_date) newErrors.due_date = 'Data e hora são obrigatórias';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            lead_id: formData.lead_id || null, // Allow null
            title: formData.title,
            description: formData.description,
            type: forcedType || formData.type,
            due_date: new Date(formData.due_date).toISOString(), // Send as ISO
            // We might handle 'notify' later if we update backend
        };

        onSubmit(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Lembrete' : 'Novo Lembrete'}
            subtitle={isEditing ? 'Altere os dados' : 'Defina o título e horário do alerta'}
            icon={Bell}
            iconVariant="primary"
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="task-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loading}
                    >
                        {loading ? <span className={styles.spinner} /> : isEditing ? 'Salvar' : 'Criar'}
                    </button>
                </>
            }
        >
            <form id="task-form" onSubmit={handleSubmit} className={styles.formGrid}>
                {/* Title */}
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.label}>Título do Lembrete</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                        placeholder="Ex: Ligar para Fulano, Pagar conta de luz..."
                        autoFocus
                    />
                    {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                </div>

                {/* Description */}
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.label}>Detalhes (Opcional)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textarea}
                        rows={2}
                        placeholder="Observações..."
                    />
                </div>

                {/* Date & Time */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <Clock size={14} style={{ marginRight: 4, display: 'inline' }} />
                        Data e Hora
                    </label>
                    <input
                        type="datetime-local"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.due_date ? styles.inputError : ''}`}
                    />
                    {errors.due_date && <span className={styles.errorText}>{errors.due_date}</span>}
                </div>

                {/* Lead (Optional) */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Vincular Lead (Opcional)</label>
                    <select
                        name="lead_id"
                        value={formData.lead_id}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="">-- Nenhum --</option>
                        {leads.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>

                {/* Notification Setting (Visual only for now, mapped to default backend logic) */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Notificação</label>
                    <select
                        name="notify"
                        value={formData.notify}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="normal">🔔 Padrão (WhatsApp)</option>
                        <option value="none">🔕 Sem aviso externo</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>
                        *Aviso via WhatsApp (1 dia e 2h antes)
                    </span>
                </div>

                {/* HIDDEN OR SHOWN TYPE */}
                {!forcedType && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tipo</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className={styles.select}
                        >
                            {TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </form>
        </Modal>
    );
}
