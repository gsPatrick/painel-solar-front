'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Database,
    Download,
    RefreshCw,
    CheckCircle,
    Phone,
    User,
    Clock,
    Server
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import { leadService } from '@/services/api';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-painelsolar-sistema.r954jc.easypanel.host';

export default function BackupPage() {
    const [stats, setStats] = useState({ total: 0, active: 0, lastCreated: null, recentLeads: [] });
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/leads/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await fetch(`${API_URL}/api/leads/export`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_leads_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Erro ao exportar. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const formatPhone = (phone) => {
        if (!phone) return '-';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 13) {
            return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
        }
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    return (
        <>
            <Header title="Segurança de Dados" />

            <div className={styles.container}>
                {/* Security Banner */}
                <motion.div
                    className={styles.securityBanner}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Shield className={styles.shieldIcon} size={48} />
                    <div className={styles.bannerContent}>
                        <h1>Seus dados estão protegidos</h1>
                        <p>
                            Todos os seus contatos são salvos automaticamente em nosso servidor PostgreSQL.
                            Mesmo que o WhatsApp caia, seus leads estão seguros aqui.
                        </p>
                    </div>
                    <CheckCircle className={styles.checkIcon} size={32} />
                </motion.div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.statIcon}>
                            <Database size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>
                                {loading ? '...' : (stats?.total ?? 0).toLocaleString('pt-BR')}
                            </span>
                            <span className={styles.statLabel}>Contatos Salvos</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <User size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{loading ? '...' : (stats?.active ?? 0)}</span>
                            <span className={styles.statLabel}>Leads Ativos</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                            <Clock size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue} style={{ fontSize: '1.2rem' }}>
                                {loading ? '...' : formatDate(stats?.lastCreated)}
                            </span>
                            <span className={styles.statLabel}>Último Lead Criado</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.statCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                            <Server size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue} style={{ color: '#10B981' }}>Online</span>
                            <span className={styles.statLabel}>Status do Servidor</span>
                        </div>
                    </motion.div>
                </div>

                {/* Export Section */}
                <motion.div
                    className={styles.exportSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2>Exportar Dados</h2>
                    <p>Faça o download de todos os seus leads em formato CSV/Excel.</p>
                    <button
                        className={styles.exportBtn}
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <>
                                <RefreshCw size={20} className={styles.spinning} />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                📥 Baixar Backup Completo (CSV)
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Recent Leads Table */}
                <motion.div
                    className={styles.tableSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className={styles.tableHeader}>
                        <h2>Últimos 50 Contatos Salvos</h2>
                        <button className={styles.refreshBtn} onClick={loadStats} disabled={loading}>
                            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
                        </button>
                    </div>
                    <p className={styles.tableSubtitle}>
                        Estes dados estão seguros em nosso servidor, <strong>independente da conexão com o WhatsApp</strong>.
                    </p>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Telefone</th>
                                    <th>Origem</th>
                                    <th>Data Criação</th>
                                    <th>Última Interação</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className={styles.loadingRow}>Carregando...</td>
                                    </tr>
                                ) : (stats?.recentLeads?.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan="6" className={styles.emptyRow}>Nenhum lead encontrado.</td>
                                    </tr>
                                ) : (
                                    (stats?.recentLeads ?? []).map((lead) => (
                                        <tr key={lead.id}>
                                            <td className={styles.nameCell}>
                                                <User size={14} />
                                                {lead.name}
                                            </td>
                                            <td>
                                                <Phone size={14} />
                                                {formatPhone(lead.phone)}
                                            </td>
                                            <td>
                                                <span className={`${styles.sourceBadge} ${styles[lead.source] || ''}`}>
                                                    {lead.source === 'meta_ads' ? '📣 Meta' :
                                                        lead.source === 'whatsapp' ? '💬 WhatsApp' : '📝 Manual'}
                                                </span>
                                            </td>
                                            <td>{formatDate(lead.createdAt)}</td>
                                            <td>{formatDate(lead.last_interaction_at)}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[lead.ai_status]}`}>
                                                    {lead.ai_status === 'active' ? '🟢 Ativo' :
                                                        lead.ai_status === 'paused' ? '⏸️ Pausado' : '👤 Humano'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
