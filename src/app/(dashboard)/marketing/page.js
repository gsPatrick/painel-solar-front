'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Users,
    Filter,
    Search,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    CheckSquare,
    Square,
    Clock,
    Shield,
    XOctagon,
    Play
} from 'lucide-react';
import { io } from 'socket.io-client';
import Header from '@/components/layout/Header/Header';
import { pipelineService, leadService, marketingService } from '@/services/api';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-painelsolar-sistema.r954jc.easypanel.host';

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

    // Bulk Config
    const [delayPreset, setDelayPreset] = useState('recommended'); // 'fast', 'recommended', 'slow', 'custom'
    const [delaySettings, setDelaySettings] = useState({ min: 15, max: 30 });
    const [activeJob, setActiveJob] = useState(null); // { total, current, success, failed, status }

    const socketRef = useRef(null);

    // Initial Load & Socket Check
    useEffect(() => {
        loadPipelines();
        checkActiveJob();

        // Connect Socket
        socketRef.current = io(API_URL.replace('/api', ''), {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('bulk_progress', (jobData) => {
            console.log('Bulk Progress:', jobData);
            setActiveJob(jobData);
            if (jobData.status === 'completed' || jobData.status === 'stopped') {
                setSending(false);
            } else {
                setSending(true);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Check if there is a running job on server
    const checkActiveJob = async () => {
        try {
            const status = await marketingService.getBulkStatus();
            if (status && status.status === 'running') {
                setActiveJob(status);
                setSending(true);
            }
        } catch (error) {
            console.error('Error checking bulk status:', error);
        }
    };

    // Update settings when preset changes
    useEffect(() => {
        switch (delayPreset) {
            case 'fast':
                setDelaySettings({ min: 5, max: 10 });
                break;
            case 'recommended':
                setDelaySettings({ min: 15, max: 30 });
                break;
            case 'slow':
                setDelaySettings({ min: 30, max: 60 });
                break;
            // custom keeps current values
        }
    }, [delayPreset]);

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

        if (delayPreset === 'fast') {
            const confirmed = confirm('ATENÇÃO: O modo "Rápido" tem ALTO RISCO de bloqueio do WhatsApp. Use apenas para listas muito pequenas (< 50 leads). Deseja continuar mesmo assim?');
            if (!confirmed) return;
        }

        setSending(true);
        setActiveJob({
            total: selectedLeads.length,
            current: 0,
            success: 0,
            failed: 0,
            status: 'running'
        });

        try {
            await marketingService.bulkSend(selectedLeads, message, {
                minDelay: parseInt(delaySettings.min),
                maxDelay: parseInt(delaySettings.max)
            });
            // Job started, socket will update
            setMessage('');
            setSelectedLeads([]);
        } catch (error) {
            console.error('Send error:', error);
            alert('Erro ao iniciar disparo: ' + (error.response?.data?.error || error.message));
            setSending(false);
            setActiveJob(null);
        }
    };

    const handleStop = async () => {
        if (!confirm('Deseja realmente parar o disparo?')) return;
        try {
            await marketingService.stopBulkSend();
        } catch (error) {
            console.error('Stop error:', error);
        }
    };

    const selectedCount = selectedLeads.length;

    // Helper for progress bar color
    const getProgressColor = () => {
        if (!activeJob) return '#ccc';
        if (activeJob.status === 'completed') return '#10B981'; // Green
        if (activeJob.status === 'stopped') return '#EF4444';   // Red
        return '#3B82F6'; // Blue
    };

    return (
        <>
            <Header title="Disparo em Massa" />

            <div className={styles.container}>
                {/* Active Job Progress Banner */}
                <AnimatePresence>
                    {activeJob && (activeJob.status === 'running' || activeJob.status === 'completed' || activeJob.status === 'stopped') && (
                        <motion.div
                            className={styles.jobBanner}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <div className={styles.jobHeader}>
                                <h3>
                                    {activeJob.status === 'running' && <RefreshCw className={styles.spin} size={16} />}
                                    {activeJob.status === 'completed' && <CheckCircle size={16} />}
                                    {activeJob.status === 'stopped' && <XOctagon size={16} />}

                                    {activeJob.status === 'running' ? 'Disparo em Andamento...' :
                                        activeJob.status === 'completed' ? 'Disparo Concluído!' : 'Disparo Interrompido'}
                                </h3>
                                {activeJob.status === 'running' && (
                                    <button onClick={handleStop} className={styles.stopBtn}>
                                        <XOctagon size={14} /> Parar
                                    </button>
                                )}
                                {(activeJob.status === 'completed' || activeJob.status === 'stopped') && (
                                    <button onClick={() => setActiveJob(null)} className={styles.closeJobBtn}>
                                        <XOctagon size={14} /> Fechar
                                    </button>
                                )}
                            </div>

                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${(activeJob.current / activeJob.total) * 100}%`,
                                            backgroundColor: getProgressColor()
                                        }}
                                    />
                                </div>
                                <div className={styles.statsRow}>
                                    <span>Total: <strong>{activeJob.total}</strong></span>
                                    <span>Enviados: <strong>{activeJob.success}</strong></span>
                                    {activeJob.failed > 0 && <span className={styles.errorText}>Falhas: <strong>{activeJob.failed}</strong></span>}
                                    <span>Progresso: <strong>{Math.round((activeJob.current / activeJob.total) * 100)}%</strong></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={styles.topGrid}>

                    {/* Filters & Config Card */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.cardHeader}>
                            <Filter size={20} />
                            <h2>Configuração</h2>
                        </div>

                        {/* Presets */}
                        <div className={styles.configSection}>
                            <label>Velocidade de Envio</label>
                            <div className={styles.presets}>
                                <button
                                    className={`${styles.presetBtn} ${delayPreset === 'fast' ? styles.active : ''} ${styles.danger}`}
                                    onClick={() => setDelayPreset('fast')}
                                    title="5-10 segundos"
                                >
                                    ⚡ Rápido (5-10s)
                                </button>
                                <button
                                    className={`${styles.presetBtn} ${delayPreset === 'recommended' ? styles.active : ''} ${styles.safe}`}
                                    onClick={() => setDelayPreset('recommended')}
                                    title="15-30 segundos"
                                >
                                    🛡️ Seguro (15-30s)
                                </button>
                                <button
                                    className={`${styles.presetBtn} ${delayPreset === 'slow' ? styles.active : ''} ${styles.safer}`}
                                    onClick={() => setDelayPreset('slow')}
                                    title="30-60 segundos"
                                >
                                    🐢 Lento (30-60s)
                                </button>
                            </div>

                            <div className={styles.delayInputs}>
                                <div className={styles.inputGroup}>
                                    <label>Mín (s)</label>
                                    <input
                                        type="number"
                                        value={delaySettings.min}
                                        onChange={(e) => {
                                            setDelaySettings({ ...delaySettings, min: e.target.value });
                                            setDelayPreset('custom');
                                        }}
                                        min="1"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Máx (s)</label>
                                    <input
                                        type="number"
                                        value={delaySettings.max}
                                        onChange={(e) => {
                                            setDelaySettings({ ...delaySettings, max: e.target.value });
                                            setDelayPreset('custom');
                                        }}
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className={styles.infoBox}>
                                {delayPreset === 'fast' && <p className={styles.dangerText}>⚠️ Alto risco de bloqueio. Use apenas para listas pequenas.</p>}
                                {delayPreset === 'recommended' && <p className={styles.safeText}>✅ Recomendado. Simula comportamento humano.</p>}
                                {delayPreset === 'slow' && <p className={styles.saferText}>🛡️ Segurança máxima para listas grandes.</p>}
                            </div>
                        </div>

                        <hr className={styles.divider} />

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
                            rows={8}
                            disabled={sending}
                        />

                        <div className={styles.actions}>
                            <div className={styles.helperText}>
                                {selectedCount === 0
                                    ? 'Selecione leads abaixo para enviar'
                                    : `${selectedCount} leads selecionados para envio`
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
                                        Iniciar Disparo
                                    </>
                                )}
                            </button>
                        </div>
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
