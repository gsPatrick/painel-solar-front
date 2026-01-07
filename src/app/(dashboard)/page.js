'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Check,
  Star,
  GripVertical
} from 'lucide-react';
import Header from '@/components/layout/Header/Header';
import StatCard from '@/components/dashboard/StatCard/StatCard';
import { FunnelChart, SourceChart } from '@/components/dashboard/SalesChart/SalesChart';
import { dashboardService, taskService, leadService, pipelineService } from '@/services/api';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import styles from './page.module.css';

// Sortable Component Wrapper
function SortableItem({ id, children, className }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    touchAction: 'none'
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        title="Arrastar para reordenar"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [pipelines, setPipelines] = useState([]);

  // Modal state
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  // Dashboard items
  const DEFAULT_LAYOUT = [
    'stat-leads', 'stat-revenue', 'stat-ticket', 'stat-appointments',
    'chart-funnel', 'chart-source',
    'activity-tasks', 'activity-leads'
  ];

  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLocked, setIsLocked] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadDashboardData();
    const savedLayout = localStorage.getItem('dashboard_layout');
    setItems(savedLayout ? JSON.parse(savedLayout) : DEFAULT_LAYOUT);
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('dashboard_layout', JSON.stringify(items));
    }
  }, [items]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, tasksData, leadsData, pipelinesData] = await Promise.all([
        dashboardService.getStats(),
        taskService.getAll({ status: 'pending' }), // Fetch pending tasks
        leadService.getAll(), // Fetch all leads for "Recent Leads" list
        pipelineService.getAll()
      ]);

      setData(statsData);

      // Filter next 5 pending tasks if API returns all
      setTasks(tasksData.slice(0, 5));

      // Sort leads by creation date (descending) and take top 5
      const sortedLeads = leadsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLeads(sortedLeads.slice(0, 5));

      setPipelines(pipelinesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // If error, we might leave empty or use partial data
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    if (isLocked) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    if (isLocked) return;
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const handleLeadSubmit = async (data) => {
    try {
      if (selectedLead) {
        await leadService.update(selectedLead.id, data);
      } else {
        await leadService.create(data);
      }
      setShowLeadModal(false);
      loadDashboardData(); // Refresh dashboard to show updates
    } catch (error) {
      console.error('Error updating/creating lead:', error);
    }
  };

  // Helper values
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
  const getInitials = (n) => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || 'LE';

  // Map simplified SLA status if backend returns complex objects, or use directly
  const getSlaClass = (s) => ({ GREEN: styles.green, YELLOW: styles.yellow, RED: styles.red }[s] || '');

  // Render components based on ID
  const renderItem = (id) => {
    if (loading && !data) {
      // Render skeletons or loading placeholders if strictly needed, 
      // but StatCard handles 'loading' prop.
    }

    switch (id) {
      case 'stat-leads':
        return <StatCard icon={Users} label="Total de Leads" value={data?.totalLeads || 0} trend="up" trendValue="+12%" color="primary" loading={loading} />;
      case 'stat-revenue':
        return <StatCard icon={DollarSign} label="Valor em Propostas" value={formatCurrency(data?.totalProposalValue)} trend="up" trendValue="+8%" color="success" loading={loading} />;
      case 'stat-ticket':
        return <StatCard icon={TrendingUp} label="Ticket Médio" value={formatCurrency(data?.avgTicket)} trend="up" trendValue="+5%" color="info" loading={loading} />;
      case 'stat-appointments':
        return <StatCard icon={Calendar} label="Agendamentos" value={data?.upcomingAppointments || 0} suffix="próximos" color="warning" loading={loading} />;

      case 'chart-funnel':
        return (
          <div style={{ height: '100%' }}>
            <FunnelChart data={data?.funnelData || []} loading={loading} />
          </div>
        );
      case 'chart-source':
        return (
          <div style={{ height: '100%' }}>
            <SourceChart data={data?.sourceData || {}} loading={loading} />
          </div>
        );

      case 'activity-tasks':
        return (
          <div className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <h3 className={styles.activityTitle}>Tarefas Pendentes</h3>
              <span className={styles.viewAll}>Ver todas</span>
            </div>
            <div className={styles.taskList}>
              {loading ? <div className={styles.loadingText}>Carregando...</div> : tasks.length === 0 ? <div className={styles.emptyText}>Nenhuma tarefa pendente</div> : tasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={`${styles.taskCheck} ${task.status === 'done' ? styles.done : ''}`}>
                    {task.status === 'done' && <Check size={12} />}
                  </div>
                  <div className={styles.taskContent}>
                    <div className={styles.taskTitle}>{task.title}</div>
                    <div className={styles.taskMeta}>{task.leadName || task.lead?.name || 'Lead'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'activity-leads':
        return (
          <div className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <h3 className={styles.activityTitle}>Leads Recentes</h3>
              <span className={styles.viewAll}>Ver todos</span>
            </div>
            <div className={styles.leadList}>
              {loading ? <div className={styles.loadingText}>Carregando...</div> : leads.length === 0 ? <div className={styles.emptyText}>Nenhum lead recente</div> : leads.map((lead) => (
                <div
                  key={lead.id}
                  className={`${styles.leadItem} ${getSlaClass(lead.sla_status)}`}
                  onClick={() => handleLeadClick(lead)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.leadAvatar}>{getInitials(lead.name)}</div>
                  <div className={styles.leadInfo}>
                    <div className={styles.leadName}>
                      {lead.is_important && <Star size={14} style={{ marginRight: 4, color: '#F97316' }} />}
                      {lead.name}
                    </div>
                    {/* Display Pipeline Stage Name if object or raw string */}
                    <div className={styles.leadStage}>{lead.pipeline?.title || lead.pipeline || 'Novo Lead'}</div>
                  </div>
                  {(lead.proposal_value || lead.value) > 0 ? <span className={styles.leadValue}>{formatCurrency(lead.proposal_value || lead.value)}</span> : null}
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const getItemStyle = (id) => {
    // Define spans for grid
    if (id.startsWith('stat-')) return { gridColumn: 'span 1' };
    if (id.startsWith('chart-')) return { gridColumn: 'span 2' }; // Charts take 2 columns
    if (id.startsWith('activity-')) return { gridColumn: 'span 2' }; // Activity lists take 2 columns
    return {};
  };

  return (
    <>
      <Header
        title="Dashboard"
        rightContent={
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={styles.lockBtn}
            title={isLocked ? "Desbloquear Layout" : "Bloquear Layout"}
          >
            {isLocked ? "🔒 Layout Travado" : "🔓 Layout Destravado"}
          </button>
        }
      />
      <div className={styles.container}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className={styles.dashboardGrid}>
              {items.map(id => (
                <SortableItem key={id} id={id} className={`${styles.gridItem} ${getItemStyle(id).gridColumn === 'span 2' ? styles.span2 : ''}`}>
                  {renderItem(id)}
                  {!isLocked && <div className={styles.dragOverlay} />}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className={`${styles.gridItem} ${styles.dragging} ${getItemStyle(activeId).gridColumn === 'span 2' ? styles.span2 : ''}`}>
                {renderItem(activeId)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showLeadModal && (
        <LeadModal
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          lead={selectedLead}
          pipelines={pipelines}
          onSubmit={handleLeadSubmit}
        />
      )}
    </>
  );
}
