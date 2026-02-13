'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Key,
    Trash2,
    Mail,
    Shield,
    Search,
    X,
    Check,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import api, { authService } from '@/services/api';
import styles from './page.module.css';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'sales' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const currentUser = authService.getStoredUser();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/users');
            setUsers(response.data.users);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Falha ao carregar usuários. Verifique se você tem permissão de administrador.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.post('/auth/register', formData);
            setSuccess('Usuário criado com sucesso!');
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'sales' });
            loadUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao criar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await api.put(`/auth/users/${selectedUser.id}`, { password: passwordData.password });
            setSuccess('Senha alterada com sucesso!');
            setIsPasswordModalOpen(false);
            setPasswordData({ password: '', confirmPassword: '' });
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao alterar senha');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

        try {
            await api.delete(`/auth/users/${userId}`);
            setSuccess('Usuário excluído!');
            loadUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Erro ao excluir usuário');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Header title="Gestão de Usuários" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Usuários do Sistema</h1>
                        <p className={styles.subtitle}>Gerencie quem tem acesso ao painel</p>
                    </div>

                    <button
                        className={styles.btnAdd}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <UserPlus size={20} />
                        Novo Usuário
                    </button>
                </div>

                {success && (
                    <motion.div
                        className={styles.alertSuccess}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Check size={18} />
                        {success}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        className={styles.alertError}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError(null)}><X size={16} /></button>
                    </motion.div>
                )}

                <div className={styles.searchBar}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.userList}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <Loader2 size={40} className={styles.spin} />
                            <p>Carregando usuários...</p>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <motion.div
                                key={user.id}
                                className={styles.userCard}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className={styles.userName}>
                                            {user.name}
                                            {user.id === currentUser?.id && <span className={styles.badgeMe}>Eu</span>}
                                        </h3>
                                        <p className={styles.userEmail}><Mail size={14} /> {user.email}</p>
                                    </div>
                                </div>

                                <div className={styles.userMeta}>
                                    <div className={`${styles.roleBadge} ${styles[user.role]}`}>
                                        <Shield size={14} />
                                        {user.role === 'admin' ? 'Administrador' : user.role === 'sales' ? 'Consultor' : 'Visualizador'}
                                    </div>

                                    <div className={styles.userActions}>
                                        <button
                                            className={styles.actionBtn}
                                            title="Resetar Senha"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsPasswordModalOpen(true);
                                            }}
                                        >
                                            <Key size={18} />
                                        </button>

                                        {user.id !== currentUser?.id && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.btnDelete}`}
                                                title="Excluir Usuário"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <Users size={48} />
                            <p>Nenhum usuário encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Adicionar Usuário */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className={styles.modalOverlay}>
                        <motion.div
                            className={styles.modal}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className={styles.modalHeader}>
                                <h2>Criar Novo Usuário</h2>
                                <button onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleAddUser} className={styles.modalForm}>
                                <div className={styles.inputGroup}>
                                    <label>Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Digite o nome"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Senha Inicial</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Nível de Acesso</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="sales">Consultor (Vendas)</option>
                                        <option value="admin">Administrador</option>
                                        <option value="viewer">Visualizador (Apenas consulta)</option>
                                    </select>
                                </div>

                                <div className={styles.modalActions}>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className={styles.btnSecondary}>Cancelar</button>
                                    <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                                        {submitting ? 'Criando...' : 'Criar Usuário'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Resetar Senha */}
            <AnimatePresence>
                {isPasswordModalOpen && (
                    <div className={styles.modalOverlay}>
                        <motion.div
                            className={styles.modal}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className={styles.modalHeader}>
                                <h2>Alterar Senha</h2>
                                <button onClick={() => setIsPasswordModalOpen(false)}><X size={20} /></button>
                            </div>

                            <div className={styles.modalInfo}>
                                <p>Alterando senha para <strong>{selectedUser?.name}</strong></p>
                            </div>

                            <form onSubmit={handleResetPassword} className={styles.modalForm}>
                                <div className={styles.inputGroup}>
                                    <label>Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Repita a senha"
                                    />
                                </div>

                                <div className={styles.modalActions}>
                                    <button type="button" onClick={() => setIsPasswordModalOpen(false)} className={styles.btnSecondary}>Cancelar</button>
                                    <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                                        {submitting ? 'Salvando...' : 'Alterar Senha'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
