

# Refactoring Tutor IA (ChatGPT.tsx) — Plan

## Problem
`ChatGPT.tsx` is 1373 lines containing UI, streaming logic, data fetching, session management, TTS/STT, and study flow state all in one file. The streaming logic (lines 651-703) has careful buffering to prevent cut sentences — this must be preserved exactly.

## Architecture

```text
src/pages/ChatGPT.tsx (orchestrator, ~150 lines)
├── src/hooks/tutor/
│   ├── useStreamingResponse.ts   — SSE reader, chunk assembly, buffer
│   ├── useChatMessages.ts        — messages state, conversation CRUD
│   ├── useChatProgress.ts        — ENAZIZI 14-step flow, phase actions
│   ├── useChatContext.ts         — uploads, error bank, question bank, context builder
│   ├── useTutorPerformance.ts    — study_performance + domain map + session stats
│   ├── useTutorAudio.ts          — TTS (speakText, stopSpeaking, autoSpeak)
│   └── useSpeechToText.ts        — STT (mic recognition)
├── src/components/tutor/
│   ├── TutorHeader.tsx           — avatar, title, dropdown menu
│   ├── TutorStartScreen.tsx      — topic input, quick topics, weak topics, history, uploads
│   ├── TutorStepTracker.tsx      — progress bar, step info, phase advance buttons
│   ├── TutorMessageList.tsx      — scrollable chat area with message items
│   ├── TutorMessageItem.tsx      — single message (markdown, copy, MultimediaControls)
│   ├── TutorInputBar.tsx         — text input + mic + send + stop speaking
│   ├── TutorMetricsBar.tsx       — collapsible metrics cards
│   └── TutorOnboardingCard.tsx   — how-it-works card
│   └── TutorConstants.ts         — MEDSTUDY_STEPS, QUICK_TOPICS, FUNCTION_NAME
```

## Critical Streaming Logic (preserved exactly)

The current streaming implementation at lines 651-703 uses a careful SSE parsing approach:

1. **TextBuffer accumulation** — chunks decoded with `{ stream: true }` to handle multi-byte chars
2. **Line-by-line processing** — only processes complete lines (split on `\n`)
3. **Incomplete JSON recovery** — if `JSON.parse` fails, the line is prepended back to the buffer (`"incomplete"` result)
4. **Final flush** — after reader is done, `decoder.decode()` flushes remaining bytes, then processes remaining lines
5. **Single `assistantSoFar` variable** — accumulates full text, updates state atomically via closure
6. **TTS only after stream completes** — `autoSpeak` fires only after the while loop exits (line 705)

This logic moves **intact** into `useStreamingResponse.ts` as a single `streamResponse()` function. The `assistantSoFar` accumulator becomes a `useRef` to prevent stale closure issues. The `onComplete` callback (for TTS, DB save, error detection) fires only after the full stream is consumed.

### useStreamingResponse.ts key design:
```typescript
// Ref-based accumulator prevents race conditions
const accumulatorRef = useRef("");

// appendChunk updates both ref and state atomically
const appendChunk = (chunk: string) => {
  accumulatorRef.current += chunk;
  setMessages(prev => /* update last assistant msg with accumulatorRef.current */);
};

// onComplete only fires after [DONE] or reader.done
// This is where autoSpeak, DB save, and error detection happen
```

## Files to Create (11 files)

### Hooks (7 files)
1. **`src/hooks/tutor/useStreamingResponse.ts`** — SSE reader with buffer, incomplete-line recovery, ref-based accumulator, onComplete callback
2. **`src/hooks/tutor/useChatMessages.ts`** — messages state, loadConversation, saveMessage, deleteConversation, startNewSession
3. **`src/hooks/tutor/useChatProgress.ts`** — enaziziStep, saveEnaziziStep, handlePhaseAction, getNextPhaseInfo, handleChangeTopic
4. **`src/hooks/tutor/useChatContext.ts`** — uploads, errorBank, bankQuestions, buildUserContext, selectedUploadIds
5. **`src/hooks/tutor/useTutorPerformance.ts`** — performance state, savePerformance, handleFinishSession, session stats
6. **`src/hooks/tutor/useTutorAudio.ts`** — speakText, stopSpeaking, autoSpeak toggle, isSpeaking state
7. **`src/hooks/tutor/useSpeechToText.ts`** — toggleListening, isListening, recognition ref

### Components (9 files)
8. **`src/components/tutor/TutorConstants.ts`** — MEDSTUDY_STEPS, QUICK_TOPICS, FUNCTION_NAME, NON_MEDICAL_KEYWORDS, MEDSTUDY_SEQUENTIAL_APPENDIX
9. **`src/components/tutor/TutorHeader.tsx`** — ~50 lines, avatar + title + dropdown
10. **`src/components/tutor/TutorStartScreen.tsx`** — ~150 lines, topic input, quick topics, weak topics, recent history, uploads
11. **`src/components/tutor/TutorStepTracker.tsx`** — ~80 lines, progress bar + step info + phase buttons
12. **`src/components/tutor/TutorMessageList.tsx`** — ~40 lines, scroll container + loading indicator
13. **`src/components/tutor/TutorMessageItem.tsx`** — ~40 lines, single message bubble with markdown + copy + MultimediaControls
14. **`src/components/tutor/TutorMetricsBar.tsx`** — ~60 lines, collapsible metrics
15. **`src/components/tutor/TutorOnboardingCard.tsx`** — ~40 lines, how-it-works card
16. **`src/components/tutor/TutorInputBar.tsx`** — ~40 lines, input + mic + send

### Modified Files
17. **`src/pages/ChatGPT.tsx`** — reduced to ~150 lines, composing hooks and components

## Streaming Integrity Guarantees

| Risk | Mitigation |
|------|-----------|
| Cut sentences mid-chunk | `assistantSoFar` ref accumulates; state updated with full ref value |
| Incomplete SSE JSON | `"incomplete"` result prepends line back to buffer (preserved exactly) |
| Multi-byte char split | `decoder.decode(value, { stream: true })` preserved |
| TTS before message done | `onComplete` callback fires only after stream loop exits |
| Race condition on state | Single `useRef` accumulator; `setMessages` uses functional updater |
| Premature finalization | Message marked complete only on `[DONE]` or `reader.done` |
| Duplicated state updates | `appendChunk` is the single path for content updates |

## What stays unchanged
- Edge function `chatgpt-agent` — untouched
- `MultimediaControls` component — untouched  
- `CinematicAvatar` component — untouched
- `ResumeSessionBanner` — untouched
- All Supabase table interactions — same queries
- 14-step ENAZIZI flow — same prompts and step numbers
- Visual appearance — identical UI output

