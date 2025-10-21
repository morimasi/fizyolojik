/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Category, EditableItem, Exercise, Patient, TherapyProgram, Therapist } from '../types';
import { generateExerciseWithAI } from '../services/aiService';

interface ModalProps {
    isOpen: boolean;
    mode: 'add' | 'edit' | null;
    type: 'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote' | null;
    editingItem: EditableItem | null;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    categories: Category[];
    exercises: Exercise[];
    therapists: Therapist[];
    programs: TherapyProgram[];
}

const Modal: React.FC<ModalProps> = ({ isOpen, mode, type, editingItem, onClose, onSubmit, categories, exercises, therapists, programs }) => {
    const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [generatedExerciseData, setGeneratedExerciseData] = useState<Partial<Exercise> | null>(null);

    useEffect(() => {
        if (isOpen) {
            setGeneratedExerciseData(null);
            setIsGeneratingExercise(false);
            setGenerationStatus('');
        }
    }, [isOpen]);

    if (!isOpen || !type || !mode) return null;

    const handleGenerateExercise = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const prompt = formData.get('prompt') as string;
        const wants = { description: formData.has('wants-description'), image: formData.has('wants-image'), video: formData.has('wants-video'), audio: formData.has('wants-audio'), };
        if (!prompt) return;
        setIsGeneratingExercise(true);
        setGeneratedExerciseData(null);
        try {
            await generateExerciseWithAI(prompt, wants, setGenerationStatus, (data) => setGeneratedExerciseData(prev => ({...prev, ...data})));
        } catch (error) {
            setGenerationStatus(`Bir hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen Hata"}`);
        } finally {
            setIsGeneratingExercise(false);
        }
    };
    
    const isCategory = type === 'category', isService = type === 'service', isPatient = type === 'patient',
          isExercise = type === 'exercise', isTherapist = type === 'therapist', isClinicalNote = type === 'clinicalNote';
    
    const title = `${mode === 'add' ? 'Yeni Ekle' : 'Düzenle'}: ${isCategory ? 'Kategori' : isService ? 'Program' : isPatient ? 'Danışan' : isExercise ? 'Egzersiz' : isTherapist ? 'Terapist' : 'Klinik Not (SOAP)'}`;
    
    const editingPatient = isPatient ? editingItem as Patient : null;
    const editingProgram = isService ? editingItem as TherapyProgram : null;
    const editingExercise = isExercise ? editingItem as Exercise : null;
    const editingTherapist = isTherapist ? editingItem as Therapist : null;
    const mergedExerciseData = { ...editingExercise, ...generatedExerciseData };

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button onClick={onClose} className="close-button">&times;</button></div>
                
                {isExercise && mode === 'add' && !generatedExerciseData && (
                    <form onSubmit={handleGenerateExercise}>
                         <div className="ai-generator-box">
                            <h4>Yapay Zeka Egzersiz Üreticisi</h4>
                            <div className="form-group"><label htmlFor="prompt">Egzersiz Açıklaması</label><textarea id="prompt" name="prompt" rows={3} placeholder="Örn: Oturarak yapılan basit bir diz güçlendirme egzersizi" required disabled={isGeneratingExercise}/></div>
                            <div className="form-group">
                                <label>Neler Oluşturulsun?</label>
                                <div className="checklist-group">
                                    <div className="checklist-item"><input type="checkbox" name="wants-description" defaultChecked disabled={isGeneratingExercise}/><label>Açıklama</label></div>
                                    <div className="checklist-item"><input type="checkbox" name="wants-image" defaultChecked disabled={isGeneratingExercise}/><label>Görsel</label></div>
                                    <div className="checklist-item"><input type="checkbox" name="wants-video" defaultChecked disabled={isGeneratingExercise}/><label>Video</label></div>
                                    <div className="checklist-item"><input type="checkbox" name="wants-audio" defaultChecked disabled={isGeneratingExercise}/><label>Sesli Anlatım</label></div>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isGeneratingExercise}>{isGeneratingExercise ? 'Oluşturuluyor...' : 'Yapay Zeka ile Oluştur'}</button>
                        </div>
                        {(isGeneratingExercise || generationStatus) && <p className="generation-status">{generationStatus}</p>}
                    </form>
                )}

                {(!isExercise || mode === 'edit' || (mode === 'add' && generatedExerciseData) || isClinicalNote) && (
                    <form onSubmit={onSubmit} className="modal-form">
                        <input type="hidden" name="generatedData" value={JSON.stringify(generatedExerciseData || {})} />
                        
                        {/* FIX: Used type guard to safely access 'name' property. */}
                        {!isClinicalNote && <div className="form-group"><label htmlFor="name">İsim</label><input type="text" id="name" name="name" defaultValue={mergedExerciseData?.name || (editingItem && 'name' in editingItem ? editingItem.name : '') || ''} required /></div>}
                        {/* FIX: Used type guard to safely access 'description' property. */}
                        {(isService || isExercise) && <div className="form-group"><label htmlFor="description">Açıklama</label><textarea id="description" name="description" rows={4} defaultValue={mergedExerciseData?.description || (editingItem && 'description' in editingItem ? editingItem.description : '') || ''} required /></div>}
                        {isService && (<>
                            <div className="form-group"><label htmlFor="categoryId">Kategori</label><select name="categoryId" id="categoryId" defaultValue={editingProgram?.categoryId} required>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="form-group"><label>Programa Egzersiz Ekle</label><div className="exercise-checklist">{exercises.map(ex => (<div key={ex.id} className="checklist-item"><input type="checkbox" id={`exercise-${ex.id}`} name={`exercise-${ex.id}`} defaultChecked={editingProgram?.exerciseIds.includes(ex.id)}/><label htmlFor={`exercise-${ex.id}`}>{ex.name}</label></div>))}</div></div>
                        </>)}
                        {isExercise && (<>
                            <div className="form-row"><div className="form-group"><label htmlFor="sets">Set</label><input type="number" id="sets" name="sets" defaultValue={mergedExerciseData?.sets || 3} required min="1" /></div><div className="form-group"><label htmlFor="reps">Tekrar</label><input type="number" id="reps" name="reps" defaultValue={mergedExerciseData?.reps || 10} required min="1" /></div></div>
                            {generatedExerciseData && (<div className="asset-previews">
                                <h4>Oluşturulan Materyaller</h4>
                                {generatedExerciseData.imageUrl && <div className="preview-item"><p>Görsel:</p><img src={generatedExerciseData.imageUrl} alt="AI generated exercise" className="preview-image"/></div>}
                                {generatedExerciseData.videoUrl && <div className="preview-item"><p>Video:</p><video src={generatedExerciseData.videoUrl} controls className="preview-video"/></div>}
                                {generatedExerciseData.audioUrl && <div className="preview-item"><p>Ses:</p><audio src={generatedExerciseData.audioUrl} controls className="preview-audio"/></div>}
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
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button><button type="submit" className="btn btn-primary">Kaydet</button></div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Modal;