'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, Paperclip, Mic, Image, Video, FileText } from 'lucide-react';
import Modal, { modalStyles as sharedStyles } from '../../shared/Modal/Modal'; // Assuming shared Modal styles are reusable or we use our own
import { messageService } from '@/services/api';
import { io } from 'socket.io-client';
import styles from './ChatModal.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-painelsolar-sistema.r954jc.easypanel.host';

export default function ChatModal({ isOpen, onClose, lead }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Load messages when modal opens
    useEffect(() => {
        if (isOpen && lead) {
            loadMessages();
            connectSocket();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [isOpen, lead]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        try {
            const history = await messageService.getHistory(lead.id);
            setMessages(history);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const connectSocket = () => {
        socketRef.current = io(API_URL.replace('/api', ''), {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join_chat', { room: `lead_${lead.id}` });
        });

        socketRef.current.on('receive_message', (data) => {
            if (data.lead_id === lead.id) {
                setMessages((prev) => [...prev, data]);
            }
        });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !lead) return;

        const content = input;
        setInput('');

        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        const optimMessage = {
            id: tempId,
            lead_id: lead.id,
            content: content,
            sender: 'user',
            timestamp: new Date().toISOString(),
            type: 'text',
        };
        setMessages(prev => [...prev, optimMessage]);

        try {
            setSending(true);
            await messageService.create({
                lead_id: lead.id,
                content: content,
                sender: 'user',
                type: 'text'
            });

            // Socket emit is redundant if backend broadcasts, but good for immediate feedback if needed
            // Backend usually broadcasts back the saved message
        } catch (error) {
            console.error('Error sending:', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInput(content); // Restore input
        } finally {
            setSending(false);
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h3>{lead.name}</h3>
                        <span>{lead.phone}</span>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.messagesArea}>
                    {messages.map((msg, idx) => (
                        <div
                            key={msg.id || idx}
                            className={`${styles.message} ${msg.sender === 'user' || msg.sender === 'agent' ? styles.outgoing : styles.incoming
                                }`}
                        >
                            <div className={styles.bubble}>
                                {msg.content}
                                <span className={styles.time}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className={styles.inputArea}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={sending}
                    />
                    <button type="submit" disabled={sending || !input.trim()}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
