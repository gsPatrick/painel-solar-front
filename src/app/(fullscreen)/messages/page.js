'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    Search,
    Phone,
    MoreVertical,
    MessageSquare,
    User,
    Clock,
    RefreshCw,
    Plus,
    Image,
    Video,
    Mic,
    Paperclip,
    X,
    Facebook,
    MessageCircle,
    Square,
    Trash2,
    Bot,
    PauseCircle,
    PlayCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { pipelineService, leadService, messageService } from '@/services/api';
import KanbanBoard from '@/components/kanban/KanbanBoard/KanbanBoard';
import LeadModal from '@/components/leads/LeadModal/LeadModal';
import PipelineModal from '@/components/pipeline/PipelineModal/PipelineModal';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-painelsolar-sistema.r954jc.easypanel.host';

export default function MessagesPage() {
    const router = useRouter();
    const messagesEndRef = useRef(null);
    const dividerRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const socketRef = useRef(null);

    // State
    const [pipelines, setPipelines] = useState([]);
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Resizable panel
    const [chatWidth, setChatWidth] = useState(55); // percentage
    const [isResizing, setIsResizing] = useState(false);

    // Media attachment
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [attachmentType, setAttachmentType] = useState(null); // 'image', 'video', 'audio'
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [attachmentFile, setAttachmentFile] = useState(null);

    // Audio Recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const recordingTimerRef = useRef(null);

    // AI Control
    const [togglingAi, setTogglingAi] = useState(false);

    // Modals
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showPipelineModal, setShowPipelineModal] = useState(false);
    const [addToPipeline, setAddToPipeline] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // WebSocket connection
    useEffect(() => {
        socketRef.current = io(API_URL.replace('/api', ''), {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('[Socket] Connected');
        });

        socketRef.current.on('receive_message', (data) => {
            if (selectedLead && data.lead_id === selectedLead.id) {
                setMessages(prev => [...prev, data]);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [selectedLead]);

    // Join chat room when lead is selected
    useEffect(() => {
        if (selectedLead && socketRef.current) {
            socketRef.current.emit('join_chat', { room: `lead_${selectedLead.id}` });
        }
    }, [selectedLead]);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Resizable panel handlers
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

        // Clamp between 30% and 70%
        setChatWidth(Math.min(70, Math.max(30, newWidth)));
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const loadData = async () => {
        try {
            setLoading(true);
            const kanbanData = await pipelineService.getKanban();
            setPipelines(kanbanData);

            const allLeads = kanbanData.flatMap(p => p.leads || []);
            setLeads(allLeads);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeadSelect = async (lead) => {
        setSelectedLead(lead);
        try {
            const history = await messageService.getHistory(lead.id);
            setMessages(history);
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        }
    };

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && !attachmentFile) || !selectedLead) return;

        const tempMessage = {
            id: `temp_${Date.now()}`,
            lead_id: selectedLead.id,
            content: messageInput,
            sender: 'ai',
            timestamp: new Date().toISOString(),
            type: attachmentType || 'text',
            attachment_url: attachmentPreview,
        };

        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);
        setMessageInput('');
        const savedAttachment = attachmentFile;
        const savedType = attachmentType;
        setAttachmentFile(null);
        setAttachmentPreview(null);
        setAttachmentType(null);

        try {
            setSending(true);

            // Create message with attachment if present
            const messageData = {
                lead_id: selectedLead.id,
                content: messageInput || '',
                sender: 'user', // Correction: changed from 'ai' to 'user'
                type: savedType || 'text',
            };

            // If there's an attachment, upload it
            if (savedAttachment) {
                const formData = new FormData();
                formData.append('file', savedAttachment);
                formData.append('lead_id', selectedLead.id);
                formData.append('type', savedType);
                formData.append('content', messageInput || '');

                await messageService.createWithMedia(formData);
            } else {
                await messageService.create(tempMessage); // Correction: using tempMessage
            }

            // Emit via socket for real-time
            if (socketRef.current) {
                socketRef.current.emit('send_message', {
                    room: `lead_${selectedLead.id}`,
                    ...tempMessage,
                });
            }

            // Refresh to get actual message
            const history = await messageService.getHistory(selectedLead.id);
            setMessages(history);
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        } finally {
            setSending(false);
        }
    };

    const handleToggleAi = async () => {
        if (!selectedLead) return;
        setTogglingAi(true);
        try {
            // Toggle between 'active' and 'paused'
            const currentStatus = selectedLead.ai_status || 'active';
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';

            const updatedLead = await leadService.updateAiStatus(selectedLead.id, newStatus);

            // Update local state
            setSelectedLead(updatedLead);
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));

            // Show feedback
            const action = newStatus === 'active' ? 'ativada' : 'pausada';
            alert(`IA (Daniela) ${action} para este lead com sucesso!`);
        } catch (error) {
            console.error('Error toggling AI:', error);
            alert('Erro ao alterar status da IA.');
        } finally {
            setTogglingAi(false);
        }
    };

    const handleFileSelect = (type) => {
        setAttachmentType(type);
        setShowAttachMenu(false);

        const input = fileInputRef.current;
        if (input) {
            switch (type) {
                case 'image':
                    input.accept = 'image/*';
                    break;
                case 'video':
                    input.accept = 'video/*';
                    break;
                case 'audio':
                    input.accept = 'audio/*';
                    break;
            }
            input.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachmentFile(file);

            // Create preview URL
            const url = URL.createObjectURL(file);
            setAttachmentPreview(url);
        }
    };

    const clearAttachment = () => {
        setAttachmentFile(null);
        setAttachmentPreview(null);
        setAttachmentType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Audio Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setAudioChunks([]);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setAudioChunks((prev) => [...prev, e.data]);
                }
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Erro ao acessar microfone. Verifique as permissões.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Create file from blob
                const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });

                setAttachmentFile(file);
                setAttachmentType('audio');
                setAttachmentPreview(audioUrl);

                // Stop tracks
                mediaRecorder.stream.getTracks().forEach(track => track.stop());

                // Cleanup
                cleanupRecording();
            };
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        cleanupRecording();
    };

    const cleanupRecording = () => {
        setIsRecording(false);
        setMediaRecorder(null);
        setAudioChunks([]);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };



    const handleLeadMove = async (leadId, sourcePipelineId, targetPipelineId, newOrderIndex) => {
        setPipelines(prev => {
            const newPipelines = prev.map(p => ({
                ...p,
                leads: p.leads ? [...p.leads] : [],
            }));

            const sourceP = newPipelines.find(p => p.id === sourcePipelineId);
            const targetP = newPipelines.find(p => p.id === targetPipelineId);

            if (sourceP && targetP) {
                const leadIndex = sourceP.leads.findIndex(l => l.id === leadId);
                if (leadIndex !== -1) {
                    const [movedLead] = sourceP.leads.splice(leadIndex, 1);
                    movedLead.pipeline_id = targetPipelineId;
                    targetP.leads.splice(newOrderIndex, 0, movedLead);
                }
            }

            return newPipelines;
        });

        try {
            await leadService.move(leadId, targetPipelineId, newOrderIndex);
        } catch (error) {
            console.error('Error moving lead:', error);
            loadData();
        }
    };

    const handleCreateLead = async (data) => {
        try {
            setModalLoading(true);
            await leadService.create(data);
            await loadData();
            setShowLeadModal(false);
            setAddToPipeline(null);
        } catch (error) {
            console.error('Error creating lead:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleCreatePipeline = async (data) => {
        try {
            setModalLoading(true);
            await pipelineService.create(data);
            await loadData();
            setShowPipelineModal(false);
        } catch (error) {
            console.error('Error creating pipeline:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddLead = (pipeline) => {
        setAddToPipeline(pipeline);
        setShowLeadModal(true);
    };

    const handleAddColumn = () => {
        setShowPipelineModal(true);
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Filter and sort leads
    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery)
    );

    const sortedLeads = [...filteredLeads].sort((a, b) =>
        new Date(b.last_interaction_at) - new Date(a.last_interaction_at)
    );

    const getSourceIcon = (source) => {
        switch (source) {
            case 'meta_ads':
                return <Facebook size={14} color="#1877F2" />;
            case 'whatsapp':
                return <MessageCircle size={14} color="#25D366" />;
            default:
                return <User size={14} color="#6B7280" />;
        }
    };

    const getSourceLabel = (source) => {
        switch (source) {
            case 'meta_ads': return 'Meta Ads';
            case 'whatsapp': return 'WhatsApp';
            default: return 'Manual';
        }
    };

    const renderMessageContent = (msg) => {
        if (msg.type === 'image' && msg.attachment_url) {
            return (
                <>
                    <img src={msg.attachment_url} alt="Imagem" className={styles.messageImage} />
                    {msg.content && <p>{msg.content}</p>}
                </>
            );
        }
        if (msg.type === 'video' && msg.attachment_url) {
            return (
                <>
                    <video src={msg.attachment_url} controls className={styles.messageVideo} />
                    {msg.content && <p>{msg.content}</p>}
                </>
            );
        }
        if (msg.type === 'audio' && msg.attachment_url) {
            return (
                <>
                    <audio src={msg.attachment_url} controls className={styles.messageAudio} />
                    {msg.content && <p>{msg.content}</p>}
                </>
            );
        }
        return msg.content;
    };

    return (
        <div className={styles.container}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* Simple Header */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.push('/')}>
                    <ArrowLeft size={20} />
                    <span>Voltar ao Dashboard</span>
                </button>

                <div className={styles.headerCenter}>
                    <h1>Modo Mensagem</h1>
                </div>

                <div className={styles.headerRight}>
                    <span className={styles.resizeHint}>← Arraste o divisor para redimensionar →</span>
                </div>
            </header>

            {/* Split View with Resizable Divider */}
            <div className={styles.splitView} ref={containerRef}>
                {/* Left: Chat Section */}
                <div className={styles.chatSection} style={{ width: `${chatWidth}%` }}>
                    {/* Contacts List */}
                    <div className={styles.contactsList}>
                        <div className={styles.searchBox}>
                            <Search size={18} color="#666" />
                            <input
                                type="text"
                                placeholder="Buscar conversa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className={styles.contacts}>
                            {sortedLeads.map(lead => (
                                <div
                                    key={lead.id}
                                    className={`${styles.contactItem} ${selectedLead?.id === lead.id ? styles.active : ''}`}
                                    onClick={() => handleLeadSelect(lead)}
                                >
                                    <div className={styles.contactAvatar}>
                                        {getSourceIcon(lead.source)}
                                    </div>
                                    <div className={styles.contactInfo}>
                                        <div className={styles.contactName}>{lead.name}</div>
                                        <div className={styles.contactPhone}>
                                            {formatPhone(lead.phone)}
                                            {lead.source === 'meta_ads' && lead.meta_campaign_data?.campaign_name && (
                                                <span className={styles.campaignBadge}>
                                                    📣 {lead.meta_campaign_data.campaign_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.contactMeta}>
                                        <span className={styles.sourceBadge} data-source={lead.source}>
                                            {getSourceLabel(lead.source)}
                                        </span>
                                        <span className={styles.contactTime}>
                                            {formatTime(lead.last_interaction_at)}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {sortedLeads.length === 0 && (
                                <div className={styles.emptyContacts}>
                                    <MessageSquare size={32} color="#ccc" />
                                    <p>Nenhuma conversa encontrada</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={styles.chatWindow}>
                        {selectedLead ? (
                            <>
                                {/* Chat Header */}
                                <div className={styles.chatHeader}>
                                    <div className={styles.chatHeaderInfo}>
                                        <div className={styles.chatAvatar}>
                                            <User size={28} color="#fff" />
                                        </div>
                                        <div>
                                            <div className={styles.chatName}>{selectedLead.name}</div>
                                            <div className={styles.chatStatus}>
                                                {formatPhone(selectedLead.phone)}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className={styles.aiToggleBtn}
                                        onClick={handleToggleAi}
                                        disabled={togglingAi}
                                        title={selectedLead.ai_status !== 'active' ? "Reativar IA (Daniela)" : "Pausar IA (Daniela)"}
                                        style={{
                                            backgroundColor: selectedLead.ai_status !== 'active' ? '#EF4444' : '#10B981',
                                            color: 'white',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            marginRight: '10px'
                                        }}
                                    >
                                        <Bot size={16} />
                                        {togglingAi ? '...' : selectedLead.ai_status !== 'active' ? 'IA Pausada' : 'IA Ativa'}
                                    </button>
                                    <button className={styles.moreBtn}>
                                        <MoreVertical size={20} />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className={styles.messagesArea}>
                                    {messages.map((msg, index) => (
                                        <div
                                            key={msg.id || index}
                                            className={`${styles.message} ${msg.sender === 'user' ? styles.incoming : styles.outgoing}`}
                                        >
                                            <div className={styles.messageBubble}>
                                                {renderMessageContent(msg)}
                                                <span className={styles.messageTime}>
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Attachment Preview */}
                                {attachmentPreview && (
                                    <div className={styles.attachmentPreview}>
                                        <button className={styles.clearAttachment} onClick={clearAttachment}>
                                            <X size={16} />
                                        </button>
                                        {attachmentType === 'image' && (
                                            <img src={attachmentPreview} alt="Preview" />
                                        )}
                                        {attachmentType === 'video' && (
                                            <video src={attachmentPreview} controls />
                                        )}
                                        {attachmentType === 'audio' && (
                                            <audio src={attachmentPreview} controls />
                                        )}
                                    </div>
                                )}

                                {/* Input Area with Media Buttons */}
                                <div className={styles.inputArea}>
                                    <div className={styles.attachBtn}>
                                        <button onClick={() => setShowAttachMenu(!showAttachMenu)}>
                                            <Paperclip size={20} />
                                        </button>

                                        {showAttachMenu && (
                                            <div className={styles.attachMenu}>
                                                <button onClick={() => handleFileSelect('image')}>
                                                    <Image size={20} color="#10B981" />
                                                    <span>Imagem</span>
                                                </button>
                                                <button onClick={() => handleFileSelect('video')}>
                                                    <Video size={20} color="#3B82F6" />
                                                    <span>Vídeo</span>
                                                </button>
                                                <button onClick={() => handleFileSelect('audio')}>
                                                    <Mic size={20} color="#8B5CF6" />
                                                    <span>Áudio (Arquivo)</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isRecording ? (
                                        <div className={styles.recordingArea} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px' }}>
                                            <div className={styles.recordingIndicator} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
                                            <span style={{ fontSize: '0.9rem', color: '#EF4444', fontWeight: '500' }}>
                                                Gravando {formatRecordingTime(recordingTime)}
                                            </span>
                                            <div style={{ flex: 1 }} />
                                            <button onClick={cancelRecording} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '8px' }}>
                                                <Trash2 size={20} />
                                            </button>
                                            <button onClick={stopRecording} style={{ background: '#00A884', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <Send size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Digite uma mensagem..."
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                disabled={sending}
                                            />
                                            {messageInput.trim() || attachmentFile ? (
                                                <button
                                                    className={styles.sendBtn}
                                                    onClick={handleSendMessage}
                                                    disabled={sending}
                                                >
                                                    <Send size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    className={styles.sendBtn}
                                                    onClick={startRecording}
                                                    disabled={sending}
                                                    title="Gravar áudio"
                                                >
                                                    <Mic size={20} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className={styles.noChat}>
                                <MessageSquare size={64} color="#ccc" />
                                <h3>Selecione uma Conversa</h3>
                                <p>Clique em um contato à esquerda ou em um lead no Kanban</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resizable Divider */}
                <div
                    ref={dividerRef}
                    className={`${styles.divider} ${isResizing ? styles.resizing : ''}`}
                    onMouseDown={handleMouseDown}
                >
                    <div className={styles.dividerHandle} />
                </div>

                {/* Right: Kanban Section */}
                <div className={styles.kanbanSection} style={{ width: `${100 - chatWidth}%` }}>
                    <div className={styles.kanbanHeader}>
                        <h2>Pipeline de Leads</h2>
                        <div className={styles.kanbanActions}>
                            <button className={styles.refreshBtn} onClick={loadData}>
                                <RefreshCw size={16} />
                            </button>
                            <button className={styles.addBtn} onClick={() => setShowLeadModal(true)}>
                                <Plus size={16} />
                                Novo Lead
                            </button>
                        </div>
                    </div>

                    <div className={styles.kanbanWrapper}>
                        <KanbanBoard
                            pipelines={pipelines}
                            onLeadMove={handleLeadMove}
                            onLeadClick={handleLeadSelect}
                            onAddLead={handleAddLead}
                            onAddColumn={handleAddColumn}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <LeadModal
                isOpen={showLeadModal}
                onClose={() => { setShowLeadModal(false); setAddToPipeline(null); }}
                onSubmit={handleCreateLead}
                onCreatePipeline={() => {
                    setShowLeadModal(false);
                    setShowPipelineModal(true);
                }}
                pipelines={pipelines}
                initialPipelineId={addToPipeline?.id}
                loading={modalLoading}
            />

            <PipelineModal
                isOpen={showPipelineModal}
                onClose={() => setShowPipelineModal(false)}
                onSubmit={handleCreatePipeline}
                loading={modalLoading}
            />
        </div>
    );
}
