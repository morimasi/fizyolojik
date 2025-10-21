/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { Message, Patient, Therapist, User } from '../types';
import { getFileIcon } from '../utils';
import { getAiSuggestion } from '../services/aiService';

interface ChatInterfaceProps {
    currentUser: User;
    activeChatPartner: Patient | Therapist;
    messages: Message[];
    onSendMessage: (text: string, file?: File | null) => void;
    onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, activeChatPartner, messages, onSendMessage, onBack }) => {
    const [chatInput, setChatInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [aiSuggestion, setAiSuggestion] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const lastPatientMessageForAI = useRef<Message | null>(null);

    const isTherapist = 'patientIds' in currentUser;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessageClick = () => {
        if (!chatInput.trim() && !selectedFile) return;
        onSendMessage(chatInput, selectedFile);
        setChatInput('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setAiSuggestion('');
        lastPatientMessageForAI.current = null;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleGetAiSuggestion = async () => {
        if (!lastPatientMessageForAI.current || !currentUser || !activeChatPartner) return;
        setIsGenerating(true);
        setAiSuggestion('');
        try {
            const suggestion = await getAiSuggestion(currentUser, activeChatPartner.id, messages);
            setAiSuggestion(suggestion);
        } catch (error) {
            console.error("Error generating AI suggestion:", error);
            setAiSuggestion("Üzgünüm, şu anda bir öneri oluşturamıyorum. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setIsGenerating(false);
        }
    };

    const currentUserId = currentUser.id;
    const chatMessages = messages.filter(m =>
        (m.from === currentUserId && m.to === activeChatPartner.id) ||
        (m.from === activeChatPartner.id && m.to === currentUserId)
    ).sort((a, b) => a.timestamp - b.timestamp);
    
    const lastPatientMessage = isTherapist ? chatMessages.filter(m => m.from === activeChatPartner.id).pop() : null;
    if (lastPatientMessage) {
        lastPatientMessageForAI.current = lastPatientMessage;
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>{activeChatPartner.name} ile görüşme</h3>
                <button onClick={onBack} className="btn btn-secondary btn-sm">Geri</button>
            </div>
            <div className="chat-messages">
                {chatMessages.map(m => (
                    <div key={m.id} className={`message-bubble ${m.from === currentUserId ? 'sent' : 'received'} ${m.file ? 'file-bubble' : ''}`}>
                        {m.file && (
                           <div className="file-info">
                               <span className="file-icon">{getFileIcon(m.file.mimeType)}</span>
                               <div className="file-details">
                                   <strong>{m.file.name}</strong>
                                   <a href={m.file.url} download={m.file.name} className="download-link">İndir</a>
                               </div>
                           </div>
                        )}
                        {m.text && <p>{m.text}</p>}
                        <span>{new Date(m.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                 <div ref={chatEndRef} />
            </div>

            {isTherapist && lastPatientMessageForAI.current?.text && (
                <div className="ai-suggestion-box">
                    {isGenerating && <p className="loading-text">Yapay zeka öneri oluşturuyor...</p>}
                    {aiSuggestion && !isGenerating && (
                        <div className="suggestion-content">
                            <strong>AI Önerisi:</strong>
                            <p>{aiSuggestion}</p>
                            <div className="suggestion-actions">
                                <button className="btn btn-success btn-sm" onClick={() => setChatInput(aiSuggestion)}>Öneriyi Kullan</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setAiSuggestion('')}>Kapat</button>
                            </div>
                        </div>
                    )}
                    {!isGenerating && !aiSuggestion && (
                         <button className="btn btn-primary" onClick={handleGetAiSuggestion} disabled={isGenerating}>
                           Yapay Zeka Yanıt Önerisi Al
                         </button>
                    )}
                </div>
            )}

            <div className="chat-input-area">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                <button className="attachment-btn" onClick={() => fileInputRef.current?.click()}>📎</button>
                <div className="input-wrapper">
                    <textarea 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        rows={1}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessageClick();
                            }
                        }}
                    />
                    {selectedFile && <div className="selected-file-chip">{selectedFile.name} <button onClick={() => setSelectedFile(null)}>&times;</button></div>}
                </div>
                <button onClick={handleSendMessageClick} disabled={!chatInput.trim() && !selectedFile}>Gönder</button>
            </div>
        </div>
    );
};

export default ChatInterface;