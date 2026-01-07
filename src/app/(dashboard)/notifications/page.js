'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    Plus,
    Trash2,
    Edit2,
    Phone,
    User,
    Check,
    X,
    Save
} from 'lucide-react';
import api from '@/services/api';
import styles from './page.module.css';

export default function NotificationsPage() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    useEffect(() => {
        loadNumbers();
    }, []);

    const loadNumbers = async () => {
        try {
            const response = await api.get('/admin-numbers');
            setNumbers(response.data);
        } catch (err) {
            console.error('Error loading numbers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await api.put(`/admin-numbers/${editingId}`, formData);
            } else {
                await api.post('/admin-numbers', formData);
            }

            loadNumbers();
            setFormData({ name: '', phone: '' });
            setShowForm(false);
            setEditingId(null);
        } catch (err) {
            alert('Erro ao salvar número');
        }
    };

    const handleEdit = (number) => {
        setFormData({ name: number.name, phone: number.phone });
        setEditingId(number.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este número?')) return;

        try {
            await api.delete(`/admin-numbers/${id}`);
            loadNumbers();
        } catch (err) {
            alert('Erro ao excluir número');
        }
    };

    const handleToggleActive = async (number) => {
        try {
            await api.put(`/admin-numbers/${number.id}`, { active: !number.active });
            loadNumbers();
        } catch (err) {
            alert('Erro ao atualizar status');
        }
    };

    const formatPhone = (phone) => {
        // Format: +55 (11) 99999-9999
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 13) {
            return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
        }
        return phone;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.iconWrapper}>
                        <Bell size={24} />
                    </div>
                    <div>
                        <h1>Notificações Admin</h1>
                        <p>Gerencie os números que recebem alertas de propostas</p>
                    </div>
                </div>

                <button
                    className={styles.addBtn}
                    onClick={() => {
                        setFormData({ name: '', phone: '' });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                >
                    <Plus size={18} />
                    Adicionar Número
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <motion.div
                    className={styles.formOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowForm(false)}
                >
                    <motion.form
                        className={styles.formCard}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSubmit}
                    >
                        <h2>{editingId ? 'Editar Número' : 'Novo Número'}</h2>

                        <div className={styles.formGroup}>
                            <label>
                                <User size={16} />
                                Nome
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: João (Gerente)"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <Phone size={16} />
                                WhatsApp
                            </label>
                            <input
                                type="tel"
                                placeholder="Ex: (11) 99999-9999"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                                <X size={18} />
                                Cancelar
                            </button>
                            <button type="submit" className={styles.saveBtn}>
                                <Save size={18} />
                                Salvar
                            </button>
                        </div>
                    </motion.form>
                </motion.div>
            )}

            {/* Numbers List */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Carregando...</div>
                ) : numbers.length === 0 ? (
                    <div className={styles.empty}>
                        <Bell size={48} />
                        <h3>Nenhum número cadastrado</h3>
                        <p>Adicione números para receber alertas quando leads precisarem de proposta.</p>
                    </div>
                ) : (
                    <div className={styles.numbersList}>
                        {numbers.map((number) => (
                            <motion.div
                                key={number.id}
                                className={`${styles.numberCard} ${!number.active ? styles.inactive : ''}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className={styles.numberInfo}>
                                    <div className={styles.avatar}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h4>{number.name}</h4>
                                        <span className={styles.phone}>{formatPhone(number.phone)}</span>
                                    </div>
                                </div>

                                <div className={styles.numberActions}>
                                    <button
                                        className={`${styles.statusBtn} ${number.active ? styles.active : ''}`}
                                        onClick={() => handleToggleActive(number)}
                                        title={number.active ? 'Desativar' : 'Ativar'}
                                    >
                                        {number.active ? <Check size={16} /> : <X size={16} />}
                                        {number.active ? 'Ativo' : 'Inativo'}
                                    </button>

                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => handleEdit(number)}
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    <button
                                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                        onClick={() => handleDelete(number.id)}
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
                <h4>📱 Como funciona?</h4>
                <p>
                    Quando um lead completa o atendimento inicial da IA (fornece conta de luz, tipo de telhado e cidade),
                    ele é movido automaticamente para o funil "Enviar Proposta" e uma mensagem é enviada para todos os
                    números ativos com um resumo do lead.
                </p>
            </div>
        </div>
    );
}
