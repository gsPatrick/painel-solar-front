'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sun, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
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
            setError(err.response?.data?.error || 'Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.loginCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Logo */}
                <motion.div
                    className={styles.logo}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <div className={styles.logoIcon}>
                        <Sun size={28} />
                    </div>
                    <div className={styles.logoText}>
                        <span className={styles.logoTitle}>DGE Energia</span>
                        <span className={styles.logoSubtitle}>Solar CRM</span>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Entrar
                </motion.h1>

                {/* Error */}
                {error && (
                    <motion.div
                        className={styles.error}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </motion.div>
                )}

                {/* Form */}
                <motion.form
                    className={styles.form}
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <div className={styles.inputWrapper}>
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Senha</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <span className={styles.spinner} />
                        ) : (
                            <>
                                Entrar
                                <ArrowRight size={18} />
                            </>
                        )}
                    </motion.button>
                </motion.form>

                {/* Footer */}
                <p className={styles.footer}>
                    © {new Date().getFullYear()} DGE Energia
                </p>
            </motion.div>
        </div>
    );
}
