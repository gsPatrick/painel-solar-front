'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    Users,
    Filter,
    Search,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    CheckSquare,
    Square
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { pipelineService, leadService, marketingService } from '@/services/api';
import styles from './page.module.css';

export default function MarketingPage() {
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);
    const [pipelines, setPipelines] = useState([]);

    // Filters
    const [selectedPipeline, setSelectedPipeline] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Selection
    const [selectedLeads, setSelectedLeads] = useState([]);

    // Message
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    // Initial Load
    useEffect(() => {
        loadPipelines();
    }, []);

    // Fetch leads when filters change
    useEffect(() => {
        loadLeads();
    }, [selectedPipeline, searchQuery]);

    const loadPipelines = async () => {
        try {
            const data = await pipelineService.getAll();
            setPipelines(data || []);
            // Default to first pipeline if exists? No, show all or specific.
        } catch (error) {
            console.error('Error loading pipelines:', error);
        }
    };

    const loadLeads = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (selectedPipeline) filters.pipeline_id = selectedPipeline;
            if (searchQuery) filters.search = searchQuery;

            // We want ALL leads matching filters, not just active? 
            // Service defaults to active.

            const data = await leadService.getAll(filters);
            setLeads(data || []);

            // Clear selection if it contains IDs not in new list?
            // Optional: for now keep simple.
        } catch (error) {
            console.error('Error loading leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l.id));
        }
    };

    const handleSelectLead = (id) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(lid => lid !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        setSending(true);
        setSendResult(null);

        try {
            const result = await marketingService.bulkSend(selectedLeads, message);
            setSendResult({
                type: 'success',
                message: `Disparo concluído! Enviado para ${result.success} leads.`,
                details: result
            });
            setMessage('');
            setSelectedLeads([]);
        } catch (error) {
            console.error('Send error:', error);
            setSendResult({
                type: 'error',
                message: 'Erro ao realizar disparo. Verifique o console ou tente novamente.'
            });
        } finally {
            setSending(false);
        }
    };

    const selectedCount = selectedLeads.length;

    return (
        <>
            <Header title="Disparo em Massa" />

            <div className={styles.container}>
                {/* Top Section: Filters & Composer */}
                <div className={styles.topGrid}>

                    {/* Filters Card */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.cardHeader}>
                            <Filter size={20} />
                            <h2>Filtros</h2>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Funil / Etapa</label>
                            <select
                                value={selectedPipeline}
                                onChange={(e) => setSelectedPipeline(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Todos os Funis</option>
                                {pipelines.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Buscar (Nome ou Telefone)</label>
                            <div className={styles.searchWrapper}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Ex: João, 7199..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.stats}>
                            <Users size={16} />
                            <span>{leads.length} leads encontrados</span>
                        </div>
                    </motion.div>

                    {/* Composer Card */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.cardHeader}>
                            <Send size={20} />
                            <h2>Mensagem</h2>
                        </div>

                        <textarea
                            className={styles.textarea}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escreva sua mensagem... Use {nome} para personalizar."
                            rows={5}
                        />

                        <div className={styles.actions}>
                            <div className={styles.helperText}>
                                {selectedCount === 0
                                    ? 'Selecione leads abaixo para enviar'
                                    : `${selectedCount} leads selecionados`
                                }
                            </div>

                            <button
                                className={styles.sendBtn}
                                onClick={handleSend}
                                disabled={sending || selectedCount === 0 || !message.trim()}
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw className={styles.spin} size={18} />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Enviar Mensagem
                                    </>
                                )}
                            </button>
                        </div>

                        {sendResult && (
                            <div className={`${styles.resultBanner} ${styles[sendResult.type]}`}>
                                {sendResult.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {sendResult.message}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* List Section */}
                <div className={styles.listSection}>
                    <div className={styles.listHeader}>
                        <h3>Lista de Leads</h3>
                        <button className={styles.textBtn} onClick={handleSelectAll}>
                            {selectedLeads.length === leads.length && leads.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                    </div>

                    <div className={styles.listContainer}>
                        {loading ? (
                            <div className={styles.loadingState}>
                                <RefreshCw className={styles.spin} size={32} />
                                <p>Carregando leads...</p>
                            </div>
                        ) : leads.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Users size={48} />
                                <p>Nenhum lead encontrado com os filtros atuais.</p>
                            </div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>
                                            <button className={styles.checkBtn} onClick={handleSelectAll}>
                                                {selectedLeads.length === leads.length && leads.length > 0
                                                    ? <CheckSquare size={20} />
                                                    : <Square size={20} />
                                                }
                                            </button>
                                        </th>
                                        <th>Nome</th>
                                        <th>Telefone</th>
                                        <th>Etapa</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map(lead => {
                                        const isSelected = selectedLeads.includes(lead.id);
                                        return (
                                            <tr key={lead.id} className={isSelected ? styles.selectedRow : ''} onClick={() => handleSelectLead(lead.id)}>
                                                <td>
                                                    <button className={`${styles.checkBtn} ${isSelected ? styles.active : ''}`}>
                                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </button>
                                                </td>
                                                <td className={styles.nameCell}>{lead.name}</td>
                                                <td>{lead.phone}</td>
                                                <td>
                                                    <span className={styles.pipelineBadge}>
                                                        {lead.pipeline ? lead.pipeline.title : '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[lead.status]}`}>
                                                        {lead.status === 'active' ? 'Ativo' : lead.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
