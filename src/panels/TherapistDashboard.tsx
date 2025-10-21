/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Appointment, ClinicalNote, EditableItem, Patient, Therapist, TherapyProgram, Message } from '../types';
import LineChart from '../components/LineChart';
import EmptyState from '../components/EmptyState';
import { getAiPatientSummary } from '../services/aiService';
import TherapistCalendar from '../components/TherapistCalendar';

interface TherapistDashboardProps {
    therapist: Therapist;
    patients: Patient[];
    programs: TherapyProgram[];
    appointments: Appointment[];
    messages: Message[];
    therapists: Therapist[];
    onStartChat: (patient: Patient) => void;
    openModal: (type: 'clinicalNote' | 'appointment', mode: 'add' | 'edit', item?: EditableItem | null) => void;
}

const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ therapist, patients, programs, appointments, messages, onStartChat, openModal, therapists }) => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [detailView, setDetailView] = useState<'progress' | 'notes' | 'appointments'>('progress');
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const therapistPatients = patients.filter(p => p.therapistId === therapist.id);
    
    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient);
        setDetailView('progress');
        setAiSummary(''); // Danışan değiştiğinde özeti sıfırla
    };

    const handleGenerateSummary = async () => {
        if (!selectedPatient) return;
        setIsGeneratingSummary(true);
        setAiSummary('');
        try {
            const summary = await getAiPatientSummary(selectedPatient);
            setAiSummary(summary);
        } catch (error) {
            console.error("Error generating AI summary:", error);
            setAiSummary("Özet oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const hasUnreadMessages = (patientId: string) => {
        return messages.some(m => m.from === patientId && m.to === therapist.id); // simplistic unread logic
    };

    const renderPatientDetails = () => {
        if (!selectedPatient) {
            return (
                 <EmptyState 
                    title="Danışan Seçin"
                    message="Detayları görüntülemek ve işlem yapmak için lütfen soldaki listeden bir danışan seçin."
                />
            )
        }
        
        const patientPrograms = programs.filter(p => selectedPatient.serviceIds.includes(p.id));
        const patientAppointments = appointments.filter(a => a.patientId === selectedPatient.id).sort((a,b) => b.start - a.start);

        return (
            <div className="patient-detail-container">
                <button className="back-button" onClick={() => setSelectedPatient(null)}>‹ Danışan Listesi</button>
                <h2>{selectedPatient.name}</h2>
                <nav className="detail-nav">
                    <button onClick={() => setDetailView('progress')} className={`nav-btn ${detailView === 'progress' ? 'active' : ''}`}>İlerleme</button>
                    <button onClick={() => setDetailView('notes')} className={`nav-btn ${detailView === 'notes' ? 'active' : ''}`}>Klinik Notlar</button>
                    <button onClick={() => setDetailView('appointments')} className={`nav-btn ${detailView === 'appointments' ? 'active' : ''}`}>Randevular</button>
                    <button onClick={() => onStartChat(selectedPatient)} className="nav-btn">Sohbet</button>
                </nav>
                
                {detailView === 'progress' && (
                    <div>
                        <div className="dashboard-card ai-summary-card">
                            <h4>Yapay Zeka Raporu</h4>
                            {isGeneratingSummary && <p className="loading-text">Danışan verileri analiz ediliyor, lütfen bekleyin...</p>}
                            {aiSummary && !isGeneratingSummary && (
                                <div className="ai-summary-content">
                                    <pre>{aiSummary}</pre>
                                </div>
                            )}
                            {!isGeneratingSummary && !aiSummary &&(
                                <button className="btn btn-primary" onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                                    {isGeneratingSummary ? 'Oluşturuluyor...' : 'Danışan Özeti Oluştur'}
                                </button>
                            )}
                        </div>

                        <LineChart data={selectedPatient.painJournal} title="Ağrı Günlüğü Analizi" />
                        {patientPrograms.map(program => (
                             <div key={program.id} className="program-section">
                                <h3>{program.name}</h3>
                             </div>
                        ))}
                        {patientPrograms.length === 0 && <p>Danışan bir programa kayıtlı değil.</p>}
                    </div>
                )}

                {detailView === 'notes' && (
                    <div className="clinical-notes-section">
                        <div className="admin-actions">
                             <h3>Klinik Notlar</h3>
                             <button className="btn btn-success" onClick={() => openModal('clinicalNote', 'add', { patientId: selectedPatient.id })}>+ Yeni Not Ekle (SOAP)</button>
                        </div>
                        <div className="notes-list">
                            {selectedPatient.clinicalNotes.length > 0 ? selectedPatient.clinicalNotes.map(note => (
                                <div key={note.id} className="note-card soap-note-card">
                                    <div className="note-header">
                                        <strong>Tarih: {new Date(note.date).toLocaleDateString('tr-TR')}</strong>
                                        <span>Terapist: {therapists.find(t=>t.id === note.therapistId)?.name || 'Bilinmiyor'}</span>
                                    </div>
                                    <div className="soap-field"><strong>S (Subjektif):</strong> <p>{note.subjective}</p></div>
                                    <div className="soap-field"><strong>O (Objektif):</strong> <p>{note.objective}</p></div>
                                    <div className="soap-field"><strong>A (Analiz):</strong> <p>{note.assessment}</p></div>
                                    <div className="soap-field"><strong>P (Plan):</strong> <p>{note.plan}</p></div>
                                </div>
                            )) : <EmptyState title="Klinik Not Bulunmuyor" message="Bu danışan için henüz bir SOAP notu eklenmemiş."/>}
                        </div>
                    </div>
                )}
                 {detailView === 'appointments' && (
                    <div className="appointment-list">
                        <div className="admin-actions">
                           <h4>Randevu Geçmişi</h4>
                           <button className="btn btn-success" onClick={() => { /* Prefill patient */ }}>+ Yeni Randevu Oluştur</button>
                        </div>
                         {patientAppointments.length > 0 ? patientAppointments.map(app => (
                            <div key={app.id} className={`appointment-card status-${app.status}`}>
                                <div className="appointment-info">
                                    <strong>{new Date(app.start).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                                </div>
                                <span className={`status-badge status-${app.status}`}>{app.status}</span>
                            </div>
                        )) : <EmptyState title="Randevu Bulunmuyor" message="Bu danışan için henüz bir randevu planlanmamış." />}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="view-enter">
            {selectedPatient ? renderPatientDetails() : (
                 <div className="therapist-dashboard-layout">
                    <div>
                        <h2>Danışanlarım</h2>
                        <div className="therapist-patient-list">
                             {therapistPatients.length > 0 ? therapistPatients.map(p => (
                                <div key={p.id} className="dashboard-card clickable" onClick={() => handlePatientSelect(p)}>
                                    <div className="patient-card-header">
                                        <h4>{p.name}</h4>
                                        {hasUnreadMessages(p.id) && <span className="unread-indicator">💬</span>}
                                    </div>
                                    <p>{p.email}</p>
                                </div>
                            )) : <EmptyState title="Atanmış Danışanınız Yok" message="Bir yönetici size bir danışan atadığında burada görünecektir."/>}
                        </div>
                    </div>
                    <div>
                        <h2>Haftalık Takvim</h2>
                        <TherapistCalendar 
                            therapist={therapist}
                            appointments={appointments.filter(a => a.therapistId === therapist.id)}
                            patients={therapistPatients}
                            openModal={openModal}
                        />
                    </div>
                 </div>
            )}
        </div>
    );
};

export default TherapistDashboard;