'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sun,
    LayoutDashboard,
    Kanban,
    Calendar,
    Users,
    CheckSquare,
    MessageSquare,
    Settings,
    TrendingUp,
    Pencil,
    X,
    Check,
    RefreshCw,
    Bell,



    Shield,
    Megaphone
} from 'lucide-react';
import { settingsService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useSidebar } from '@/contexts/SidebarContext';
import styles from './Sidebar.module.css';

const navItems = [
    {
        section: 'Menu',
        items: [
            { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/kanban', icon: Kanban, label: 'Kanban', badge: null },
            { href: '/agenda', icon: Calendar, label: 'Agenda' },
        ],
    },
    {
        section: 'Gestão',
        items: [
            { href: '/leads', icon: Users, label: 'Leads', badge: null },
            { href: '/marketing', icon: Megaphone, label: 'Disparos em Massa', badge: null },
            { href: '/tasks', icon: CheckSquare, label: 'Lembretes', badge: 5 },
            { href: '/messages', icon: MessageSquare, label: 'Modo Mensagem', isFullscreen: true },
        ],
    },
    {
        section: 'Sistema',
        items: [
            { href: '/follow-up', icon: RefreshCw, label: 'Follow-up' },
            { href: '/backup', icon: Shield, label: 'Backup & Segurança' },
            { href: '/notifications', icon: Bell, label: 'Notificações' },
            { href: '/analytics', icon: TrendingUp, label: 'Analytics' },
            { href: '/settings', icon: Settings, label: 'Configurações' },
        ],
    },
];


export default function Sidebar() {
    const pathname = usePathname();
    const { counts } = useNotification();
    const { isOpen, close } = useSidebar(); // Consume context

    const [goal, setGoal] = useState({ target: 200000, current: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    // Load monthly goal on mount
    useEffect(() => {
        const loadGoal = async () => {
            try {
                const goalData = await settingsService.getMonthlyGoal();
                setGoal(goalData);
            } catch (error) {
                console.error('Error loading goal:', error);
            }
        };
        loadGoal();
    }, []);

    // Map dynamic counts to nav items
    const getBadge = (label) => {
        if (label === 'Tarefas') return counts.tasks > 0 ? counts.tasks : null;
        if (label === 'Mensagens') return counts.messages > 0 ? counts.messages : null;
        return null;
    };

    const formatCurrency = (value) => {
        if (value >= 1000000) {
            return `R$ ${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `R$ ${(value / 1000).toFixed(0)}K`;
        }
        return `R$ ${value}`;
    };

    const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;

    const handleEditClick = () => {
        setEditValue((goal.target / 1000).toString());
        setIsEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const newTarget = parseFloat(editValue) * 1000;
            await settingsService.updateMonthlyGoal(newTarget, goal.current);
            setGoal(prev => ({ ...prev, target: newTarget }));
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving goal:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.mobileOverlay} ${isOpen ? styles.overlayOpen : ''}`}
                onClick={close}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 190,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'all' : 'none',
                    transition: 'opacity 0.3s ease',
                    display: 'none' // Hidden by default, shown via CSS query below
                }}
            />
            {/* Add display logic for overlay in CSS or keep inline style with media query check? 
                Better to add a style block for the overlay media query to ensure it only shows on mobile
             */}
            <style jsx>{`
                @media (max-width: 1024px) {
                    .${styles.mobileOverlay} {
                        display: block !important;
                    }
                }
             `}</style>

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={styles.logoIcon}>
                            <Sun />
                        </div>
                        <div className={styles.logoText}>
                            <span className={styles.logoTitle}>DGE Energia</span>
                            <span className={styles.logoSubtitle}>Solar CRM</span>
                        </div>
                    </div>
                    <button className={styles.mobileCloseBtn} onClick={close}>
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((section) => (
                        <div key={section.section} className={styles.navSection}>
                            <span className={styles.navLabel}>{section.section}</span>
                            <div className={styles.navItems}>
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    const badge = getBadge(item.label);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                                        >
                                            <Icon className={styles.navIcon} />
                                            {item.label}
                                            {badge && (
                                                <span className={styles.navBadge}>{badge}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Monthly Goal Card */}
                <div className={styles.footer}>
                    <div className={styles.statsCard}>
                        <div className={styles.statsTitleRow}>
                            <span className={styles.statsTitle}>Meta Mensal</span>
                            {!isEditing && (
                                <button
                                    className={styles.editBtn}
                                    onClick={handleEditClick}
                                    title="Editar meta"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className={styles.editForm}>
                                <div className={styles.inputGroup}>
                                    <span className={styles.inputPrefix}>R$</span>
                                    <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        placeholder="200"
                                        className={styles.goalInput}
                                        autoFocus
                                    />
                                    <span className={styles.inputSuffix}>K</span>
                                </div>
                                <div className={styles.editActions}>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        <X size={16} />
                                    </button>
                                    <button
                                        className={styles.saveBtn}
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.statsValue}>{formatCurrency(goal.current)}</div>
                                <div className={styles.statsLabel}>
                                    de {formatCurrency(goal.target)} ({progress.toFixed(1)}%)
                                </div>
                                <div className={styles.statsProgress}>
                                    <div
                                        className={styles.statsProgressBar}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
