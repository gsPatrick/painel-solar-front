'use client';

import { useState, useEffect } from 'react';
import { User, Phone, DollarSign, Tag, Star } from 'lucide-react';
import Modal, { modalStyles as styles } from '../../shared/Modal/Modal';

const SOURCES = [
    { value: 'manual', label: 'Manual' },
    { value: 'meta_ads', label: 'Meta Ads' },
    { value: 'whatsapp', label: 'WhatsApp' },
];

export default function LeadModal({
    isOpen,
    onClose,
    onSubmit,
    onCreatePipeline,
    lead = null,
    pipelines = [],
    initialPipelineId = '',
    loading = false,
}) {
    const isEditing = !!lead;

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        source: 'manual',
        pipeline_id: '',
        proposal_value: '',
        system_size_kwp: '',
        is_important: false,
        // Qualification fields
        monthly_bill: '',
        segment: '',
        roof_type: '',
        city: '',
        neighborhood: '',
        equipment_increase: '',
    });

    const [errors, setErrors] = useState({});

    // Effect 1: Reset form when Modal opens or Lead changes
    useEffect(() => {
        if (!isOpen) return;

        if (lead) {
            setFormData({
                name: lead.name || '',
                phone: lead.phone || '',
                source: lead.source || 'manual',
                pipeline_id: lead.pipeline_id || '',
                proposal_value: lead.proposal_value || '',
                system_size_kwp: lead.system_size_kwp || '',
                is_important: lead.is_important || false,
                // Qualification fields
                monthly_bill: lead.monthly_bill || '',
                segment: lead.segment || '',
                roof_type: lead.roof_type || '',
                city: lead.city || '',
                neighborhood: lead.neighborhood || '',
                equipment_increase: lead.equipment_increase || '',
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                source: 'manual',
                pipeline_id: initialPipelineId || '',
                proposal_value: '',
                system_size_kwp: '',
                is_important: false,
                monthly_bill: '',
                segment: '',
                roof_type: '',
                city: '',
                neighborhood: '',
                equipment_increase: '',
            });
        }
        setErrors({});
    }, [lead, isOpen, initialPipelineId]);

    // Effect 2: Set default pipeline if creating new lead and pipelines load later
    useEffect(() => {
        if (isOpen && !lead && !formData.pipeline_id && pipelines.length > 0) {
            setFormData(prev => ({ ...prev, pipeline_id: pipelines[0].id }));
        }
    }, [isOpen, lead, pipelines, formData.pipeline_id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            ...formData,
            proposal_value: formData.proposal_value ? parseFloat(formData.proposal_value) : null,
            system_size_kwp: formData.system_size_kwp ? parseFloat(formData.system_size_kwp) : null,
        };

        onSubmit(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Lead' : 'Novo Lead'}
            subtitle={isEditing ? `Editando ${lead.name}` : 'Adicione um novo lead ao CRM'}
            icon={User}
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
                        form="lead-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loading}
                    >
                        {loading ? <span className={styles.spinner} /> : isEditing ? 'Salvar' : 'Criar Lead'}
                    </button>
                </>
            }
        >
            <form id="lead-form" onSubmit={handleSubmit} className={`${styles.formGrid} ${styles.cols2}`}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Nome completo</label>
                    <div className={styles.inputIcon}>
                        <User size={18} />
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                            placeholder="Nome do lead"
                        />
                    </div>
                    {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Telefone</label>
                    <div className={styles.inputIcon}>
                        <Phone size={18} />
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Origem</label>
                    <select
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        {SOURCES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.labelRow}>
                        <label className={styles.label}>Pipeline</label>
                        {onCreatePipeline && (
                            <button
                                type="button"
                                className={styles.linkBtn}
                                onClick={onCreatePipeline}
                            >
                                + Novo Funil
                            </button>
                        )}
                    </div>
                    <select
                        name="pipeline_id"
                        value={formData.pipeline_id}
                        onChange={handleChange}
                        className={styles.select}
                        disabled={pipelines.length === 0}
                    >
                        {pipelines.length === 0 ? (
                            <option value="">Nenhum funil disponível</option>
                        ) : (
                            pipelines.map((p) => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))
                        )}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        Valor da Proposta
                        <span className={styles.labelOptional}>(opcional)</span>
                    </label>
                    <div className={styles.inputIcon}>
                        <DollarSign size={18} />
                        <input
                            type="number"
                            name="proposal_value"
                            value={formData.proposal_value}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        Tamanho do Sistema (kWp)
                        <span className={styles.labelOptional}>(opcional)</span>
                    </label>
                    <input
                        type="number"
                        name="system_size_kwp"
                        value={formData.system_size_kwp}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="0.00"
                        step="0.01"
                    />
                </div>

                {/* Qualification Fields Section */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.sectionDivider}>
                        <span>📋 Dados de Qualificação (preenchidos pela IA)</span>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Valor da Conta de Luz (R$)</label>
                    <input
                        type="number"
                        name="monthly_bill"
                        value={formData.monthly_bill}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Ex: 350"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Segmento</label>
                    <select
                        name="segment"
                        value={formData.segment}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="">Não informado</option>
                        <option value="residencial">🏠 Residencial</option>
                        <option value="comercial">🏪 Comercial</option>
                        <option value="rural">🌾 Rural</option>
                        <option value="industrial">🏭 Industrial</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo de Telhado</label>
                    <select
                        name="roof_type"
                        value={formData.roof_type}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="">Não informado</option>
                        <option value="ceramica">🧱 Cerâmica</option>
                        <option value="eternit">📦 Eternit/Fibrocimento</option>
                        <option value="metalico">🔩 Metálico</option>
                        <option value="laje">🏗️ Laje</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Cidade</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Ex: Salvador"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Bairro</label>
                    <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Ex: Pituba"
                    />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Equipamento que vai aumentar consumo</label>
                    <input
                        type="text"
                        name="equipment_increase"
                        value={formData.equipment_increase}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Ex: Ar-condicionado, piscina"
                    />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            name="is_important"
                            checked={formData.is_important}
                            onChange={handleChange}
                            className={styles.checkboxInput}
                        />
                        <Star size={18} style={{ color: formData.is_important ? '#F97316' : '#A3AED0' }} />
                        <span className={styles.checkboxLabel}>Marcar como lead importante</span>
                    </label>
                </div>
            </form>
        </Modal>
    );
}
