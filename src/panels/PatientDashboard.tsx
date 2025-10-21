/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Appointment, Exercise, Patient, PainJournalEntry, TherapyProgram, Therapist } from '../types';
import LineChart from '../components/LineChart';
import VideoModal from '../components/VideoModal';
import EmptyState from '../components/EmptyState';

interface PatientDashboardProps {
    patient: Patient;
    therapist: Therapist | undefined;
    programs: TherapyProgram[];
    exercises: Exercise[];
    appointments: Appointment[];
    onStartChat: (therapist: Therapist) => void;
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    onCompleteExercise: (patientId: string, exerciseId: string) => void;
    onAddJournalEntry: (patientId: string, entryData: Omit<PainJournalEntry, 'date'>) => void;
}

const ExerciseCalendar: React.FC<{patient: Patient}> = ({ patient }) => {
    const today = new Date();
    const [currentWeek, setCurrentWeek] = useState(today);

    const getWeekDays = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Monday as start
        return Array.from({length: 7}).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
    };

    const weekDays = getWeekDays(currentWeek);
    const todayStr = new Date().toISOString().split('T')[0];

    const changeWeek = (amount: number) => {
        const newDate = new Date(currentWeek);
        newDate.setDate(currentWeek.getDate() + amount * 7);
        setCurrentWeek(newDate);
    };

    return (
        <div className="exercise-calendar">
            <div className="calendar-header">
                <button onClick={() => changeWeek(-1)}>&lt; Önceki Hafta</button>
                <h4>Egzersiz Takvimi</h4>
                <button onClick={() => changeWeek(1)}>Sonraki Hafta &gt;</button>
            </div>
            <div className="calendar-grid">
                {weekDays.map(day => {
                    const dayStr = day.toISOString().split('T')[0];
                    const isCompleted = patient.exerciseLog[dayStr]?.length > 0;
                    const isToday = dayStr === todayStr;
                    return (
                        <div key={dayStr} className={`calendar-day ${isToday ? 'today' : ''}`}>
                            <span className="day-name">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                            <span className="day-number">{day.getDate()}</span>
                            {isCompleted && <span className="completion-dot"></span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, therapist, programs, exercises, appointments, onStartChat, setAppointments, onCompleteExercise, onAddJournalEntry }) => {
    const [view, setView] = useState<'summary' | 'programs' | 'journal'>('summary');
    const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string; exerciseId: string } | null>(null);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [painLevel, setPainLevel] = useState(5);
    const [journalNote, setJournalNote] = useState('');

    const handleJournalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (journalNote.trim() === '') {
            alert('Lütfen günlüğünüze bir not ekleyin.');
            return;
        }
        onAddJournalEntry(patient.id, { painLevel, note: journalNote });
        setJournalNote('');
        setPainLevel(5);
    };

    const patientPrograms = programs.filter(p => patient.serviceIds.includes(p.id));
    const upcomingAppointments = appointments.filter(a => a.patientId === patient.id && a.status === 'scheduled' && a.start > Date.now()).sort((a, b) => a.start - b.start);
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = patient.exerciseLog[todayStr] || [];

    const totalExercises = patientPrograms.reduce((acc, p) => acc + p.exerciseIds.length, 0);
    const overallProgress = totalExercises > 0 ? (completedToday.length / totalExercises) * 100 : 0;
    
    return (
        <div className="view-enter">
            <nav className="dashboard-nav">
                <button onClick={() => setView('summary')} className={`nav-btn ${view === 'summary' ? 'active' : ''}`}>Panelim</button>
                <button onClick={() => setView('programs')} className={`nav-btn ${view === 'programs' ? 'active' : ''}`}>Programlarım</button>
                <button onClick={() => setView('journal')} className={`nav-btn ${view === 'journal' ? 'active' : ''}`}>Günlüğüm</button>
            </nav>

            {view === 'summary' && (
                 <div className="category-section patient-summary-section">
                    <h3>Hoş Geldiniz, {patient.name}</h3>
                    <div className="dashboard-grid">
                        <div className="dashboard-card">
                            <h4>Bugünkü İlerleme</h4>
                            <p>Bugün için planlanan egzersizlerin <strong>%{Math.round(overallProgress)}</strong> kadarını tamamladınız.</p>
                            <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${overallProgress}%` }}></div></div>
                        </div>
                         <div className="dashboard-card">
                             <h4>Yaklaşan Randevu</h4>
                             {upcomingAppointments.length > 0 ? (
                                <>
                                 <p><strong>{new Date(upcomingAppointments[0].start).toLocaleDateString('tr-TR', {weekday: 'long', day: 'numeric', month: 'long'})}</strong></p>
                                 <p>Saat: <strong>{new Date(upcomingAppointments[0].start).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</strong></p>
                                </>
                             ) : <p>Yaklaşan randevunuz bulunmuyor.</p>}
                         </div>
                    </div>
                     <ExerciseCalendar patient={patient} />
                 </div>
            )}

            {view === 'programs' && patientPrograms.map(program => {
                const programExercises = exercises.filter(ex => program.exerciseIds.includes(ex.id));
                const completedInProgram = programExercises.filter(ex => completedToday.includes(ex.id)).length;
                const progress = programExercises.length > 0 ? (completedInProgram / programExercises.length) * 100 : 0;
                
                return (
                    <div key={program.id} className="program-section">
                        <h3>{program.name}</h3>
                        <p>{program.description}</p>
                        <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
                        <div className="exercise-list">
                            {programExercises.map(ex => (
                                <div key={ex.id} className={`exercise-card ${completedToday.includes(ex.id) ? 'completed' : ''} ${playingVideo?.exerciseId === ex.id || playingAudio === ex.id ? 'playing' : ''}`}>
                                    {ex.imageUrl && <img src={ex.imageUrl} alt={ex.name} className="exercise-card-image" />}
                                    <div className="exercise-info">
                                        <h4>{ex.name} {completedToday.includes(ex.id) && '✓'}</h4>
                                        <p>{ex.description}</p>
                                        <span>{ex.sets} set x {ex.reps} tekrar</span>
                                    </div>
                                    <div className="exercise-actions">
                                        <div>
                                            {ex.videoUrl && <span className="video-icon" onClick={() => setPlayingVideo({ url: ex.videoUrl!, title: ex.name, exerciseId: ex.id })}>🎥</span>}
                                            {ex.audioUrl && <span className="sound-icon" onClick={() => setPlayingAudio(playingAudio === ex.id ? null : ex.id)}>🔊</span>}
                                        </div>
                                        <button className="btn btn-success btn-sm" onClick={() => onCompleteExercise(patient.id, ex.id)} disabled={completedToday.includes(ex.id)}>
                                            {completedToday.includes(ex.id) ? 'Tamamlandı' : 'Bugün Tamamla'}
                                        </button>
                                    </div>
                                    {playingAudio === ex.id && <audio src={ex.audioUrl} controls autoPlay onEnded={() => setPlayingAudio(null)} style={{width: '100%', marginTop: '10px'}}/>}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
             {view === 'programs' && patientPrograms.length === 0 && (
                 <EmptyState title="Henüz Programa Kaydolmadınız" message="Terapistiniz bir program atadığında veya yeni bir programa kaydolduğunuzda burada görünecektir."/>
            )}


            {view === 'journal' && (
                <div className="journal-section">
                    <div className="dashboard-grid journal-grid">
                        <div className="dashboard-card">
                            <h4>Yeni Günlük Girdisi</h4>
                            <form className="journal-form" onSubmit={handleJournalSubmit}>
                                <div className="form-group">
                                    <label>Bugünkü Ağrı Seviyeniz (1-10)</label>
                                    <div className="pain-slider">
                                        <span>1</span>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={painLevel}
                                            onChange={e => setPainLevel(parseInt(e.target.value))}
                                        />
                                        <span>10</span>
                                        <span className="pain-value">{painLevel}</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="journalNote">Notlarınız</label>
                                    <textarea 
                                        id="journalNote"
                                        rows={4}
                                        placeholder="Bugün nasıl hissettiğinizi, egzersizlerin nasıl gittiğini veya ağrınızı etkileyen durumları yazabilirsiniz."
                                        value={journalNote}
                                        onChange={e => setJournalNote(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary">Günlüğe Ekle</button>
                            </form>
                        </div>
                        <div className="dashboard-card">
                            <LineChart data={patient.painJournal} title="Ağrı Seviyesi Değişimi" />
                        </div>
                    </div>
                     <div className="journal-history dashboard-card">
                        <h4>Geçmiş Girdiler</h4>
                        <div className="journal-list">
                            {patient.painJournal.length > 0 ? [...patient.painJournal].reverse().map(entry => (
                                <div key={entry.date} className="journal-entry">
                                    <div className="entry-header">
                                        <strong>{new Date(entry.date).toLocaleDateString('tr-TR')}</strong>
                                        <span className="entry-pain-level">Ağrı: {entry.painLevel}/10</span>
                                    </div>
                                    <p>{entry.note}</p>
                                </div>
                            )) : <p className="empty-list-text">Henüz günlük girdiniz yok.</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {playingVideo && <VideoModal url={playingVideo.url} title={playingVideo.title} onClose={() => setPlayingVideo(null)} />}
        </div>
    );
};

export default PatientDashboard;