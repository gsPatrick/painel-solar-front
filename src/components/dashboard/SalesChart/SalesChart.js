'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import styles from './SalesChart.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export function FunnelChart({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className={styles.chartCard}>
                <div className={styles.header}>
                    <div>
                        <div className={`${styles.skeletonTitle} skeleton`} />
                        <div className={`${styles.skeletonSubtitle} skeleton`} />
                    </div>
                </div>
                <div className={styles.skeletonChart} />
            </div>
        );
    }

    const chartData = {
        labels: data.map((d) => d.name),
        datasets: [
            {
                label: 'Leads',
                data: data.map((d) => d.value),
                backgroundColor: data.map((d) => d.color || '#4318FF'),
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1B2559',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#A3AED0',
                    font: { size: 11 },
                },
            },
            y: {
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                },
                ticks: {
                    color: '#A3AED0',
                    font: { size: 11 },
                },
            },
        },
    };

    return (
        <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>Funil de Vendas</h3>
                    <p className={styles.subtitle}>Leads por etapa do funil</p>
                </div>
                <div className={styles.filters}>
                    <button className={`${styles.filterBtn} ${styles.active}`}>
                        Este Mês
                    </button>
                    <button className={styles.filterBtn}>Semana</button>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <Bar data={chartData} options={options} />
            </div>

            <div className={styles.legend}>
                {data.map((item, index) => (
                    <div key={index} className={styles.legendItem}>
                        <span
                            className={styles.legendDot}
                            style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                        <span className={styles.legendValue}>{item.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export function SourceChart({ data = {}, loading = false }) {
    if (loading) {
        return (
            <div className={styles.chartCard}>
                <div className={styles.header}>
                    <div>
                        <div className={`${styles.skeletonTitle} skeleton`} />
                        <div className={`${styles.skeletonSubtitle} skeleton`} />
                    </div>
                </div>
                <div className={styles.skeletonChart} />
            </div>
        );
    }

    const chartData = {
        labels: ['Manual', 'Meta Ads', 'WhatsApp'],
        datasets: [
            {
                data: [data.manual || 0, data.meta_ads || 0, data.whatsapp || 0],
                backgroundColor: ['#4318FF', '#F97316', '#10B981'],
                borderWidth: 0,
                cutout: '70%',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1B2559',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
            },
        },
    };

    const total = (data.manual || 0) + (data.meta_ads || 0) + (data.whatsapp || 0);

    return (
        <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>Origem dos Leads</h3>
                    <p className={styles.subtitle}>Distribuição por canal</p>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <Doughnut data={chartData} options={options} />
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1B2559' }}>
                        {total}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#A3AED0' }}>Total</div>
                </div>
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#4318FF' }} />
                    Manual
                    <span className={styles.legendValue}>{data.manual || 0}</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#F97316' }} />
                    Meta Ads
                    <span className={styles.legendValue}>{data.meta_ads || 0}</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }} />
                    WhatsApp
                    <span className={styles.legendValue}>{data.whatsapp || 0}</span>
                </div>
            </div>
        </motion.div>
    );
}

export default FunnelChart;
