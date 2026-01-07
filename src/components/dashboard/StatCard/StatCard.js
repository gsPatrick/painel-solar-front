'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatCard.module.css';

export default function StatCard({
    icon: Icon,
    label,
    value,
    suffix,
    trend,
    trendValue,
    color = 'primary',
    loading = false,
    delay = 0,
}) {
    const colorMap = {
        primary: {
            iconBg: 'rgba(67, 24, 255, 0.1)',
            iconColor: '#4318FF',
            accent: '#4318FF',
        },
        success: {
            iconBg: 'rgba(16, 185, 129, 0.1)',
            iconColor: '#10B981',
            accent: '#10B981',
        },
        warning: {
            iconBg: 'rgba(245, 158, 11, 0.1)',
            iconColor: '#F59E0B',
            accent: '#F59E0B',
        },
        danger: {
            iconBg: 'rgba(239, 68, 68, 0.1)',
            iconColor: '#EF4444',
            accent: '#EF4444',
        },
        info: {
            iconBg: 'rgba(59, 130, 246, 0.1)',
            iconColor: '#3B82F6',
            accent: '#3B82F6',
        },
    };

    const colors = colorMap[color] || colorMap.primary;

    if (loading) {
        return (
            <div className={`${styles.statCard} ${styles.skeleton}`}>
                <div className={styles.skeletonIcon} />
                <div className={styles.content}>
                    <div className={`${styles.skeletonLabel} skeleton`} />
                    <div className={`${styles.skeletonValue} skeleton`} />
                    <div className={`${styles.skeletonTrend} skeleton`} />
                </div>
            </div>
        );
    }

    const getTrendClass = () => {
        if (trend === 'up') return styles.trendUp;
        if (trend === 'down') return styles.trendDown;
        return styles.trendNeutral;
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    return (
        <motion.div
            className={styles.statCard}
            style={{
                '--icon-bg': colors.iconBg,
                '--icon-color': colors.iconColor,
                '--accent-color': colors.accent,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.02 }}
        >
            <div className={styles.iconWrapper}>
                <Icon />
            </div>
            <div className={styles.content}>
                <div className={styles.label}>{label}</div>
                <div className={styles.valueWrapper}>
                    <span className={styles.value}>{value}</span>
                    {suffix && <span className={styles.suffix}>{suffix}</span>}
                </div>
                {trendValue && (
                    <span className={`${styles.trend} ${getTrendClass()}`}>
                        <TrendIcon size={12} />
                        {trendValue}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
