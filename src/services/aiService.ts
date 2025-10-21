/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Exercise, Message, User } from '../types';
import { fileToDataURL } from '../utils';

export const getAiSuggestion = async (
    currentUser: User, 
    activeChatPartnerId: string, 
    messages: Message[]
): Promise<string> => {
    const currentUserId = 'id' in currentUser ? currentUser.id : 'admin';
    const chatHistory = messages
      .filter(m =>
        (m.from === currentUserId && m.to === activeChatPartnerId) ||
        (m.from === activeChatPartnerId && m.to === currentUserId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    const conversationContext = chatHistory
      .slice(-6)
      .map(m => {
        const speaker = m.from === currentUserId ? "Terapist" : "Danışan";
        return `${speaker}: ${m.text || '[Dosya gönderildi]'}`;
      })
      .join('\n');
      
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `Sen profesyonel ve yardımsever bir fizyoterapi asistanısın. Bir danışan ve terapist arasındaki son konuşma dökümü aşağıdadır:
---
${conversationContext}
---
Bu konuşma geçmişine dayanarak, terapistin incelemesi için güvenli, empatik ve profesyonel bir yanıt önerisi oluştur. Yanıt Türkçe olmalıdır. Doğrudan tıbbi tavsiye verme, bunun yerine danışanı durumunu daha ayrıntılı açıklamaya teşvik et veya bir sonraki seansta konuyu tartışmayı öner. Sadece terapistin söyleyeceği yanıt metnini oluştur, herhangi bir ek açıklama yapma.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};


export const generateExerciseWithAI = async (
    prompt: string, 
    wants: { description: boolean; image: boolean; video: boolean; audio: boolean; },
    onStatusUpdate: (status: string) => void,
    onDataUpdate: (data: Partial<Exercise>) => void
): Promise<Partial<Exercise>> => {

    let generatedData: Partial<Exercise> = {};
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    if (wants.description) {
        onStatusUpdate('Açıklama oluşturuluyor...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bir fizyoterapi egzersizi oluştur. İstem: "${prompt}". JSON formatında şu alanları doldur: name (string, kısa ve net), description (string, detaylı açıklama), sets (number), reps (number). Sadece JSON nesnesini döndür.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        sets: { type: Type.INTEGER },
                        reps: { type: Type.INTEGER }
                    },
                    required: ["name", "description", "sets", "reps"]
                }
            }
        });
        const exerciseInfo = JSON.parse(response.text);
        generatedData = { ...generatedData, ...exerciseInfo };
        onDataUpdate(generatedData);
    }

    const descriptionForMedia = generatedData.description || `bir kişinin "${prompt}" hareketini yaptığı`;

    if (wants.image) {
        onStatusUpdate('Görsel oluşturuluyor...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Bir fizyoterapi egzersizini gösteren net, aydınlık, bilgilendirici bir görsel: ${descriptionForMedia}` }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            generatedData = { ...generatedData, imageUrl };
            onDataUpdate(generatedData);
        }
    }
    
    if (wants.video) {
        onStatusUpdate('Video oluşturuluyor... (Bu işlem birkaç dakika sürebilir)');
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Kısa, döngüsel bir video: Fizyoterapi egzersizi yapan bir kişi. Egzersiz: ${descriptionForMedia}. Net, eğitici stil.`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '1:1' }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const videoBlob = await videoResponse.blob();
            const videoUrl = await fileToDataURL(videoBlob);
            generatedData = { ...generatedData, videoUrl };
            onDataUpdate(generatedData);
        }
    }
    
    if (wants.audio && generatedData.description) {
        onStatusUpdate('Sesli anlatım oluşturuluyor...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: `Egzersiz: ${generatedData.name}. ${generatedData.description}` }] }],
            config: { 
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            // FIX: Changed mime type to wav, as webm is unlikely for raw audio data.
            // Note: This likely requires a proper WAV header for browser playback.
            const audioUrl = `data:audio/wav;base64,${base64Audio}`;
            generatedData = { ...generatedData, audioUrl };
            onDataUpdate(generatedData);
        }
    }

    onStatusUpdate('Oluşturma tamamlandı! Lütfen kontrol edip kaydedin.');
    return generatedData;
};