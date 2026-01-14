'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Wrench, Bell } from 'lucide-react';
import Modal, { modalStyles as styles } from '../../shared/Modal/Modal';
import localStyles from './AppointmentModal.module.css';

const TYPES = [
    { value: 'VISITA_TECNICA', label: 'Visita Técnica', icon: MapPin, color: '#3B82F6' },
    { value: 'INSTALACAO', label: 'Instalação', icon: Wrench, color: '#10B981' },
    { value: 'LEMBRETE', label: 'Lembrete', icon: Bell, color: '#F59E0B' },
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
    const [leadSearch, setLeadSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

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
            // Populate search with lead name
            const lead = leads.find(l => l.id === appointment.lead_id);
            if (lead) setLeadSearch(lead.name);

        } else {
            const now = new Date();
            setFormData({
                lead_id: '',
                type: 'VISITA_TECNICA',
                date: now.toISOString().split('T')[0],
                time: '09:00',
                notes: '',
            });
            setLeadSearch('');
        }
        setErrors({});
        setShowDropdown(false);
    }, [appointment, isOpen, leads]);

    // Effect 2: Set default lead if creating new appointment and leads load later
    useEffect(() => {
        if (isOpen && !appointment && !formData.lead_id && leads.length > 0) {
            // Optional: Don't force select first lead in Autocomplete UX, usually better to leave empty
            // But if user wants it:
            // setFormData(prev => ({ ...prev, lead_id: leads[0].id }));
            // setLeadSearch(leads[0].name);
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

    // Filter leads based on search
    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.phone?.includes(leadSearch)
    );



    // ... (inside component) ...

    // Helper to determine style for type buttons based on selection
    const getTypeBtnStyle = (tValue, currentType, color) => {
        const isSelected = currentType === tValue;
        return {
            borderColor: isSelected ? color : undefined,
            backgroundColor: isSelected ? `${color}10` : undefined,
            color: isSelected ? color : undefined,
        };
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
                    <div className={`${styles.formGroup} ${styles.fullWidth} ${localStyles.conflictWarning}`}>
                        ⚠️ {conflictError}
                    </div>
                )}

                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ position: 'relative' }}>
                    <div className={styles.labelRow}>
                        <label className={styles.label}>Lead</label>
                        {onCreateLead && (
                            <button
                                type="button"
                                onClick={onCreateLead}
                                className={localStyles.newLeadBtn}
                            >
                                + Novo Lead
                            </button>
                        )}
                    </div>

                    {/* Autocomplete Input */}
                    <input
                        type="text"
                        placeholder="🔍 Buscar lead..."
                        value={leadSearch}
                        onChange={(e) => {
                            setLeadSearch(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        className={`${styles.input} ${errors.lead_id ? styles.inputError : ''}`}
                        autoComplete="off"
                    />

                    {/* Dropdown List */}
                    {showDropdown && filteredLeads.length > 0 && (
                        <ul className={localStyles.dropdownList}>
                            {filteredLeads.map((l) => (
                                <li
                                    key={l.id}
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, lead_id: l.id }));
                                        setLeadSearch(l.name);
                                        setShowDropdown(false);
                                        setErrors(prev => ({ ...prev, lead_id: null }));
                                    }}
                                    className={`${localStyles.dropdownItem} ${formData.lead_id === l.id ? localStyles.selected : ''}`}
                                >
                                    <strong>{l.name}</strong>
                                    <span className={localStyles.dropdownPhone}>{l.phone}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {errors.lead_id && <span className={styles.errorText}>{errors.lead_id}</span>}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Tipo</label>
                    <div className={localStyles.typeContainer}>
                        {TYPES.map((t) => {
                            const Icon = t.icon;
                            const dynamicStyle = getTypeBtnStyle(t.value, formData.type, t.color);
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, type: t.value }))}
                                    className={localStyles.typeBtn}
                                    style={dynamicStyle}
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
