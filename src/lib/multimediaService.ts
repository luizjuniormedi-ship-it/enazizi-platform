/**
 * Multimedia Service Layer
 * Handles TTS audio generation and avatar narration for tutor explanations.
 * Prepared for backend integration with real TTS/Avatar services.
 */

export type MediaStatus = "idle" | "generating" | "ready" | "error";

export interface MultimediaState {
  text_content: string;
  audio_url: string | null;
  avatar_video_url: string | null;
  voice_type: string;
  avatar_type: string;
  avatar_style: "cinematic" | "3d" | "video";
  status_audio: MediaStatus;
  status_avatar: MediaStatus;
  error_audio?: string;
  error_avatar?: string;
}

export const createMultimediaState = (text: string): MultimediaState => ({
  text_content: text,
  audio_url: null,
  avatar_video_url: null,
  voice_type: "default",
  avatar_type: "3d-doctor",
  avatar_style: "cinematic",
  status_audio: "idle",
  status_avatar: "idle",
});

// Cache to reuse already-generated media
const mediaCache = new Map<string, MultimediaState>();

const getCacheKey = (text: string, type: "audio" | "avatar") => {
  const hash = text.slice(0, 100) + text.length;
  return `${type}:${hash}`;
};

/**
 * Generate audio from text explanation.
 * Currently uses Web Speech API (browser TTS).
 * Ready to be swapped for ElevenLabs or other TTS backend.
 */
export async function generateAudio(
  text: string,
  onStatusChange: (status: MediaStatus, url?: string, error?: string) => void
): Promise<void> {
  const cacheKey = getCacheKey(text, "audio");
  const cached = mediaCache.get(cacheKey);
  if (cached?.audio_url) {
    onStatusChange("ready", cached.audio_url);
    return;
  }

  onStatusChange("generating");

  try {
    // Use Web Speech API to generate audio as a fallback
    // In production, replace with edge function call to TTS service
    const cleanText = text
      .replace(/[#*_`~>\-|]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .replace(/\n{2,}/g, ". ");

    // For now we use SpeechSynthesis directly (no URL needed)
    // When backend TTS is ready, this will return an audio_url
    onStatusChange("ready", `speech:${Date.now()}`);

    // Cache the result
    mediaCache.set(cacheKey, {
      text_content: text,
      audio_url: `speech:${Date.now()}`,
      avatar_video_url: null,
      voice_type: "browser-tts",
      avatar_type: "3d-doctor",
      status_audio: "ready",
      status_avatar: "idle",
    });
  } catch (err: any) {
    onStatusChange("error", undefined, err.message || "Erro ao gerar áudio");
  }
}

/**
 * Generate avatar narration from text.
 * Currently uses the 3D procedural avatar + Web Speech API.
 * Ready to be swapped for video avatar service.
 */
export async function generateAvatar(
  text: string,
  onStatusChange: (status: MediaStatus, url?: string, error?: string) => void
): Promise<void> {
  const cacheKey = getCacheKey(text, "avatar");
  const cached = mediaCache.get(cacheKey);
  if (cached?.avatar_video_url) {
    onStatusChange("ready", cached.avatar_video_url);
    return;
  }

  onStatusChange("generating");

  try {
    // Simulate short processing (avatar + TTS sync)
    await new Promise((r) => setTimeout(r, 500));
    
    // For now, avatar narration uses the 3D avatar + speech synthesis
    // When a video avatar service is integrated, this will return a video URL
    onStatusChange("ready", `avatar-live:${Date.now()}`);

    mediaCache.set(cacheKey, {
      text_content: text,
      audio_url: null,
      avatar_video_url: `avatar-live:${Date.now()}`,
      voice_type: "browser-tts",
      avatar_type: "3d-doctor",
      status_audio: "idle",
      status_avatar: "ready",
    });
  } catch (err: any) {
    onStatusChange("error", undefined, err.message || "Erro ao gerar avatar");
  }
}

export function clearMediaCache() {
  mediaCache.clear();
}
