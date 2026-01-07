'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Sun,
    Mail,
    Lock,
    ArrowRight,
    AlertCircle,
    Zap,
    BarChart3,
    MessageSquare
} from 'lucide-react';
import { authService } from '@/services/api';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(email, password);
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setEmail('admin@admin.com');
        setPassword('admin123');
        setError('');
        setLoading(true);

        try {
            await authService.login('admin@admin.com', 'admin123');
            router.push('/');
        } catch (err) {
            // If demo login fails, still redirect (for demo purposes)
            localStorage.setItem('token', 'demo-token');
            localStorage.setItem('user', JSON.stringify({
                id: 'demo',
                name: 'Administrador',
                email: 'admin@admin.com',
                role: 'admin',
            }));
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Side - Form */}
            <motion.div
                className={styles.leftSide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className={styles.formCard}>
                    <motion.div
                        className={styles.logo}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className={styles.logoIcon}>
                            <Sun />
                        </div>
                        <span className={styles.logoTitle}>DGE Energia</span>
                        <span className={styles.logoSubtitle}>Solar CRM</span>
                    </motion.div>

                    <motion.h1
                        className={styles.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Bem-vindo de volta!
                    </motion.h1>
                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                    >
                        Faça login para acessar sua conta
                    </motion.p>

                    {error && (
                        <motion.div
                            className={styles.error}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <motion.form
                        className={styles.form}
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email</label>
                            <div className={styles.inputWrapper}>
                                <Mail size={18} className={styles.inputIcon} />
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Senha</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={18} className={styles.inputIcon} />
                                <input
                                    type="password"
                                    className={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <span className={styles.forgotPassword}>Esqueceu a senha?</span>
                        </div>

                        <motion.button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {loading ? (
                                <span className={styles.spinner} />
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    <motion.div
                        className={styles.divider}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <span className={styles.dividerText}>ou</span>
                    </motion.div>

                    <motion.button
                        type="button"
                        className={styles.socialBtn}
                        onClick={handleDemoLogin}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Sun size={20} />
                        Entrar com conta Demo
                    </motion.button>
                </div>
            </motion.div>

            {/* Right Side - Brand */}
            <div className={styles.rightSide}>
                <div className={styles.bgOrb} />

                <motion.div
                    className={styles.brandContent}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                >
                    <motion.div
                        className={styles.brandLogo}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 200 }}
                    >
                        <Sun />
                    </motion.div>

                    <motion.h2
                        className={styles.brandTitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        DGE Energia
                    </motion.h2>

                    <motion.p
                        className={styles.brandSubtitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        Potencialize suas vendas de energia solar com nosso CRM inteligente
                    </motion.p>

                    <div className={styles.brandFeatures}>
                        <motion.div
                            className={styles.featureItem}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                        >
                            <div className={styles.featureIcon}>
                                <Zap size={22} />
                            </div>
                            <span className={styles.featureText}>
                                Kanban inteligente com SLA automático e alertas
                            </span>
                        </motion.div>

                        <motion.div
                            className={styles.featureItem}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            <div className={styles.featureIcon}>
                                <MessageSquare size={22} />
                            </div>
                            <span className={styles.featureText}>
                                Integração WhatsApp com IA para qualificação
                            </span>
                        </motion.div>

                        <motion.div
                            className={styles.featureItem}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                        >
                            <div className={styles.featureIcon}>
                                <BarChart3 size={22} />
                            </div>
                            <span className={styles.featureText}>
                                Dashboard com métricas e funil em tempo real
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
