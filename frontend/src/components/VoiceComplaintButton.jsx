import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api'; 
// ─────────────────────────────────────────────
//  VoiceComplaintButton
//  Drop this anywhere in your complaint UI.
//  It guides the citizen through:
//    1. Title  2. Description  3. Category
//    4. Ward   5. Severity     6. Confirm & Submit
//  Uses only the Web Speech API — no VAPI, no paid service.
//  Works on Render free tier 100%.
// ─────────────────────────────────────────────

const STEPS = [
  {
    key: 'title',
    question: 'Welcome to CivicTrack voice complaint. Please say the title of your complaint. For example: Broken road near bus stop.',
    short: 'Complaint Title',
    validate: v => v.trim().length >= 3,
    error: 'Title must be at least 3 characters. Please try again.',
  },
  {
    key: 'description',
    question: 'Now describe your complaint in detail. What is the problem and where exactly is it?',
    short: 'Description',
    validate: v => v.trim().length >= 10,
    error: 'Please give more detail. Try again.',
  },
  {
    key: 'category',
    question:
      'Which category does your complaint belong to? Say one of: Roads, Sanitation, Water, Electricity, or Other.',
    short: 'Category',
    validate: v =>
      ['roads', 'sanitation', 'water', 'electricity', 'other'].includes(v.trim().toLowerCase()),
    error:
      'Please say one of: Roads, Sanitation, Water, Electricity, or Other.',
    normalize: v => {
      const map = {
        roads: 'Roads',
        road: 'Roads',
        sanitation: 'Sanitation',
        water: 'Water',
        electricity: 'Electricity',
        electric: 'Electricity',
        other: 'Other',
      };
      return map[v.trim().toLowerCase()] || v.trim();
    },
  },
  {
    key: 'ward',
    question:
      'Which ward are you reporting from? Please say your ward number or ward name.',
    short: 'Ward',
    validate: v => v.trim().length >= 1,
    error: 'Please say your ward number or name.',
  },
  {
    key: 'severity',
    question:
      'How severe is this issue? Say: Low, Medium, High, or Critical.',
    short: 'Severity',
    validate: v =>
      ['low', 'medium', 'high', 'critical'].includes(v.trim().toLowerCase()),
    error: 'Please say one of: Low, Medium, High, or Critical.',
    normalize: v => v.trim().toLowerCase(),
  },
];

// ── Utility: speak text via SpeechSynthesis ──
function speak(text, onEnd) {
  if (!window.speechSynthesis) {
    onEnd && onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  utterance.onend = () => onEnd && onEnd();
  utterance.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(utterance);
}

// ── Utility: listen via SpeechRecognition ──
function createRecognizer() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const rec = new SpeechRecognition();
  rec.lang = 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  return rec;
}

// ── Status label helper ──
const STATUSES = {
  idle: { label: '🎙️ Start Voice Complaint', color: '#2563eb' },
  speaking: { label: '🔊 Listening...', color: '#7c3aed' },
  listening: { label: '🎤 Speak Now...', color: '#dc2626' },
  processing: { label: '⏳ Processing...', color: '#d97706' },
  done: { label: '✅ Submitted!', color: '#059669' },
  error: { label: '❌ Error', color: '#dc2626' },
  unsupported: { label: '🚫 Not Supported', color: '#6b7280' },
};

export default function VoiceComplaintButton({ onSuccess, floating = false }) {
  const [phase, setPhase] = useState('idle'); // idle | session | done | error | unsupported
  const [status, setStatus] = useState('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [collected, setCollected] = useState({});
  const [transcript, setTranscript] = useState('');
  const [log, setLog] = useState([]); // conversation log for display
  const [retries, setRetries] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const recognizerRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      window.speechSynthesis?.cancel();
      recognizerRef.current?.abort();
    };
  }, []);

  // ── Check browser support ──
  const isSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition) &&
    window.speechSynthesis;

  // ── Add to conversation log ──
  const addLog = (speaker, text) =>
    setLog(prev => [...prev, { speaker, text, time: Date.now() }]);

  // ── Listen for speech ──
  function listenForSpeech(onResult, onError) {
    const rec = createRecognizer();
    if (!rec) {
      onError('Speech recognition not available.');
      return;
    }
    recognizerRef.current = rec;
    setStatus('listening');

    rec.onresult = e => {
      const result = e.results[0][0].transcript;
      setTranscript(result);
      onResult(result);
    };
    rec.onerror = e => {
      onError(e.error || 'Recognition error');
    };
    rec.onend = () => {
      if (isMounted.current && status === 'listening') {
        // If no result came through, trigger error
      }
    };
    rec.start();
  }

  // ── Core: ask question, listen, validate ──
  function askStep(index, currentCollected, currentRetries = 0) {
    if (!isMounted.current) return;
    const step = STEPS[index];
    const question =
      currentRetries === 0 ? step.question : step.error;

    addLog('bot', question);
    setStatus('speaking');

    speak(question, () => {
      if (!isMounted.current) return;
      setStatus('listening');

      listenForSpeech(
        rawValue => {
          if (!isMounted.current) return;
          const value = step.normalize ? step.normalize(rawValue) : rawValue.trim();
          addLog('user', rawValue);

          if (!step.validate(rawValue)) {
            // Invalid answer — retry up to 2 times
            if (currentRetries < 2) {
              setRetries(currentRetries + 1);
              askStep(index, currentCollected, currentRetries + 1);
            } else {
              // Give up on this field, use raw value
              const updated = { ...currentCollected, [step.key]: rawValue.trim() };
              setCollected(updated);
              proceedToNext(index, updated);
            }
            return;
          }

          const updated = { ...currentCollected, [step.key]: value };
          setCollected(updated);
          setRetries(0);
          proceedToNext(index, updated);
        },
        err => {
          if (!isMounted.current) return;
          addLog('bot', `I didn't catch that. Let's try again.`);
          if (currentRetries < 2) {
            askStep(index, currentCollected, currentRetries + 1);
          } else {
            setPhase('error');
            setStatus('error');
          }
        }
      );
    });
  }

  function proceedToNext(index, currentCollected) {
    const nextIndex = index + 1;
    if (nextIndex < STEPS.length) {
      setStepIndex(nextIndex);
      askStep(nextIndex, currentCollected, 0);
    } else {
      // All steps done — confirm
      confirmAndSubmit(currentCollected);
    }
  }

  // ── Confirm collected data then submit ──
  function confirmAndSubmit(data) {
    const summary = `Great! Here is your complaint summary.
      Title: ${data.title}.
      Category: ${data.category}.
      Ward: ${data.ward}.
      Severity: ${data.severity}.
      Say YES to submit, or NO to cancel.`;

    addLog('bot', summary);
    setStatus('speaking');

    speak(summary, () => {
      if (!isMounted.current) return;
      setStatus('listening');

      listenForSpeech(
        answer => {
          addLog('user', answer);
          if (answer.trim().toLowerCase().includes('yes')) {
            submitComplaint(data);
          } else {
            const cancelMsg = 'Complaint cancelled. You can start again anytime.';
            addLog('bot', cancelMsg);
            speak(cancelMsg, () => {
              if (isMounted.current) resetSession();
            });
          }
        },
        () => {
          submitComplaint(data); // default to submit on error
        }
      );
    });
  }

  // ── Submit to your existing POST /api/complaints ──
  async function submitComplaint(data) {
    setSubmitting(true);
    setStatus('processing');

    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      location: {
        ward: data.ward,
        address: `Ward ${data.ward}`,
        lat: 0,
        lng: 0,
      },
      severity: data.severity || 'medium',
      status: 'pending',
      source: 'voice',
    };

    try {
    const response = await api.post('/complaints', payload);
    const saved = response.data;

    const successMsg =
      'Your complaint has been submitted successfully! You will receive an email confirmation. Thank you for using CivicTrack.';
    addLog('bot', successMsg);
    setStatus('done');
    setPhase('done');
    speak(successMsg);

    onSuccess && onSuccess(saved);
  } catch (err) {
    const errMsg =
      'Sorry, there was an error submitting your complaint. Please try again or use the form.';
    addLog('bot', errMsg);
    setStatus('error');
    setPhase('error');
    speak(errMsg);
  } finally {
    setSubmitting(false);
  }
  }

  // ── Start a fresh session ──
  function startSession() {
    if (!isSupported) {
      setPhase('unsupported');
      return;
    }
    setPhase('session');
    setStepIndex(0);
    setCollected({});
    setTranscript('');
    setLog([]);
    setRetries(0);
    setStatus('speaking');

    const intro =
      'Hello! I will help you file a complaint with CivicTrack. Please speak clearly after each question.';
    addLog('bot', intro);

    speak(intro, () => {
      if (isMounted.current) askStep(0, {}, 0);
    });
  }

  function resetSession() {
    window.speechSynthesis?.cancel();
    recognizerRef.current?.abort();
    setPhase('idle');
    setStatus('idle');
    setStepIndex(0);
    setCollected({});
    setTranscript('');
    setLog([]);
    setRetries(0);
    setSubmitting(false);
  }

  // ────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────
  const currentStatus = STATUSES[status] || STATUSES.idle;
  const wrapperStyle = floating ? { ...styles.wrapper, ...styles.floatingWrapper } : styles.wrapper;
  const triggerBtnStyle = floating ? { ...styles.triggerBtn, ...styles.floatingTriggerBtn } : styles.triggerBtn;
  const cardStyle = floating ? { ...styles.card, ...styles.floatingCard } : styles.card;

  return (
    <div style={wrapperStyle}>
      {/* ── Trigger Button ── */}
      {phase === 'idle' && (
        <button
          onClick={startSession}
          disabled={!isSupported}
          title="File complaint by voice"
          aria-label="File complaint by voice"
          style={{
            ...triggerBtnStyle,
            background: isSupported
              ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)'
              : '#9ca3af',
            cursor: isSupported ? 'pointer' : 'not-allowed',
          }}
        >
          <span style={styles.micIcon}>🎙️</span>
          <span style={floating ? styles.floatingLabel : undefined}>
            <strong>Can't type?</strong>
            <br />
            <small>File complaint by voice</small>
          </span>
        </button>
      )}

      {/* ── Unsupported ── */}
      {phase === 'unsupported' && (
        <div style={{ ...cardStyle, borderColor: '#f87171' }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>
            🚫 Your browser doesn't support voice input.
          </p>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            Please use Chrome or Edge on Android or desktop.
          </p>
          <button onClick={resetSession} style={styles.resetBtn}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Active Session ── */}
      {phase === 'session' && (
        <div style={cardStyle}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <span style={{ fontSize: 20 }}>🎙️</span>
            <strong style={{ color: '#1d4ed8' }}>Voice Complaint</strong>
            <button onClick={resetSession} style={styles.closeBtn} title="Cancel">
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((stepIndex) / STEPS.length) * 100}%`,
              }}
            />
          </div>
          <p style={styles.stepLabel}>
            Step {Math.min(stepIndex + 1, STEPS.length)} of {STEPS.length} —{' '}
            {STEPS[Math.min(stepIndex, STEPS.length - 1)].short}
          </p>

          {/* Status pill */}
          <div
            style={{
              ...styles.statusPill,
              background: currentStatus.color + '18',
              borderColor: currentStatus.color,
              color: currentStatus.color,
            }}
          >
            {currentStatus.label}
          </div>

          {/* Pulse animation when listening */}
          {status === 'listening' && (
            <div style={styles.pulseWrapper}>
              <div style={styles.pulseRing} />
              <div style={styles.pulseDot} />
            </div>
          )}

          {/* Live transcript */}
          {transcript && (
            <div style={styles.transcriptBox}>
              <small style={{ color: '#6b7280' }}>You said:</small>
              <p style={{ margin: 0, color: '#111827', fontWeight: 500 }}>
                "{transcript}"
              </p>
            </div>
          )}

          {/* Conversation log */}
          <div style={styles.logBox}>
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  ...styles.logEntry,
                  alignSelf: entry.speaker === 'bot' ? 'flex-start' : 'flex-end',
                  background: entry.speaker === 'bot' ? '#eff6ff' : '#f0fdf4',
                  borderRadius:
                    entry.speaker === 'bot'
                      ? '4px 14px 14px 14px'
                      : '14px 4px 14px 14px',
                }}
              >
                <small style={{ color: '#9ca3af', fontSize: 10 }}>
                  {entry.speaker === 'bot' ? '🤖 CivicTrack' : '👤 You'}
                </small>
                <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                  {entry.text}
                </p>
              </div>
            ))}
          </div>

          {/* Collected data preview */}
          {Object.keys(collected).length > 0 && (
            <div style={styles.collectedBox}>
              {Object.entries(collected).map(([key, val]) => (
                <div key={key} style={styles.collectedRow}>
                  <span style={styles.collectedKey}>
                    {STEPS.find(s => s.key === key)?.short || key}
                  </span>
                  <span style={styles.collectedVal}>{val}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={resetSession} style={styles.resetBtn}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ── Done ── */}
      {phase === 'done' && (
        <div style={{ ...cardStyle, borderColor: '#10b981' }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h3 style={{ color: '#059669', margin: '8px 0 4px' }}>
              Complaint Submitted!
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13 }}>
              Your voice complaint has been saved to our database. Check your
              email for confirmation.
            </p>
          </div>
          <button onClick={resetSession} style={styles.resetBtn}>
            File Another Complaint
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {phase === 'error' && (
        <div style={{ ...cardStyle, borderColor: '#f87171' }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48 }}>❌</div>
            <h3 style={{ color: '#dc2626', margin: '8px 0 4px' }}>
              Something went wrong
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13 }}>
              Please try again or use the text form to file your complaint.
            </p>
          </div>
          <button onClick={startSession} style={{ ...styles.triggerBtn, width: '100%', justifyContent: 'center' }}>
            🔄 Try Again
          </button>
          <button onClick={resetSession} style={{ ...styles.resetBtn, marginTop: 8 }}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Pulse CSS ── */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────
//  Inline styles (no extra CSS file needed)
// ────────────────────────────────────────────
const styles = {
  wrapper: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    maxWidth: 420,
    margin: '16px 0',
  },
  floatingWrapper: {
    position: 'fixed',
    right: 24,
    bottom: 96,
    width: 220,
    maxWidth: 'calc(100vw - 32px)',
    margin: 0,
    zIndex: 2147483000,
  },
  triggerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    border: 'none',
    borderRadius: 14,
    color: '#fff',
    fontSize: 14,
    lineHeight: 1.4,
    boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    width: '100%',
  },
  floatingTriggerBtn: {
    minHeight: 56,
    borderRadius: 999,
    padding: '10px 16px',
    justifyContent: 'flex-start',
    boxShadow: '0 10px 30px rgba(29,78,216,0.38)',
  },
  floatingLabel: {
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  micIcon: { fontSize: 28 },
  card: {
    background: '#fff',
    border: '1.5px solid #dbeafe',
    borderRadius: 18,
    padding: '16px 18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  floatingCard: {
    width: 360,
    maxWidth: 'calc(100vw - 32px)',
    transform: 'translateX(calc(220px - 360px))',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
  },
  closeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#9ca3af',
  },
  progressBar: {
    height: 6,
    background: '#e5e7eb',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  stepLabel: {
    margin: 0,
    fontSize: 12,
    color: '#6b7280',
  },
  statusPill: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 99,
    border: '1.5px solid',
    fontSize: 13,
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  pulseWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
    alignSelf: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#dc2626',
    opacity: 0.3,
    animation: 'pulse-ring 1.2s ease-out infinite',
  },
  pulseDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#dc2626',
    animation: 'pulse-dot 1.2s ease-in-out infinite',
    zIndex: 1,
  },
  transcriptBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '8px 12px',
  },
  logBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 200,
    overflowY: 'auto',
    padding: '4px 0',
  },
  logEntry: {
    padding: '8px 12px',
    maxWidth: '85%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  collectedBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  collectedRow: {
    display: 'flex',
    gap: 8,
    fontSize: 12,
  },
  collectedKey: {
    color: '#6b7280',
    minWidth: 80,
    fontWeight: 600,
  },
  collectedVal: {
    color: '#111827',
  },
  resetBtn: {
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: 13,
    alignSelf: 'flex-start',
  },
};
