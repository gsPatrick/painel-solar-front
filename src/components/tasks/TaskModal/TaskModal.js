'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar } from 'lucide-react';
import Modal, { modalStyles as styles } from '../../shared/Modal/Modal';

const TYPES = [
    { value: 'FOLLOW_UP', label: 'Follow-up' },
    { value: 'PROPOSAL', label: 'Proposta' },
    { value: 'OTHER', label: 'Outro' },
];

export default function TaskModal({
    isOpen,
    onClose,
    onSubmit,
    task = null,
    leads = [],
    loading = false,
}) {
    const isEditing = !!task;

    const [formData, setFormData] = useState({
        lead_id: '',
        title: '',
        type: 'FOLLOW_UP',
        due_date: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (task) {
            const dueDate = new Date(task.due_date);
            setFormData({
                lead_id: task.lead_id || '',
                title: task.title || '',
                type: task.type || 'FOLLOW_UP',
                due_date: dueDate.toISOString().split('T')[0],
            });
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setFormData({
                lead_id: leads[0]?.id || '',
                title: '',
                type: 'FOLLOW_UP',
                due_date: tomorrow.toISOString().split('T')[0],
            });
        }
        setErrors({});
    }, [task, isOpen, leads]);

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
        if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
        if (!formData.due_date) newErrors.due_date = 'Data é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            lead_id: formData.lead_id,
            title: formData.title,
            type: formData.type,
            due_date: new Date(formData.due_date).toISOString(),
        };

        onSubmit(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            subtitle={isEditing ? 'Altere os dados da tarefa' : 'Crie uma nova tarefa de acompanhamento'}
            icon={CheckSquare}
            iconVariant="warning"
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
                        {loading ? <span className={styles.spinner} /> : isEditing ? 'Salvar' : 'Criar Tarefa'}
                    </button>
                </>
            }
        >
            <form id="task-form" onSubmit={handleSubmit} className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Lead</label>
                    <select
                        name="lead_id"
                        value={formData.lead_id}
                        onChange={handleChange}
                        className={`${styles.select} ${errors.lead_id ? styles.inputError : ''}`}
                    >
                        <option value="">Selecione um lead...</option>
                        {leads.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                    {errors.lead_id && <span className={styles.errorText}>{errors.lead_id}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Título</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                        placeholder="Ex: Enviar proposta comercial"
                    />
                    {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                </div>

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

                <div className={styles.formGroup}>
                    <label className={styles.label}>Data de Vencimento</label>
                    <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.due_date ? styles.inputError : ''}`}
                    />
                    {errors.due_date && <span className={styles.errorText}>{errors.due_date}</span>}
                </div>
            </form>
        </Modal>
    );
}
