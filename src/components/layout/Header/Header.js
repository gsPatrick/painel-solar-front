'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Bell,
    Settings,
    ChevronDown,
    Sun,
    User,
    LogOut,
    X,
    Users,
    CheckSquare,
    Calendar,
    MessageSquare,
    AlertCircle,
    Clock,
    Menu
} from 'lucide-react';
import { authService, leadService, taskService } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useSidebar } from '@/contexts/SidebarContext';
import styles from './Header.module.css';

export default function Header({ title = 'Dashboard' }) {
    const router = useRouter();
    const { notifications, slaLeads, markAsRead, markAllAsRead } = useNotification();
    const { toggle } = useSidebar(); // Consume sidebar context
    const [user, setUser] = useState(null);

    // Dropdowns
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ leads: [], tasks: [] });
    const [searching, setSearching] = useState(false);

    const searchRef = useRef(null);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search functionality
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults({ leads: [], tasks: [] });
            return;
        }

        const search = async () => {
            setSearching(true);
            try {
                // Try API first
                const [leads, tasks] = await Promise.all([
                    leadService.getAll(),
                    taskService.getAll(),
                ]);

                const q = searchQuery.toLowerCase();
                setSearchResults({
                    leads: leads.filter(l => l.name?.toLowerCase().includes(q)).slice(0, 5),
                    tasks: tasks.filter(t => t.title?.toLowerCase().includes(q)).slice(0, 5),
                });
            } catch (error) {
                // Demo search
                const q = searchQuery.toLowerCase();
                setSearchResults({
                    leads: [
                        { id: '1', name: 'Roberto Ferreira', phone: '11999887766' },
                        { id: '2', name: 'Fernanda Lima', phone: '11988776655' },
                    ].filter(l => l.name.toLowerCase().includes(q)),
                    tasks: [
                        { id: '1', title: 'Follow-up com Roberto' },
                        { id: '2', title: 'Enviar proposta Fernanda' },
                    ].filter(t => t.title.toLowerCase().includes(q)),
                });
            }
            setSearching(false);
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleLabel = (role) => {
        const roles = { admin: 'Administrador', sales: 'Vendedor' };
        return roles[role] || 'Usuário';
    };

    const handleLogout = () => {
        authService.logout();
        router.push('/login');
    };

    const getNotifIcon = (type) => {
        switch (type) {
            case 'sla': return <AlertCircle size={16} />;
            case 'task': return <CheckSquare size={16} />;
            case 'lead': return <Users size={16} />;
            case 'message': return <MessageSquare size={16} />;
            default: return <Bell size={16} />;
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    // Combine SLA leads with regular notifications
    const allNotifications = [
        ...slaLeads.map(lead => ({
            id: `sla-${lead.id}`,
            type: 'sla',
            title: 'SLA Estourado',
            message: `Lead "${lead.name}" há ${lead.days_overdue || 3}+ dias sem interação`,
            time: new Date().toISOString(),
            read: false
        })),
        ...notifications
    ].slice(0, 20);

    const unreadCount = allNotifications.filter(n => !n.read).length;

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button className={styles.menuBtn} onClick={toggle}>
                    <Menu size={24} />
                </button>
                <h1 className={styles.pageTitle}>{title}</h1>
                <div className={styles.breadcrumb}>
                    <span><Sun size={14} /> DGE Energia</span>
                    <span>/</span>
                    <span>{title}</span>
                </div>
            </div>

            <div className={styles.right}>
                {/* Search */}
                <div className={styles.searchWrapper} ref={searchRef}>
                    <div className={styles.searchBox}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar leads, tarefas..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSearch(true)}
                        />
                        {searchQuery && (
                            <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {showSearch && searchQuery && (
                            <motion.div
                                className={styles.dropdown}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                {searching ? (
                                    <div className={styles.dropdownLoading}>Buscando...</div>
                                ) : (
                                    <>
                                        {searchResults.leads.length > 0 && (
                                            <div className={styles.dropdownSection}>
                                                <div className={styles.dropdownLabel}>Leads</div>
                                                {searchResults.leads.map(lead => (
                                                    <button
                                                        key={lead.id}
                                                        className={styles.dropdownItem}
                                                        onClick={() => { router.push('/leads'); setShowSearch(false); }}
                                                    >
                                                        <Users size={16} />
                                                        <span>{lead.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.tasks.length > 0 && (
                                            <div className={styles.dropdownSection}>
                                                <div className={styles.dropdownLabel}>Tarefas</div>
                                                {searchResults.tasks.map(task => (
                                                    <button
                                                        key={task.id}
                                                        className={styles.dropdownItem}
                                                        onClick={() => { router.push('/tasks'); setShowSearch(false); }}
                                                    >
                                                        <CheckSquare size={16} />
                                                        <span>{task.title}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.leads.length === 0 && searchResults.tasks.length === 0 && (
                                            <div className={styles.dropdownEmpty}>Nenhum resultado encontrado</div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className={styles.notifWrapper} ref={notifRef}>
                    <button
                        className={styles.iconButton}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                className={styles.dropdown}
                                style={{ right: 0, width: 340 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <div className={styles.dropdownHeader}>
                                    <span>Notificações</span>
                                    <button className={styles.markRead} onClick={markAllAsRead}>
                                        Marcar todas como lidas
                                    </button>
                                </div>
                                <div className={styles.notifList}>
                                    {allNotifications.length === 0 ? (
                                        <div className={styles.notifEmpty}>
                                            Nenhuma notificação
                                        </div>
                                    ) : (
                                        allNotifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`${styles.notifItem} ${!notif.read ? styles.unread : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className={`${styles.notifIcon} ${styles[notif.type]}`}>
                                                    {getNotifIcon(notif.type)}
                                                </div>
                                                <div className={styles.notifContent}>
                                                    <div className={styles.notifTitle}>{notif.title}</div>
                                                    <div className={styles.notifMessage}>{notif.message}</div>
                                                    <div className={styles.notifTime}>
                                                        <Clock size={12} /> {formatTime(notif.time)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Settings */}
                <button className={styles.iconButton} onClick={() => router.push('/settings')}>
                    <Settings size={20} />
                </button>

                {/* Profile */}
                <div className={styles.profileWrapper} ref={profileRef}>
                    <div className={styles.userMenu} onClick={() => setShowProfile(!showProfile)}>
                        <div className={styles.avatar}>{user ? getInitials(user.name) : 'U'}</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name || 'Usuário'}</span>
                            <span className={styles.userRole}>{user ? getRoleLabel(user.role) : 'Carregando...'}</span>
                        </div>
                        <ChevronDown className={styles.chevron} />
                    </div>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                className={styles.dropdown}
                                style={{ right: 0, width: 200 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <button className={styles.dropdownItem} onClick={() => { router.push('/settings'); setShowProfile(false); }}>
                                    <User size={16} />
                                    <span>Meu Perfil</span>
                                </button>
                                <button className={styles.dropdownItem} onClick={() => { router.push('/settings'); setShowProfile(false); }}>
                                    <Settings size={16} />
                                    <span>Configurações</span>
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Sair</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
