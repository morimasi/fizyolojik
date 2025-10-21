/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
// FIX: Import Message type
import { Patient, Therapist, TherapyProgram, Exercise, Appointment, Category, Message } from '../types';
import ChatInterface from '../components/ChatInterface';

interface PatientDashboardProps {
    currentUser: Patient;
    therapists: Therapist[];
    programs: TherapyProgram[];
    exercises: Exercise[];
    appointments: Appointment[];
    categories: Category[];
    patients: Patient[];
    onToggleExerciseComplete: (exerciseId: string, programId: string) => void;
    onBookAppointment: (therapistId: string, start: number) => void;
    onCancelAppointment: (app: Appointment) => void;
    onEnrollInProgram: (programId: string) => void;
    onSendMessage: (text: string, file?: File | null) => void;
    messages: Message[];
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
    currentUser, therapists, programs, exercises, appointments, categories,
    onToggleExerciseComplete, onBookAppointment, onCancelAppointment, onEnrollInProgram,
    onSendMessage, messages
}) => {
    const [patientView, setPatientView] = useState<'dashboard' | 'catalog' | 'chat' | 'appointments'>('dashboard');
    const [activeChatPartner, setActiveChatPartner] = useState<Therapist | null>(null);

    const assignedTherapist = therapists.find(t => t.id === currentUser.therapistId);
    
    // FIX: Hoist render functions to avoid temporal dead zone errors and organize code.
    const renderPatientProgramDashboard = () => {
        const enrolledPrograms = programs.filter(s => currentUser.serviceIds.includes(s.id));
        return (
            <>
                <nav className="dashboard-nav">
                    <button onClick={() => setPatientView('dashboard')} className="nav-btn active">Panelim</button>
                    <button onClick={() => setPatientView('appointments')} className="nav-btn">Randevularım</button>
                    <button onClick={() => setPatientView('catalog')} className="nav-btn">Program Kataloğu</button>
                    {assignedTherapist && <button onClick={() => startChat(assignedTherapist)} className="nav-btn">Terapistimle Mesajlaş</button>}
                </nav>
                <div>
                     {enrolledPrograms.length > 0 ? enrolledPrograms.map(program => {
                        const programExercises = exercises.filter(ex => program.exerciseIds.includes(ex.id));
                        const completedCount = programExercises.filter(ex => currentUser.progress[ex.id] === 'completed').length;
                        const progressPercentage = programExercises.length > 0 ? (completedCount / programExercises.length) * 100 : 0;
                        
                        return (
                            <div key={program.id} className="program-section">
                                <h3>{program.name}</h3>
                                <p>{program.description}</p>
                                <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div></div>
                                <div className="exercise-list">
                                    {programExercises.map(ex => {
                                        const isCompleted = currentUser.progress[ex.id] === 'completed';
                                        return (
                                            <div key={ex.id} className={`exercise-card ${isCompleted ? 'completed' : ''}`}>
                                                {ex.imageUrl && <img src={ex.imageUrl} alt={ex.name} className="exercise-card-image" />}
                                                <div className="exercise-info">
                                                    <h4>{ex.name}</h4>
                                                    <p>{ex.description}</p>
                                                    <span>{ex.sets} set x {ex.reps} tekrar</span>
                                                </div>
                                                <div className="exercise-actions">
                                                    {ex.videoUrl && <button className="btn btn-secondary btn-sm" onClick={() => (window as any).openVideoModal(ex.videoUrl!, ex.name)}>Videoyu İzle</button>}
                                                    {ex.audioUrl && <button className="btn btn-secondary btn-sm" onClick={() => new Audio(ex.audioUrl).play()}>Dinle 🔊</button>}
                                                    <button onClick={() => onToggleExerciseComplete(ex.id, program.id)} className={`btn ${isCompleted ? 'btn-secondary' : 'btn-success'}`}>
                                                        {isCompleted ? 'Geri Al' : 'Tamamlandı'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                     }) : <p>Henüz bir programa kayıtlı değilsiniz. Katalogdan bir program seçebilirsiniz.</p>}
                </div>
            </>
        );
    };

    const renderPatientCatalogDashboard = () => {
        const enrolledServiceIds = new Set(currentUser.serviceIds);
        return (
            <>
                <nav className="dashboard-nav">
                    <button onClick={() => setPatientView('dashboard')} className="nav-btn">Panelim</button>
                    <button onClick={() => setPatientView('appointments')} className="nav-btn">Randevularım</button>
                    <button onClick={() => setPatientView('catalog')} className="nav-btn active">Program Kataloğu</button>
                    {assignedTherapist && <button onClick={() => startChat(assignedTherapist)} className="nav-btn">Terapistimle Mesajlaş</button>}
                </nav>
                <div>
                    <h3>Tüm Programlar</h3>
                    {categories.map(cat => (
                        <div key={cat.id} className="category-section">
                            <h4>{cat.name}</h4>
                            <div className="dashboard-grid">
                                {programs.filter(s => s.categoryId === cat.id).map(s => (
                                    <div key={s.id} className="dashboard-card">
                                        <h3>{s.name}</h3>
                                        <p>{s.description}</p>
                                        <button 
                                          className="btn btn-primary"
                                          disabled={enrolledServiceIds.has(s.id)}
                                          onClick={() => {
                                              if (confirm(`'${s.name}' programına kaydolmak istediğinizden emin misiniz?`)) {
                                                onEnrollInProgram(s.id);
                                                alert("Başarıyla kaydoldunuz!");
                                              }
                                          }}
                                        >
                                          {enrolledServiceIds.has(s.id) ? 'Kayıtlı' : 'Kaydol'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };
    
    const renderPatientAppointmentsDashboard = () => {
        const patientAppointments = appointments.filter(a => a.patientId === currentUser.id).sort((a,b) => a.start - b.start);
        const now = Date.now();
        const upcomingAppointments = patientAppointments.filter(a => a.start > now && a.status === 'scheduled');
        const pastAppointments = patientAppointments.filter(a => a.start <= now || a.status !== 'scheduled');

        const [bookingView, setBookingView] = useState(false);
        const [selectedDate, setSelectedDate] = useState(new Date());

        const generateAvailableSlots = () => {
            if (!assignedTherapist) return [];
            const slots: number[] = [];
            const date = new Date(selectedDate);
            date.setHours(0,0,0,0);
            const dayOfWeek = date.getDay();
            const availabilityForDay = assignedTherapist.availability.find(a => a.day === dayOfWeek);
            if (!availabilityForDay) return [];

            const existingAppointmentsOnDay = appointments.filter(a => {
                const appDate = new Date(a.start);
                return a.therapistId === assignedTherapist.id &&
                       appDate.getFullYear() === date.getFullYear() &&
                       appDate.getMonth() === date.getMonth() &&
                       appDate.getDate() === date.getDate() &&
                       a.status === 'scheduled';
            });

            for (const avail of availabilityForDay.slots) {
                const [startHour, startMin] = avail.start.split(':').map(Number);
                const [endHour, endMin] = avail.end.split(':').map(Number);
                
                let currentTime = new Date(date);
                currentTime.setHours(startHour, startMin, 0, 0);

                let endTime = new Date(date);
                endTime.setHours(endHour, endMin, 0, 0);

                while (currentTime.getTime() + 30 * 60 * 1000 <= endTime.getTime()) {
                    const slotStart = currentTime.getTime();
                    const slotEnd = slotStart + 30 * 60 * 1000;
                    
                    const isBooked = existingAppointmentsOnDay.some(app => slotStart < app.end && slotEnd > app.start);
                    if (!isBooked && slotStart > Date.now()) { // Only show future slots
                        slots.push(slotStart);
                    }
                    currentTime.setTime(slotEnd);
                }
            }
            return slots;
        };

        if (bookingView) {
            return (
                <div>
                     <nav className="dashboard-nav">
                        <button onClick={() => setPatientView('dashboard')} className="nav-btn">Panelim</button>
                        <button onClick={() => setPatientView('appointments')} className="nav-btn active">Randevularım</button>
                        <button onClick={() => setPatientView('catalog')} className="nav-btn">Program Kataloğu</button>
                    </nav>
                    <div className="booking-container">
                        <button onClick={() => setBookingView(false)} className="back-button" style={{position: 'static', marginBottom: '1rem'}}>‹ Geri</button>
                        <h3>Randevu Al</h3>
                        <div className="form-group">
                            <label>Tarih Seçin</label>
                            <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate.toISOString().split('T')[0]} onChange={e => setSelectedDate(new Date(e.target.value))} />
                        </div>
                        <h4>Müsait Saatler</h4>
                        <div className="available-slots">
                            {generateAvailableSlots().map(slot => (
                                <button key={slot} className="btn btn-primary" onClick={() => {
                                    onBookAppointment(assignedTherapist!.id, slot);
                                    alert('Randevunuz başarıyla oluşturuldu!');
                                    setBookingView(false);
                                }}>
                                    {new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </button>
                            ))}
                             {generateAvailableSlots().length === 0 && <p className="empty-list-text">Bu tarih için uygun saat bulunmamaktadır.</p>}
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div>
                <nav className="dashboard-nav">
                    <button onClick={() => setPatientView('dashboard')} className="nav-btn">Panelim</button>
                    <button onClick={() => setPatientView('appointments')} className="nav-btn active">Randevularım</button>
                    <button onClick={() => setPatientView('catalog')} className="nav-btn">Program Kataloğu</button>
                     {assignedTherapist && <button onClick={() => startChat(assignedTherapist)} className="nav-btn">Terapistimle Mesajlaş</button>}
                </nav>
                <div className="admin-actions">
                    <h3>Randevularım</h3>
                    {assignedTherapist && <button className="btn btn-success" onClick={() => setBookingView(true)}>+ Yeni Randevu Al</button>}
                </div>

                <div className="appointment-list">
                    <h4>Yaklaşan Randevular</h4>
                    {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
                        <div key={app.id} className="appointment-card">
                            <div className="appointment-info">
                                <strong>{assignedTherapist?.name}</strong>
                                <span>{new Date(app.start).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</span>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={() => onCancelAppointment(app)}>İptal Et</button>
                        </div>
                    )) : <p className="empty-list-text">Yaklaşan randevunuz bulunmuyor.</p>}
                </div>
                 <div className="appointment-list">
                    <h4>Geçmiş Randevular</h4>
                    {pastAppointments.length > 0 ? pastAppointments.map(app => (
                        <div key={app.id} className={`appointment-card status-${app.status}`}>
                            <div className="appointment-info">
                                <strong>{assignedTherapist?.name}</strong>
                                <span>{new Date(app.start).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</span>
                            </div>
                            <span className={`status-badge status-${app.status}`}>{app.status}</span>
                        </div>
                    )) : <p className="empty-list-text">Geçmiş randevunuz bulunmuyor.</p>}
                </div>
            </div>
        );
    };

    const startChat = (partner: Therapist) => {
        setActiveChatPartner(partner);
        setPatientView('chat');
    };
    
    if (patientView === 'chat' && activeChatPartner) {
        return <ChatInterface 
            currentUser={currentUser} 
            activeChatPartner={activeChatPartner}
            messages={messages}
            onSendMessage={onSendMessage}
            onBack={() => {
                setActiveChatPartner(null);
                setPatientView('dashboard');
            }}
        />
    }

    // FIX: Removed redundant conditional check for 'appointments' view, which caused a type error.
    // The switch statement below now correctly handles all view rendering.
    switch(patientView) {
        case 'catalog': return renderPatientCatalogDashboard();
        case 'appointments': return renderPatientAppointmentsDashboard();
        case 'dashboard':
        default:
            return renderPatientProgramDashboard();
    }
};

export default PatientDashboard;