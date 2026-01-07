'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Header from '@/components/layout/Header/Header';
import { dashboardService } from '@/services/api'; // Import dashboardService
import styles from './page.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadStats();
    }, [period]);

    const loadStats = async () => {
        setLoading(true);
        try {
            // In a real app, pass 'period' to filtering logic
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data from real stats
    const lineChartData = {
        labels: stats?.leadsTimeSeries?.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
            {
                label: 'Leads',
                data: stats?.leadsTimeSeries?.leads || [0, 0, 0, 0, 0, 0],
                borderColor: '#4318FF',
                backgroundColor: 'rgba(67, 24, 255, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Conversões',
                data: stats?.leadsTimeSeries?.conversions || [0, 0, 0, 0, 0, 0],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const funnelLabels = stats?.pipelines?.map(p => p.title) || [];
    const funnelValues = stats?.pipelines?.map(p => p.leads?.length || 0) || [];
    const funnelColors = stats?.pipelines?.map(p => p.color) || [];

    const barChartData = {
        labels: funnelLabels.length ? funnelLabels : ['Novo Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado'],
        datasets: [
            {
                label: 'Leads por Etapa',
                data: funnelValues.length ? funnelValues : [0, 0, 0, 0, 0],
                backgroundColor: funnelColors.length ? funnelColors : ['#4318FF'],
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: '600' },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 12 } },
            },
            y: {
                grid: { color: '#F1F5F9' },
                ticks: { font: { size: 12 } },
            },
        },
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    // Calculate dynamic values
    const conversionRate = stats?.totalLeads > 0
        ? ((stats?.pipelines?.find(p => p.title.toLowerCase().includes('fechado'))?.leads?.length || 0) / stats.totalLeads * 100).toFixed(1)
        : 0;

    return (
        <>
            <Header title="Analytics" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.tabs}>
                        {['7d', '30d', '90d', '12m'].map((p) => (
                            <button
                                key={p}
                                className={`${styles.tab} ${period === p ? styles.active : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p === '12m' ? '12 meses' : p.replace('d', ' dias')}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados...</div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className={styles.statsGrid}>
                            <motion.div
                                className={styles.statCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0 }}
                            >
                                <div className={styles.statHeader}>
                                    <div className={`${styles.statIcon} ${styles.primary}`}>
                                        <Users size={22} />
                                    </div>
                                    <span className={`${styles.statTrend} ${styles.up}`}>
                                        <ArrowUpRight size={14} />
                                        +12%
                                    </span>
                                </div>
                                <div className={styles.statValue}>{stats?.totalLeads || 0}</div>
                                <div className={styles.statLabel}>Total de Leads</div>
                            </motion.div>

                            <motion.div
                                className={styles.statCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className={styles.statHeader}>
                                    <div className={`${styles.statIcon} ${styles.success}`}>
                                        <Target size={22} />
                                    </div>
                                    <span className={`${styles.statTrend} ${styles.up}`}>
                                        <ArrowUpRight size={14} />
                                        +5%
                                    </span>
                                </div>
                                <div className={styles.statValue}>{conversionRate}%</div>
                                <div className={styles.statLabel}>Taxa de Conversão</div>
                            </motion.div>

                            <motion.div
                                className={styles.statCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className={styles.statHeader}>
                                    <div className={`${styles.statIcon} ${styles.warning}`}>
                                        <DollarSign size={22} />
                                    </div>
                                    <span className={`${styles.statTrend} ${styles.up}`}>
                                        <ArrowUpRight size={14} />
                                        +8%
                                    </span>
                                </div>
                                <div className={styles.statValue}>{formatCurrency(stats?.totalProposalValue)}</div>
                                <div className={styles.statLabel}>Valor em Propostas</div>
                            </motion.div>

                            <motion.div
                                className={styles.statCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className={styles.statHeader}>
                                    <div className={`${styles.statIcon} ${styles.danger}`}>
                                        <Zap size={22} />
                                    </div>
                                    <span className={`${styles.statTrend} ${styles.down}`}>
                                        <ArrowDownRight size={14} />
                                        -2%
                                    </span>
                                </div>
                                <div className={styles.statValue}>{formatCurrency(stats?.avgTicket)}</div>
                                <div className={styles.statLabel}>Ticket Médio</div>
                            </motion.div>
                        </div>

                        {/* Charts Grid */}
                        <div className={styles.chartsGrid}>
                            <motion.div
                                className={styles.chartCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className={styles.chartHeader}>
                                    <h3 className={styles.chartTitle}>Evolução de Leads e Conversões</h3>
                                </div>
                                <div className={styles.chartCanvas}>
                                    <Line data={lineChartData} options={chartOptions} />
                                </div>
                            </motion.div>

                            {/* Funnel Chart (Replaces Top Performers for relevance if no performer data) */}
                            <motion.div
                                className={styles.chartCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className={styles.chartHeader}>
                                    <h3 className={styles.chartTitle}>Funil de Vendas</h3>
                                </div>
                                <div className={styles.chartCanvas}>
                                    <Bar data={barChartData} options={chartOptions} />
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
