import httpClient from '../httpClient';

// Uploads a recorded WAV chunk for live transcription. The backend expects the
// file under the `audio_file` field.
export const uploadAudioChunk = (lectureId, wavBlob) => {
  const form = new FormData();
  form.append('audio_file', wavBlob, 'audio_chunk.wav');
  return httpClient.post(`/api/audio/lecture/${lectureId}/chunk`, form);
};
