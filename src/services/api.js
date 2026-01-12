import axios from 'axios';

// API Base URL - connects to our backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-painelsolar-sistema.r954jc.easypanel.host/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTH SERVICES
// ============================================

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async register(name, email, password, role = 'sales') {
        const response = await api.post('/auth/register', { name, email, password, role });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async getMe() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getStoredUser() {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    },

    isAuthenticated() {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('token');
        }
        return false;
    },
};

// ============================================
// PIPELINE SERVICES
// ============================================

export const pipelineService = {
    async getAll() {
        const response = await api.get('/pipelines');
        return response.data;
    },

    async getKanban() {
        const response = await api.get('/pipelines/kanban');
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/pipelines/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/pipelines', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/pipelines/${id}`, data);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/pipelines/${id}`);
        return response.data;
    },

    async reorder(orderedIds) {
        const response = await api.post('/pipelines/reorder', { orderedIds });
        return response.data;
    },
};

// ============================================
// LEAD SERVICES
// ============================================

export const leadService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        if (filters.pipeline_id) params.append('pipeline_id', filters.pipeline_id);
        if (filters.is_important !== undefined) params.append('is_important', filters.is_important);
        if (filters.source) params.append('source', filters.source);

        const response = await api.get(`/leads?${params.toString()}`);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/leads/${id}`);
        return response.data;
    },

    async getOverdue() {
        const response = await api.get('/leads/overdue');
        return response.data;
    },

    async getSlaAlerts() {
        const response = await api.get('/leads/sla-alerts');
        return response.data;
    },

    async create(data) {
        const response = await api.post('/leads', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/leads/${id}`, data);
        return response.data;
    },

    async move(id, pipelineId, orderIndex) {
        const response = await api.put(`/leads/${id}/move`, {
            pipeline_id: pipelineId,
            order_index: orderIndex,
        });
        return response.data;
    },

    async reorder(pipelineId, orderedLeadIds) {
        const response = await api.post('/leads/reorder', {
            pipeline_id: pipelineId,
            ordered_lead_ids: orderedLeadIds,
        });
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/leads/${id}`);
        return response.data;
    },

    async block(id) {
        const response = await api.put(`/leads/${id}/block`);
        return response.data;
    },

    async restore(id) {
        const response = await api.put(`/leads/${id}/restore`);
        return response.data;
    },

    async updateAiStatus(id, aiStatus) {
        const response = await api.patch(`/leads/${id}/ai-status`, { ai_status: aiStatus });
        return response.data;
    },
};

// ============================================
// TASK SERVICES
// ============================================

export const taskService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        if (filters.lead_id) params.append('lead_id', filters.lead_id);
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);

        const response = await api.get(`/tasks?${params.toString()}`);
        return response.data;
    },

    async getToday() {
        const response = await api.get('/tasks/today');
        return response.data;
    },

    async getOverdue() {
        const response = await api.get('/tasks/overdue');
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/tasks', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/tasks/${id}`, data);
        return response.data;
    },

    async markAsDone(id) {
        const response = await api.put(`/tasks/${id}/done`);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    },
};

// ============================================
// APPOINTMENT SERVICES
// ============================================

export const appointmentService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        if (filters.lead_id) params.append('lead_id', filters.lead_id);
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.date) params.append('date', filters.date);

        const response = await api.get(`/appointments?${params.toString()}`);
        return response.data;
    },

    async getToday() {
        const response = await api.get('/appointments/today');
        return response.data;
    },

    async getUpcoming(days = 7) {
        const response = await api.get(`/appointments/upcoming?days=${days}`);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/appointments/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/appointments', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/appointments/${id}`, data);
        return response.data;
    },

    async cancel(id) {
        const response = await api.put(`/appointments/${id}/cancel`);
        return response.data;
    },

    async complete(id) {
        const response = await api.put(`/appointments/${id}/complete`);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/appointments/${id}`);
        return response.data;
    },
};

// ============================================
// DASHBOARD / STATS SERVICES
// ============================================

export const dashboardService = {
    async getStats() {
        // Aggregate data from multiple endpoints
        try {
            const [pipelines, leads, tasks, appointments] = await Promise.all([
                pipelineService.getKanban(),
                leadService.getAll(),
                taskService.getAll(),
                appointmentService.getUpcoming(30),
            ]);

            // Calculate stats
            const totalLeads = leads.length;
            const importantLeads = leads.filter(l => l.is_important).length;
            const overdueLeads = leads.filter(l => l.sla_status === 'RED').length;

            const totalProposalValue = leads.reduce((sum, l) => sum + (parseFloat(l.proposal_value) || 0), 0);
            const avgTicket = totalLeads > 0 ? totalProposalValue / totalLeads : 0;

            const pendingTasks = tasks.filter(t => t.status === 'pending').length;
            const upcomingAppointments = appointments.length;

            // Source distribution
            const sourceData = {
                manual: leads.filter(l => l.source === 'manual').length,
                meta_ads: leads.filter(l => l.source === 'meta_ads').length,
                whatsapp: leads.filter(l => l.source === 'whatsapp').length,
            };

            // Funnel data (leads per pipeline)
            const funnelData = pipelines.map(p => ({
                name: p.title,
                value: p.leads?.length || 0,
                color: p.color,
            }));

            // Calculate time-series data for charts (last 6 months)
            const monthLabels = [];
            const leadsPerMonth = [];
            const conversionsPerMonth = [];

            const today = new Date();
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
                const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

                monthLabels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', ''));

                // Count leads created in this month
                const leadsInMonth = leads.filter(l => {
                    const createdAt = new Date(l.createdAt || l.created_at);
                    return createdAt >= monthStart && createdAt <= monthEnd;
                }).length;
                leadsPerMonth.push(leadsInMonth);

                // Count conversions (leads in 'Fechado' pipeline created this month)
                const closedPipeline = pipelines.find(p =>
                    p.title.toLowerCase().includes('fechado') ||
                    p.title.toLowerCase().includes('ganho') ||
                    p.title.toLowerCase().includes('convertido')
                );
                const conversionsInMonth = closedPipeline?.leads?.filter(l => {
                    const createdAt = new Date(l.createdAt || l.created_at);
                    return createdAt >= monthStart && createdAt <= monthEnd;
                }).length || 0;
                conversionsPerMonth.push(conversionsInMonth);
            }

            return {
                totalLeads,
                importantLeads,
                overdueLeads,
                totalProposalValue,
                avgTicket,
                pendingTasks,
                upcomingAppointments,
                sourceData,
                funnelData,
                pipelines,
                // Time-series data for charts
                leadsTimeSeries: {
                    labels: monthLabels,
                    leads: leadsPerMonth,
                    conversions: conversionsPerMonth,
                },
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },
};

// ============================================
// MESSAGE SERVICES
// ============================================

export const messageService = {
    async getHistory(leadId) {
        const response = await api.get(`/messages/history/${leadId}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/messages', data);
        return response.data;
    },

    async createWithMedia(formData) {
        const response = await api.post('/messages/media', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// ============================================
// SETTINGS SERVICES
// ============================================

export const settingsService = {
    async get(key) {
        const response = await api.get(`/settings/${key}`);
        return response.data;
    },

    async update(key, value) {
        const response = await api.put(`/settings/${key}`, { value });
        return response.data;
    },

    async getAll() {
        const response = await api.get('/settings');
        return response.data;
    },

    async getMonthlyGoal() {
        try {
            const response = await api.get('/settings/monthly_goal');
            return response.data.value || { target: 200000, current: 0 };
        } catch (error) {
            return { target: 200000, current: 0 };
        }
    },

    async updateMonthlyGoal(target, current) {
        const response = await api.put('/settings/monthly_goal', {
            value: { target, current },
        });
        return response.data;
    },
};

// ============================================
// WHATSAPP SERVICES
// ============================================

export const whatsAppService = {
    async checkStatus() {
        try {
            const response = await api.get('/webhook/status');
            return response.data;
        } catch (error) {
            console.error('Error checking WhatsApp status:', error);
            return { connected: false };
        }
    },
};

// ============================================
// SYSTEM SETTINGS SERVICES (AI Configuration)
// ============================================

export const systemSettingsService = {
    async getAll() {
        const response = await api.get('/system-settings');
        return response.data;
    },

    async get(key) {
        const response = await api.get(`/system-settings/${key}`);
        return response.data;
    },

    async update(key, value) {
        const response = await api.put(`/system-settings/${key}`, { value });
        return response.data;
    },

    async bulkUpdate(settings) {
        const response = await api.put('/system-settings', settings);
        return response.data;
    },
};

// ============================================
// FOLLOW-UP SERVICES
// ============================================

export const followupService = {
    async getPending() {
        const response = await api.get('/followup/pending');
        return response.data;
    },

    async getApproval() {
        const response = await api.get('/followup/approval');
        return response.data;
    },

    async send(leadId) {
        const response = await api.post(`/followup/send/${leadId}`);
        return response.data;
    },

    async approve(leadId) {
        const response = await api.post(`/followup/approve/${leadId}`);
        return response.data;
    },

    async setCustomMessage(leadId, message) {
        const response = await api.put(`/followup/custom/${leadId}`, {
            custom_followup_message: message,
        });
        return response.data;
    },

    async runJob() {
        const response = await api.post('/followup/run');
        return response.data;
    },

    async getRules() {
        const response = await api.get('/followup/rules');
        return response.data;
    },

    async createRule(ruleData) {
        const response = await api.post('/followup/rules', ruleData);
        return response.data;
    },

    async deleteRule(id) {
        const response = await api.delete(`/followup/rules/${id}`);
        return response.data;
    },

    async updateRule(id, ruleData) {
        const response = await api.put(`/followup/rules/${id}`, ruleData);
        return response.data;
    },
};

export default api;
