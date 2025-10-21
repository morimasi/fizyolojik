/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Therapist, Patient, TherapyProgram, Exercise, ClinicalNote, Appointment, Message, WeeklyAvailability } from '../types';
import ChatInterface from '../components/ChatInterface';

interface TherapistDashboardProps {
    currentUser: Therapist;
    patients: Patient[];
    programs: TherapyProgram[];
    exercises: Exercise[];
    notes: ClinicalNote[];
    appointments: Appointment[];
    messages: Message[];
    onAddClinicalNote: (patientId: string, text: string) => void;
    onSendMessage: (text: string, file?: File | null) => void;
    onAvailabilitySave: (availability: WeeklyAvailability) => void;
}

const TherapistDashboard: React.FC<TherapistDashboardProps> = ({
    currentUser, patients, programs, exercises, notes, appointments, messages,
    onAddClinicalNote, onSendMessage, onAvailabilitySave
}) => {
    const [therapistView, setTherapistView] = useState<'patients' | 'calendar' | 'settings' | 'patient-detail'>('patients');
    const [therapistDetailTab, setTherapistDetailTab] = useState<'progress' | 'chat' | 'notes'>('progress');
    const [activePatientDetail, setActivePatientDetail] = useState<Patient | null>(null);
    const [activeChatPartner, setActiveChatPartner] = useState<Patient | null>(null);
    const [newClinicalNote, setNewClinicalNote] = useState('');
    
    const startChat = (partner: Patient) => {
        setActiveChatPartner(partner);
        setTherapistDetailTab('chat');
    };

    const viewPatientDetail = (patient: Patient) => {
        setActivePatientDetail(patient);
        setTherapistView('patient-detail');
        setTherapistDetailTab('progress');
    };

    const handleAddNote = () => {
        if (!newClinicalNote.trim() || !activePatientDetail) return;
        onAddClinicalNote(activePatientDetail.id, newClinicalNote);
        setNewClinicalNote('');
    };

    const renderTherapistPatientDetail = () => {
        if (!activePatientDetail) return null;
        const patient = activePatientDetail;
        const enrolledPrograms = programs.filter(p => patient.serviceIds.includes(p.id));
        const patientNotes = notes.filter(n => n.patientId === patient.id).sort((a, b) => b.timestamp - a.timestamp);

        return (
            <div className="patient-detail-container">
                <button onClick={() => { setActivePatientDetail(null); setTherapistView('patients'); }} className="back-button">‹ Tüm Danışanlar</button>
                <h2>{patient.name} Detayları</h2>
                <nav className="detail-nav">
                    <button onClick={() => setTherapistDetailTab('progress')} className={`nav-btn ${therapistDetailTab === 'progress' ? 'active' : ''}`}>Program İlerlemesi</button>
                    <button onClick={() => setTherapistDetailTab('notes')} className={`nav-btn ${therapistDetailTab === 'notes' ? 'active' : ''}`}>Klinik Notlar</button>
                    <button onClick={() => startChat(patient)} className={`nav-btn ${therapistDetailTab === 'chat' ? 'active' : ''}`}>Sohbet</button>
                </nav>
                {therapistDetailTab === 'progress' && (
                    <div>
                        {enrolledPrograms.map(program => {
                            const programExercises = exercises.filter(ex => program.exerciseIds.includes(ex.id));
                            const completedCount = programExercises.filter(ex => patient.progress[ex.id] === 'completed').length;
                            const progressPercentage = programExercises.length > 0 ? (completedCount / programExercises.length) * 100 : 0;

                            return (
                                <div key={program.id} className="program-section">
                                    <h3>{program.name}</h3>
                                    <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div></div>
                                    <div className="exercise-list">
                                        {programExercises.map(ex => {
                                            const isCompleted = patient.progress[ex.id] === 'completed';
                                            return (
                                                <div key={ex.id} className={`exercise-card therapist-view ${isCompleted ? 'completed' : ''}`}>
                                                    {ex.imageUrl && <img src={ex.imageUrl} alt={ex.name} className="exercise-card-image" />}
                                                    <div className="exercise-info">
                                                        <h4>
                                                            {ex.name}
                                                            {ex.videoUrl && <span className="video-icon" onClick={() => (window as any).openVideoModal(ex.videoUrl!, ex.name)}>🎥</span>}
                                                            {ex.audioUrl && <span className="sound-icon" onClick={() => new Audio(ex.audioUrl).play()}>🔊</span>}
                                                        </h4>
                                                        <span>{ex.sets} set x {ex.reps} tekrar</span>
                                                    </div>
                                                    <div className="exercise-status">
                                                        {isCompleted ? '✓ Tamamlandı' : 'Bekliyor'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {therapistDetailTab === 'notes' && (
                    <div className="clinical-notes-section">
                        <h3>Klinik Notlar</h3>
                        <div className="add-note-form">
                            <textarea value={newClinicalNote} onChange={(e) => setNewClinicalNote(e.target.value)} placeholder="Yeni bir klinik not ekleyin..."></textarea>
                            <button className="btn btn-primary" onClick={handleAddNote}>Not Ekle</button>
                        </div>
                        <div className="notes-list">
                            {patientNotes.length > 0 ? patientNotes.map(note => (
                                <div key={note.id} className="note-card">
                                    <p>{note.text}</p>
                                    <span>{new Date(note.timestamp).toLocaleString('tr-TR')}</span>
                                </div>
                            )) : <p className="empty-list-text">Bu danışan için henüz klinik not yok.</p>}
                        </div>
                    </div>
                )}
                {therapistDetailTab === 'chat' && activeChatPartner && (
                    <ChatInterface
                        currentUser={currentUser}
                        activeChatPartner={activeChatPartner}
                        messages={messages}
                        onSendMessage={onSendMessage}
                        onBack={() => {
                            setActiveChatPartner(null);
                            setTherapistDetailTab('progress');
                        }}
                    />
                )}
            </div>
        );
    };

    const renderTherapistCalendar = () => {
        const therapistAppointments = appointments.filter(a => a.therapistId === currentUser.id);
        const today = new Date();
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - date.getDay() + 1 + i); // Start from Monday
            return date;
        });
        const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const timeSlots = Array.from({ length: 18 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

        return (
            <div className="calendar-container">
                <h3>Bu Haftaki Takviminiz</h3>
                <div className="calendar-grid">
                    <div className="time-column">
                        {timeSlots.map(time => <div key={time} className="time-label">{time}</div>)}
                    </div>
                    {weekDays.map((day, index) => {
                        const dayAppointments = therapistAppointments.filter(app => {
                            const appDate = new Date(app.start);
                            return appDate.getFullYear() === day.getFullYear() &&
                                appDate.getMonth() === day.getMonth() &&
                                appDate.getDate() === day.getDate();
                        });

                        return (
                            <div key={index} className="day-column">
                                <div className="day-header">
                                    <strong>{dayNames[day.getDay() - 1] || dayNames[6]}</strong>
                                    <span>{day.getDate()}</span>
                                </div>
                                <div className="slots-container">
                                    {dayAppointments.map(app => {
                                        const patient = patients.find(p => p.id === app.patientId);
                                        const start = new Date(app.start);
                                        const top = ((start.getHours() - 8) * 60 + start.getMinutes()) / (18 * 60) * 100;
                                        const height = (app.end - app.start) / 1000 / 60 / (18 * 60) * 100;

                                        return (
                                            <div key={app.id} className={`appointment-slot status-${app.status}`} style={{ top: `${top}%`, height: `${height}%` }}>
                                                <strong>{patient?.name}</strong>
                                                <span>{start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const TherapistSettings = () => {
        const [availability, setAvailability] = useState<WeeklyAvailability>(currentUser.availability || []);
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

        const handleAddSlot = (dayIndex: number) => {
            const newAvailability = JSON.parse(JSON.stringify(availability));
            let day = newAvailability.find((d: any) => d.day === dayIndex);
            if (!day) {
                day = { day: dayIndex, slots: [] };
                newAvailability.push(day);
            }
            day.slots.push({ start: '09:00', end: '10:00' });
            newAvailability.sort((a: any, b: any) => a.day - b.day);
            setAvailability(newAvailability);
        };

        const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
            const newAvailability = availability.map(day => {
                if (day.day === dayIndex) {
                    const newSlots = day.slots.filter((_, i) => i !== slotIndex);
                    return { ...day, slots: newSlots };
                }
                return day;
            }).filter(day => day.slots.length > 0);
            setAvailability(newAvailability);
        };

        const handleSlotChange = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
            const newAvailability = availability.map(day => {
                if (day.day === dayIndex) {
                    const newSlots = day.slots.map((slot, i) => {
                        if (i === slotIndex) {
                            return { ...slot, [field]: value };
                        }
                        return slot;
                    });
                    return { ...day, slots: newSlots };
                }
                return day;
            });
            setAvailability(newAvailability);
        };

        const handleSaveChanges = () => {
            onAvailabilitySave(availability);
            alert("Müsaitlik durumunuz güncellendi.");
        };

        return (
            <div className="settings-container">
                <h3>Müsaitlik Ayarları</h3>
                <p>Danışanların randevu alabilmesi için haftalık çalışma programınızı buradan düzenleyebilirsiniz.</p>
                <div className="availability-editor">
                    {dayNames.map((name, index) => {
                        if (index === 0) return null; // Skip Sunday
                        const dayData = availability.find(d => d.day === index);
                        return (
                            <div key={index} className="availability-day">
                                <h4>{name}</h4>
                                <div className="day-slots">
                                    {dayData?.slots.map((slot, slotIndex) => (
                                        <div key={slotIndex} className="slot-editor">
                                            <input type="time" value={slot.start} onChange={e => handleSlotChange(index, slotIndex, 'start', e.target.value)} />
                                            <span>-</span>
                                            <input type="time" value={slot.end} onChange={e => handleSlotChange(index, slotIndex, 'end', e.target.value)} />
                                            <button onClick={() => handleRemoveSlot(index, slotIndex)} className="remove-slot-btn">&times;</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleAddSlot(index)} className="btn btn-secondary btn-sm add-slot-btn">+ Aralık Ekle</button>
                            </div>
                        );
                    })}
                </div>
                <button className="btn btn-primary" onClick={handleSaveChanges}>Değişiklikleri Kaydet</button>
            </div>
        );
    };

    if (therapistView === 'patient-detail' && activePatientDetail) {
        return renderTherapistPatientDetail();
    }
    
    const assignedPatients = patients.filter(p => currentUser.patientIds.includes(p.id));
    
    return (
        <>
            <nav className="dashboard-nav">
                <button onClick={() => setTherapistView('patients')} className={`nav-btn ${therapistView === 'patients' ? 'active' : ''}`}>Danışanlarım</button>
                <button onClick={() => setTherapistView('calendar')} className={`nav-btn ${therapistView === 'calendar' ? 'active' : ''}`}>Takvimim</button>
                <button onClick={() => setTherapistView('settings')} className={`nav-btn ${therapistView === 'settings' ? 'active' : ''}`}>Ayarlar</button>
            </nav>

            {therapistView === 'patients' && (
                <div>
                    <h3>Atanmış Danışanlarınız</h3>
                    <div className="dashboard-grid">
                        {assignedPatients.map(p => (
                            <div key={p.id} className="dashboard-card clickable" onClick={() => viewPatientDetail(p)}>
                                <h3>{p.name}</h3>
                                <p>{p.email}</p>
                                <p><strong>{p.serviceIds.length}</strong> aktif program</p>
                            </div>
                        ))}
                         {assignedPatients.length === 0 && <p className="empty-list-text">Henüz size atanmış bir danışan bulunmuyor.</p>}
                    </div>
                </div>
            )}
            {therapistView === 'calendar' && renderTherapistCalendar()}
            {therapistView === 'settings' && <TherapistSettings />}
        </>
    );
};

export default TherapistDashboard;
