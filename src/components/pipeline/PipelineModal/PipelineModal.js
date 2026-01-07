'use client';

import { useState, useEffect } from 'react';
import { Columns, Palette } from 'lucide-react';
import Modal, { modalStyles as styles } from '../../shared/Modal/Modal';

const COLORS = [
    { value: '#4318FF', name: 'Roxo' },
    { value: '#6AD2FF', name: 'Azul Claro' },
    { value: '#F97316', name: 'Laranja' },
    { value: '#10B981', name: 'Verde' },
    { value: '#8B5CF6', name: 'Violeta' },
    { value: '#EC4899', name: 'Rosa' },
    { value: '#14B8A6', name: 'Teal' },
    { value: '#F59E0B', name: 'Amarelo' },
];

export default function PipelineModal({
    isOpen,
    onClose,
    onSubmit,
    pipeline = null,
    loading = false,
}) {
    const isEditing = !!pipeline;

    const [formData, setFormData] = useState({
        title: '',
        color: '#4318FF',
        sla_limit_days: 3,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (pipeline) {
            setFormData({
                title: pipeline.title || '',
                color: pipeline.color || '#4318FF',
                sla_limit_days: pipeline.sla_limit_days || 3,
            });
        } else {
            setFormData({
                title: '',
                color: '#4318FF',
                sla_limit_days: 3,
            });
        }
        setErrors({});
    }, [pipeline, isOpen]);

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
        if (!formData.sla_limit_days || formData.sla_limit_days < 1) {
            newErrors.sla_limit_days = 'SLA deve ser pelo menos 1 dia';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            ...formData,
            sla_limit_days: parseInt(formData.sla_limit_days),
        };

        onSubmit(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Coluna' : 'Nova Coluna'}
            subtitle={isEditing ? `Editando ${pipeline.title}` : 'Adicione uma nova etapa ao Kanban'}
            icon={Columns}
            iconVariant="primary"
            size="sm"
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
                        form="pipeline-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loading}
                    >
                        {loading ? <span className={styles.spinner} /> : isEditing ? 'Salvar' : 'Criar Coluna'}
                    </button>
                </>
            }
        >
            <form id="pipeline-form" onSubmit={handleSubmit} className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Título da Coluna</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                        placeholder="Ex: Proposta Enviada"
                    />
                    {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Cor da Coluna</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {COLORS.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, color: c.value }))}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: c.value,
                                    border: formData.color === c.value ? '3px solid #1B2559' : '3px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: formData.color === c.value ? 'scale(1.1)' : 'scale(1)',
                                }}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Limite SLA (dias)</label>
                    <input
                        type="number"
                        name="sla_limit_days"
                        value={formData.sla_limit_days}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.sla_limit_days ? styles.inputError : ''}`}
                        min="1"
                        max="30"
                    />
                    {errors.sla_limit_days && <span className={styles.errorText}>{errors.sla_limit_days}</span>}
                    <span style={{ fontSize: '0.8rem', color: '#A3AED0', marginTop: '4px' }}>
                        Leads ficarão vermelhos após este período sem interação
                    </span>
                </div>
            </form>
        </Modal>
    );
}
