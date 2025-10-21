/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { ClinicalNote, EditableItem, Patient, Therapist, TherapyProgram, Message } from '../types';
import LineChart from '../components/LineChart';
import EmptyState from '../components/EmptyState';

interface TherapistDashboardProps {
    therapist: Therapist;
    patients: Patient[];
    programs: TherapyProgram[];
    messages: Message[];
    therapists: Therapist[];
    onStartChat: (patient: Patient) => void;
    openModal: (type: 'clinicalNote', mode: 'add', item?: EditableItem | null) => void;
}

const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ therapist, patients, programs, messages, onStartChat, openModal, therapists }) => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [detailView, setDetailView] = useState<'progress' | 'notes' | 'chat'>('progress');
    const therapistPatients = patients.filter(p => p.therapistId === therapist.id);
    
    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient);
        setDetailView('progress');
    };

    const getOverallProgress = (patient: Patient) => {
        const patientPrograms = programs.filter(p => patient.serviceIds.includes(p.id));
        if (patientPrograms.length === 0) return 0;
        const totalExercises = patientPrograms.reduce((sum, prog) => sum + prog.exerciseIds.length, 0);
        if (totalExercises === 0) return 0;
        
        // This is a simplification. A real app would track completion per exercise.
        // We'll simulate it based on number of logged days.
        const uniqueLoggedDays = Object.keys(patient.exerciseLog).length;
        return Math.min(100, (uniqueLoggedDays / 30) * 100); // Assume a 30-day program
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

        return (
            <div className="patient-detail-container">
                <button className="back-button" onClick={() => setSelectedPatient(null)}>‹ Tüm Danışanlar</button>
                <h2>{selectedPatient.name}</h2>
                <nav className="detail-nav">
                    <button onClick={() => setDetailView('progress')} className={`nav-btn ${detailView === 'progress' ? 'active' : ''}`}>Program İlerlemesi</button>
                    <button onClick={() => setDetailView('notes')} className={`nav-btn ${detailView === 'notes' ? 'active' : ''}`}>Klinik Notlar</button>
                    <button onClick={() => onStartChat(selectedPatient)} className="nav-btn">Sohbet</button>
                </nav>
                
                {detailView === 'progress' && (
                    <div>
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
                                        {/* FIX: Correctly reference the 'therapists' prop to find the therapist's name. */}
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
            </div>
        );
    };

    if (selectedPatient) {
        return <div className="view-enter">{renderPatientDetails()}</div>
    }

    return (
        <div className="view-enter">
            <h2>Danışanlarım</h2>
            <div className="dashboard-grid">
                {therapistPatients.length > 0 ? therapistPatients.map(p => (
                    <div key={p.id} className="dashboard-card clickable" onClick={() => handlePatientSelect(p)}>
                        <div className="patient-card-header">
                            <h4>{p.name}</h4>
                            {hasUnreadMessages(p.id) && <span className="unread-indicator">💬</span>}
                        </div>
                        <p>Genel İlerleme</p>
                        <div className="patient-card-progress">
                             <div className="progress-bar-container">
                                <div className="progress-bar" style={{width: `${getOverallProgress(p)}%`}}></div>
                            </div>
                        </div>
                    </div>
                )) : <EmptyState title="Atanmış Danışanınız Yok" message="Bir yönetici size bir danışan atadığında burada görünecektir."/>}
            </div>
        </div>
    );
};

export default TherapistDashboard;