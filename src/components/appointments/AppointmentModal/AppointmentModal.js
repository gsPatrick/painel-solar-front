'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Wrench } from 'lucide-react';
import Modal, { modalStyles as styles } from '../../shared/Modal/Modal';

const TYPES = [
    { value: 'VISITA_TECNICA', label: 'Visita Técnica', icon: MapPin, color: '#3B82F6' },
    { value: 'INSTALACAO', label: 'Instalação', icon: Wrench, color: '#10B981' },
];

export default function AppointmentModal({
    isOpen,
    onClose,
    onSubmit,
    onCreateLead, // Prop for creating new lead
    appointment = null,
    leads = [],
    loading = false,
    conflictError = null,
}) {
    const isEditing = !!appointment;

    const [formData, setFormData] = useState({
        lead_id: '',
        type: 'VISITA_TECNICA',
        date: '',
        time: '',
        notes: '',
    });

    const [errors, setErrors] = useState({});

    // Effect 1: Reset form when Modal opens or Appointment changes
    useEffect(() => {
        if (!isOpen) return;

        if (appointment) {
            const dateTime = new Date(appointment.date_time);
            setFormData({
                lead_id: appointment.lead_id || '',
                type: appointment.type || 'VISITA_TECNICA',
                date: dateTime.toISOString().split('T')[0],
                time: dateTime.toTimeString().slice(0, 5),
                notes: appointment.notes || '',
            });
        } else {
            const now = new Date();
            setFormData({
                lead_id: '',
                type: 'VISITA_TECNICA',
                date: now.toISOString().split('T')[0],
                time: '09:00',
                notes: '',
            });
        }
        setErrors({});
    }, [appointment, isOpen]);

    // Effect 2: Set default lead if creating new appointment and leads load later
    useEffect(() => {
        if (isOpen && !appointment && !formData.lead_id && leads.length > 0) {
            setFormData(prev => ({ ...prev, lead_id: leads[0].id }));
        }
    }, [isOpen, appointment, leads, formData.lead_id]);

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
        if (!formData.lead_id) newErrors.lead_id = 'Selecione um lead';
        if (!formData.date) newErrors.date = 'Data é obrigatória';
        if (!formData.time) newErrors.time = 'Horário é obrigatório';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const dateTime = new Date(`${formData.date}T${formData.time}:00`);

        const data = {
            lead_id: formData.lead_id,
            type: formData.type,
            date_time: dateTime.toISOString(),
            notes: formData.notes || null,
        };

        onSubmit(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
            subtitle={isEditing ? 'Altere os dados do agendamento' : 'Agende uma visita técnica ou instalação'}
            icon={Calendar}
            iconVariant="success"
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
                        form="appointment-form"
                        className={`${styles.btn} ${styles.btnSuccess}`}
                        disabled={loading}
                    >
                        {loading ? <span className={styles.spinner} /> : isEditing ? 'Salvar' : 'Agendar'}
                    </button>
                </>
            }
        >
            <form id="appointment-form" onSubmit={handleSubmit} className={`${styles.formGrid} ${styles.cols2}`}>
                {conflictError && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{
                        padding: '14px 18px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        color: '#DC2626',
                        fontSize: '0.9rem',
                    }}>
                        ⚠️ {conflictError}
                    </div>
                )}

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.labelRow} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <label className={styles.label} style={{ margin: 0 }}>Lead</label>
                        {onCreateLead && (
                            <button
                                type="button"
                                onClick={onCreateLead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4318FF',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                + Novo Lead
                            </button>
                        )}
                    </div>
                    <select
                        name="lead_id"
                        value={formData.lead_id}
                        onChange={handleChange}
                        className={`${styles.select} ${errors.lead_id ? styles.inputError : ''}`}
                    >
                        <option value="">Selecione um lead...</option>
                        {isOpen && leads.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                    {errors.lead_id && <span className={styles.errorText}>{errors.lead_id}</span>}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Tipo</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        {TYPES.map((t) => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, type: t.value }))}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: formData.type === t.value
                                            ? `2px solid ${t.color}`
                                            : '2px solid #E2E8F0',
                                        background: formData.type === t.value
                                            ? `${t.color}10`
                                            : '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        color: formData.type === t.value ? t.color : '#64748B',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    <Icon size={18} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Data</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                    />
                    {errors.date && <span className={styles.errorText}>{errors.date}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Horário</label>
                    <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.time ? styles.inputError : ''}`}
                    />
                    {errors.time && <span className={styles.errorText}>{errors.time}</span>}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>
                        Observações
                        <span className={styles.labelOptional}>(opcional)</span>
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className={styles.textarea}
                        placeholder="Informações adicionais sobre o agendamento..."
                        rows={3}
                    />
                </div>
            </form>
        </Modal>
    );
}
