/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Category, EditableItem, Exercise, Patient, TherapyProgram, Therapist, Appointment } from '../types';
import { generateExerciseWithAI, generateVideoFromImageAI } from '../services/aiService';

interface ModalProps {
    isOpen: boolean;
    mode: 'add' | 'edit' | null;
    type: 'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote' | 'appointment' | null;
    editingItem: EditableItem | null;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onUpsertAppointment: (app: Partial<Appointment> & { id?: string }) => void;
    categories: Category[];
    exercises: Exercise[];
    therapists: Therapist[];
    patients: Patient[];
    programs: TherapyProgram[];
}

const Modal: React.FC<ModalProps> = ({ isOpen, mode, type, editingItem, onClose, onSubmit, onUpsertAppointment, categories, exercises, therapists, patients, programs }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [generatedData, setGeneratedData] = useState<Partial<Exercise> | null>(null);

    // State for image-to-video generation
    const [videoImageFile, setVideoImageFile] = useState<File | null>(null);
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const videoFileInputRef = useRef<HTMLInputElement>(null);
    

    useEffect(() => {
        if (isOpen) {
            // Reset all generation state when modal opens
            setGeneratedData(null);
            setIsGenerating(false);
            setGenerationStatus('');
            setVideoImageFile(null);
            setVideoPrompt('');
            if (videoFileInputRef.current) videoFileInputRef.current.value = "";
        }
    }, [isOpen]);

    const handleGenerateExercise = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const prompt = formData.get('prompt') as string;
        const wants = {
            image: formData.has('wants-image'),
            video: formData.has('wants-video'),
            audio: formData.has('wants-audio'),
        };
        if (!prompt) return;
        
        setIsGenerating(true);
        setGeneratedData(null);
        setGenerationStatus('Egzersiz yapay zeka ile oluşturuluyor... Bu işlem biraz zaman alabilir.');

        try {
            const finalData = await generateExerciseWithAI(prompt, wants, setGenerationStatus);
            setGeneratedData(finalData);
            setGenerationStatus('Oluşturma tamamlandı! Lütfen kontrol edip kaydedin.');
        } catch (error) {
            setGenerationStatus(`Bir hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen Hata"}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateVideoFromImage = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!videoImageFile) {
            setGenerationStatus("Lütfen bir başlangıç görseli seçin.");
            return;
        }
        
        setIsGenerating(true);
        setGeneratedData(null);
        setGenerationStatus('Video oluşturma işlemi başlatıldı. Bu işlem birkaç dakika sürebilir...');

        try {
            const generatedData = await generateVideoFromImageAI(videoImageFile, videoPrompt, videoAspectRatio, setGenerationStatus);
            setGeneratedData(generatedData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Hata";
            setGenerationStatus(`Bir hata oluştu: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const isCategory = type === 'category', isService = type === 'service', isPatient = type === 'patient',
          isExercise = type === 'exercise', isTherapist = type === 'therapist', isClinicalNote = type === 'clinicalNote', isAppointment = type === 'appointment';
    
    let title = `${mode === 'add' ? 'Yeni Ekle' : 'Düzenle'}: `;
    if (isCategory) title += 'Kategori';
    else if (isService) title += 'Program';
    else if (isPatient) title += 'Danışan';
    else if (isExercise) title += 'Egzersiz';
    else if (isTherapist) title += 'Terapist';
    else if (isClinicalNote) title += 'Klinik Not (SOAP)';
    else if (isAppointment) title = mode === 'add' ? 'Yeni Randevu Oluştur' : 'Randevu Detayları';
    
    const editingPatient = isPatient ? editingItem as Patient : null;
    const editingProgram = isService ? editingItem as TherapyProgram : null;
    const editingExercise = isExercise ? editingItem as Exercise : null;
    const editingTherapist = isTherapist ? editingItem as Therapist : null;
    const editingAppointment = isAppointment ? editingItem as Appointment : null;
    const mergedExerciseData = { ...editingExercise, ...generatedData };

    const renderAppointmentContent = () => {
        if (!editingAppointment) return null;

        if (mode === 'add') {
             const therapistPatients = patients.filter(p => p.therapistId === editingAppointment.therapistId);
            return (
                 <form onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     onUpsertAppointment({
                        therapistId: editingAppointment.therapistId,
                        start: editingAppointment.start,
                        patientId: formData.get('patientId') as string,
                        notes: formData.get('notes') as string,
                     });
                 }} className="modal-form">
                    <p><strong>Tarih & Saat:</strong> {new Date(editingAppointment.start).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                     <div className="form-group">
                        <label htmlFor="patientId">Danışan</label>
                        <select id="patientId" name="patientId" required>
                             {therapistPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="notes">Randevu Notları</label>
                        <textarea id="notes" name="notes" rows={4} placeholder="Randevu için kısa bir not veya başlık girin..."></textarea>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
                        <button type="submit" className="btn btn-primary">Randevu Oluştur</button>
                    </div>
                 </form>
            )
        }

        if (mode === 'edit') {
            const patient = patients.find(p => p.id === editingAppointment.patientId);
            return (
                <div className="appointment-details-view">
                    <p><strong>Danışan:</strong> {patient?.name || 'Bilinmiyor'}</p>
                    <p><strong>Tarih & Saat:</strong> {new Date(editingAppointment.start).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                    <p><strong>Durum:</strong> <span className={`status-badge status-${editingAppointment.status}`}>{editingAppointment.status}</span></p>
                    {editingAppointment.notes && (
                        <div className="appointment-notes">
                            <h5>Randevu Notları</h5>
                            <p>{editingAppointment.notes}</p>
                        </div>
                    )}
                     <div className="modal-footer appointment-actions">
                        {editingAppointment.status === 'scheduled' && <button type="button" className="btn btn-danger" onClick={() => onUpsertAppointment({ ...editingAppointment, status: 'canceled' })}>Randevuyu İptal Et</button>}
                        <div>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Kapat</button>
                             {editingAppointment.status === 'scheduled' && <button type="button" className="btn btn-success" onClick={() => onUpsertAppointment({ ...editingAppointment, status: 'completed' })}>Görüşmeyi Tamamla</button>}
                        </div>
                    </div>
                </div>
            )
        }
        return null;
    }


    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button onClick={onClose} className="close-button">&times;</button></div>
                
                {isAppointment && renderAppointmentContent()}

                {isExercise && mode === 'add' && !generatedData && (
                    <>
                        <form onSubmit={handleGenerateExercise}>
                             <div className="ai-generator-box">
                                <h4>Metinden Egzersiz Oluşturucu</h4>
                                <div className="form-group"><label htmlFor="prompt">Egzersiz Açıklaması</label><textarea id="prompt" name="prompt" rows={2} placeholder="Örn: Oturarak yapılan basit bir diz güçlendirme egzersizi" required disabled={isGenerating}/></div>
                                <div className="form-group">
                                    <label>Ek Materyaller Oluşturulsun mu?</label>
                                    <p style={{fontSize: '0.9rem', color: 'var(--secondary-color)', marginTop: '-0.5rem', marginBottom: '0.5rem'}}>Yapay zeka, verdiğiniz istemden egzersizin adını, açıklamasını, set ve tekrar sayılarını otomatik olarak oluşturacaktır. İsteğe bağlı olarak aşağıdaki ek materyalleri de oluşturabilirsiniz:</p>
                                    <div className="checklist-group">
                                        <div className="checklist-item"><input type="checkbox" name="wants-image" defaultChecked disabled={isGenerating}/><label>Görsel</label></div>
                                        <div className="checklist-item"><input type="checkbox" name="wants-video" disabled={isGenerating}/><label>Video</label></div>
                                        <div className="checklist-item"><input type="checkbox" name="wants-audio" disabled={isGenerating}/><label>Sesli Anlatım</label></div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isGenerating}>{isGenerating ? 'Oluşturuluyor...' : 'Metinden Oluştur'}</button>
                            </div>
                        </form>
                        <form onSubmit={handleGenerateVideoFromImage}>
                             <div className="ai-generator-box" style={{marginTop: '1rem'}}>
                                <h4>Görselden Video Oluşturucu (Veo)</h4>
                                <div className="form-group">
                                     <label htmlFor="video-image">Başlangıç Görseli</label>
                                     <input type="file" id="video-image" name="video-image" accept="image/*" ref={videoFileInputRef} onChange={(e) => setVideoImageFile(e.target.files?.[0] || null)} required disabled={isGenerating}/>
                                </div>
                                <div className="form-group"><label htmlFor="video-prompt">Video İstem (Prompt)</label><textarea id="video-prompt" name="video-prompt" value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} rows={2} placeholder="Örn: Bir kişi bu egzersizi yavaşça yapıyor, sinematik stil" required disabled={isGenerating}/></div>
                                <div className="form-group">
                                    <label htmlFor="aspect-ratio">En-Boy Oranı</label>
                                    <select id="aspect-ratio" name="aspect-ratio" value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as '16:9' | '9:16')} disabled={isGenerating}>
                                        <option value="16:9">16:9 (Yatay)</option>
                                        <option value="9:16">9:16 (Dikey)</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isGenerating}>{isGenerating ? 'Oluşturuluyor...' : 'Görselden Video Oluştur'}</button>
                            </div>
                        </form>

                        {(generationStatus) && <p className="generation-status">{generationStatus}</p>}
                    </>
                )}

                {(!isExercise || mode === 'edit' || (mode === 'add' && generatedData) || isClinicalNote || isCategory || isService || isPatient || isTherapist) && (
                    <form onSubmit={onSubmit} className="modal-form">
                        <input type="hidden" name="generatedData" value={JSON.stringify(generatedData || {})} />
                        
                        {!isClinicalNote && !isAppointment && <div className="form-group"><label htmlFor="name">İsim</label><input type="text" id="name" name="name" defaultValue={mergedExerciseData?.name || (editingItem && 'name' in editingItem ? editingItem.name : '') || ''} required /></div>}
                        {(isService || isExercise) && <div className="form-group"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" rows={4} defaultValue={mergedExerciseData?.description || (editingItem && 'description' in editingItem ? editingItem.description : '') || ''} required /></div>}
                        {isService && (<>
                            <div className="form-group"><label htmlFor="categoryId">Kategori</label><select name="categoryId" id="categoryId" defaultValue={editingProgram?.categoryId} required>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="form-group"><label>Programa Egzersiz Ekle</label><div className="exercise-checklist">{exercises.map(ex => (<div key={ex.id} className="checklist-item"><input type="checkbox" id={`exercise-${ex.id}`} name={`exercise-${ex.id}`} defaultChecked={editingProgram?.exerciseIds.includes(ex.id)}/><label htmlFor={`exercise-${ex.id}`}>{ex.name}</label></div>))}</div></div>
                        </>)}
                        {isExercise && (<>
                            <div className="form-row"><div className="form-group"><label htmlFor="sets">Set</label><input type="number" id="sets" name="sets" defaultValue={mergedExerciseData?.sets || 3} required min="1" /></div><div className="form-group"><label htmlFor="reps">Tekrar</label><input type="number" id="reps" name="reps" defaultValue={mergedExerciseData?.reps || 10} required min="1" /></div></div>
                            {generatedData && (<div className="asset-previews">
                                <h4>Oluşturulan Materyaller</h4>
                                {generatedData.imageUrl && <div className="preview-item"><p>Görsel:</p><img src={generatedData.imageUrl} alt="AI generated exercise" className="preview-image"/></div>}
                                {generatedData.videoUrl && <div className="preview-item"><p>Video:</p><video src={generatedData.videoUrl} controls className="preview-video"/></div>}
                                {generatedData.audioUrl && <div className="preview-item"><p>Ses:</p><audio src={generatedData.audioUrl} controls className="preview-audio"/></div>}
                            </div>)}
                        </>)}
                        {isPatient && (<>
                            <div className="form-group"><label htmlFor="email">E-posta</label><input type="email" id="email" name="email" defaultValue={editingPatient?.email || ''} required /></div>
                            <div className="form-group"><label htmlFor="therapistId">Terapist</label><select name="therapistId" id="therapistId" defaultValue={editingPatient?.therapistId} required>{therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                            <div className="form-group"><label>Kayıtlı Programlar</label><div className="service-checklist">{programs.map(s => (<div key={s.id} className="checklist-item"><input type="checkbox" id={`service-${s.id}`} name={`service-${s.id}`} defaultChecked={editingPatient?.serviceIds.includes(s.id)}/><label htmlFor={`service-${s.id}`}>{s.name}</label></div>))}</div></div>
                        </>)}
                        {isTherapist && (<>
                            <div className="form-group"><label htmlFor="email">E-posta</label><input type="email" id="email" name="email" defaultValue={editingTherapist?.email || ''} required /></div>
                            <div className="form-group"><label htmlFor="bio">Biyografi</label><textarea id="bio" name="bio" rows={3} defaultValue={editingTherapist?.bio || ''}></textarea></div>
                            <div className="form-group"><label htmlFor="profileImageUrl">Profil Fotoğrafı URL</label><input type="text" id="profileImageUrl" name="profileImageUrl" defaultValue={editingTherapist?.profileImageUrl || ''} /></div>
                        </>)}
                        {isClinicalNote && (<>
                            <div className="form-group"><label htmlFor="subjective">Sübjektif (S)</label><textarea id="subjective" name="subjective" rows={3} placeholder="Danışanın ifadeleri, şikayetleri..." required></textarea></div>
                            <div className="form-group"><label htmlFor="objective">Objektif (O)</label><textarea id="objective" name="objective" rows={3} placeholder="Ölçülebilir bulgular, test sonuçları..." required></textarea></div>
                            <div className="form-group"><label htmlFor="assessment">Analiz (A)</label><textarea id="assessment" name="assessment" rows={3} placeholder="Profesyonel değerlendirme, tanı..." required></textarea></div>
                            <div className="form-group"><label htmlFor="plan">Plan (P)</label><textarea id="plan" name="plan" rows={3} placeholder="Tedavi planı, sonraki adımlar..." required></textarea></div>
                        </>)}
                        
                        {!isAppointment && (
                             <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button><button type="submit" className="btn btn-primary">Kaydet</button></div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default Modal;