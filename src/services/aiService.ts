/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Exercise, FAQItem, Message, User, Patient } from '../types';
import { blobToBase64 } from '../utils';

/**
 * A helper function to call our own backend API for AI tasks.
 * This centralizes API calls and error handling.
 * @param task The specific AI task to be executed on the backend.
 * @param payload The data required for the task.
 * @returns A promise that resolves with the result from the backend.
 */
async function callApi<T>(task: string, payload: any): Promise<T> {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, payload }),
    });

    const data = await response.json();
    if (!response.ok) {
        // Pass the server-side error message to the user
        throw new Error(data.error || 'API isteği başarısız oldu.');
    }
    return data.result;
}

export const getAiSuggestion = (currentUser: User, activeChatPartnerId: string, messages: Message[]): Promise<string> => {
    return callApi<string>('getSuggestion', { currentUser, activeChatPartnerId, messages });
};

export const generateExerciseWithAI = (
    prompt: string, 
    wants: { description: boolean; image: boolean; video: boolean; audio: boolean; }
): Promise<Partial<Exercise>> => {
    return callApi<Partial<Exercise>>('generateExercise', { prompt, wants });
};

export const getAiPatientSummary = (patient: Patient): Promise<string> => {
    return callApi<string>('getPatientSummary', { patient });
};

export const getAiAdminSummary = (stats: {
    totalPatients: number;
    totalTherapists: number;
    completedAppointments: number;
    patientEngagement: number;
}): Promise<string> => {
    return callApi<string>('getAdminSummary', { stats });
};

export const getFaqAnswer = (userQuestion: string, faqs: FAQItem[]): Promise<string> => {
    return callApi<string>('getFaqAnswer', { userQuestion, faqs });
};

export const generateVideoFromImageAI = async (
    imageFile: File,
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onStatusUpdate: (status: string) => void,
): Promise<Partial<Exercise>> => {
    onStatusUpdate('Görsel hazırlanıyor ve sunucuya yükleniyor...');
    const base64Image = await blobToBase64(imageFile);

    onStatusUpdate('Video oluşturma işlemi başlatılıyor...');
    const startPayload = {
        prompt: `Kısa, döngüsel bir video: ${prompt}`,
        image: {
            imageBytes: base64Image,
            mimeType: imageFile.type,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };

    let operation = await callApi<any>('generateVideo_start', startPayload);

    let progressCounter = 0;
    const progressMessages = [ "İlk kareler oluşturuluyor...", "Hareket vektörleri hesaplanıyor...", "Görüntü akışı render ediliyor...", "Son rötuşlar yapılıyor..." ];
    
    onStatusUpdate('Video işleniyor... Bu süreçte ekranı kapatmayın.');

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onStatusUpdate(`Video işleniyor... (${progressMessages[progressCounter % progressMessages.length]})`);
        progressCounter++;
        operation = await callApi<any>('generateVideo_poll', { operation });
    }

    onStatusUpdate('Video alınıyor...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (downloadLink) {
        const videoUrl = await callApi<string>('generateVideo_fetch', { downloadLink });
        onStatusUpdate('Video başarıyla oluşturuldu!');
        return {
            videoUrl,
            name: prompt || 'Oluşturulan Video Egzersizi',
            description: `Bu egzersiz, "${prompt}" istemiyle bir görselden oluşturulmuştur.`,
            sets: 3,
            reps: 10,
        };
    } else {
        throw new Error('Video oluşturulamadı. Model bir sonuç döndürmedi.');
    }
};
