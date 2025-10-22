/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Converts a Blob to a data URL string in a Node.js environment.
 * @param blob The Blob to convert.
 * @returns A promise that resolves with the data URL string.
 */
export async function blobToDataURL(blob: Blob): Promise<string> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:${blob.type};base64,${base64}`;
}

/**
 * Decodes a base64 string into a Uint8Array. Node.js environment.
 * @param base64 The base64 encoded string.
 * @returns The decoded Uint8Array.
 */
export const decodeBase64 = (base64: string): Uint8Array => {
    const buffer = Buffer.from(base64, 'base64');
    return new Uint8Array(buffer);
};

/**
 * Creates a valid WAV file Blob from raw PCM data in a Node.js environment.
 * @param pcmData The raw PCM data (16-bit signed integers).
 * @param sampleRate The sample rate (e.g., 24000).
 * @param numChannels The number of channels (e.g., 1 for mono).
 * @returns A Blob representing the WAV file.
 */
export const createWavFileBlob = (pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob => {
    const bitsPerSample = 16;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byteRate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // blockAlign
    view.setUint16(34, bitsPerSample, true);
    
    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    // This part is slightly different in Node.js vs Browser for performance
    const wavBytes = new Uint8Array(buffer);
    wavBytes.set(pcmData, 44);

    return new Blob([wavBytes], { type: 'audio/wav' });
};
