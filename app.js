import { SUPABASE_URL, SUPABASE_ANON_KEY, CAREERS_EMAIL } from "./supabase-config.js";

// ─── Runtime guards ────────────────────────────────────────────────────────────
if (!window.supabase?.createClient) {
  throw new Error(
    "Supabase JS SDK not loaded. Ensure <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script> is included before app.js."
  );
}
function looksUnconfigured(v) {
  return !v || /YOUR_PROJECT_REF|YOUR_SUPABASE_ANON_KEY/i.test(String(v));
}
if (looksUnconfigured(SUPABASE_URL) || looksUnconfigured(SUPABASE_ANON_KEY)) {
  const msg = "Supabase is not configured yet. Please update supabase-config.js with your SUPABASE_URL and SUPABASE_ANON_KEY.";
  console.error(msg);
  alert(msg);
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  role: "Marketing Specialist – Content & Performance",
  mode: "video",
  aiVoiceEnabled: true,
  aiVoiceRate: 1.50,
  aiVoicePitch: 1.0,
  followupsPerQuestion: 1,
  preferredMimeTypes: [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ],
};

// ─── STAR Question Bank ────────────────────────────────────────────────────────
// Follow-ups are revealed AFTER the candidate answers the main question.
const QUESTIONS = [
  {
    id: "q1-introduction",
    text: "Tell us about a specific role or project where you were responsible for marketing, content creation, or video editing. What was the situation, and what was your role in it?",
    followups: [
      "What did that experience teach you, and how does it apply to the work you would be doing here?",
    ],
  },
  {
    id: "q2-video-editing",
    text: "Tell us about a specific video you produced — what was the goal, what tools did you use, and what actions did you take to bring it to life?",
    followups: [
      "What was the result — did the video perform well, and what would you do differently now?",
    ],
  },
  {
    id: "q3-data-analysis",
    text: "Describe a time when you used data or performance metrics to make a content decision. What was the situation, and what steps did you take to analyze and act on that data?",
    followups: [
      "What was the outcome, and how did identifying that winning hook impact the overall campaign?",
    ],
  },
  {
    id: "q4-revisions-under-pressure",
    text: "Tell us about a time you had to make multiple revisions under a tight deadline. What was the situation, and what specific actions did you take to manage it?",
    followups: [
      "Looking back, what would you do differently to handle that situation more efficiently?",
    ],
  },
  {
    id: "q5-skills-test",
    text: "Walk us through how you would approach a short design or video editing test. What steps would you take to ensure the output reflects your best work?",
    followups: [
      "Is there anything specific you would want to know about the brief before starting?",
    ],
  },
];

// ─── UI element refs ───────────────────────────────────────────────────────────
const els = {
  status: document.getElementById("statusText"),

  welcome  : document.getElementById("step-welcome"),
  speedtest: document.getElementById("step-speedtest"),
  practice : document.getElementById("step-practice"),
  interview: document.getElementById("step-interview"),
  submit   : document.getElementById("step-submit"),
  done     : document.getElementById("step-done"),

  consent : document.getElementById("consent"),
  fullName: document.getElementById("fullName"),
  email   : document.getElementById("email"),
  startBtn: document.getElementById("startBtn"),

  preview: document.getElementById("preview"),

  practiceRecordBtn  : document.getElementById("practiceRecordBtn"),
  practiceStopBtn    : document.getElementById("practiceStopBtn"),
  practiceContinueBtn: document.getElementById("practiceContinueBtn"),
  practicePlaybackWrap: document.getElementById("practicePlaybackWrap"),
  practicePlayback   : document.getElementById("practicePlayback"),
  aiTextPractice     : document.getElementById("aiTextPractice"),
  practiceQuestion   : document.getElementById("practiceQuestion"),

  qBadge   : document.getElementById("qBadge"),
  qProgress: document.getElementById("qProgress"),
  question : document.getElementById("question"),
  followup : document.getElementById("followup"),
  aiText   : document.getElementById("aiText"),
  hintText : document.getElementById("hintText"),

  recordBtn   : document.getElementById("recordBtn"),
  stopBtn     : document.getElementById("stopBtn"),
  nextBtn     : document.getElementById("nextBtn"),
  playbackWrap: document.getElementById("playbackWrap"),
  playback    : document.getElementById("playback"),
  playbackMeta: document.getElementById("playbackMeta"),

  uploadBar   : document.getElementById("uploadBar"),
  uploadStatus: document.getElementById("uploadStatus"),
};

function setStatus(text) { els.status.textContent = text; }
function showStep(stepEl) {
  for (const el of [els.welcome, els.speedtest, els.practice, els.interview, els.submit, els.done]) {
    el.classList.add("hidden");
  }
  stepEl.classList.remove("hidden");
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr, n) {
  return shuffle(arr).slice(0, Math.max(0, Math.min(n, arr.length)));
}
function safeName(s)  { return (s || "").trim().replace(/\s+/g, " ").slice(0, 120); }
function safeEmail(s) { return (s || "").trim().slice(0, 254); }
function isProbablyEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim()); }

// ─── AI voice ──────────────────────────────────────────────────────────────────
function speak(text) {
  if (!CONFIG.aiVoiceEnabled) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate  = CONFIG.aiVoiceRate;
  utter.pitch = CONFIG.aiVoicePitch;
  const voices = window.speechSynthesis.getVoices?.() || [];
  const preferred = voices.find(v => /en/i.test(v.lang)) || voices[0];
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

// ─── Media recording ───────────────────────────────────────────────────────────
function pickMimeType() {
  for (const t of CONFIG.preferredMimeTypes) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}
async function getCameraStream() {
  return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}
function hasRecordingSupport() {
  return typeof window.MediaRecorder !== "undefined";
}
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, num = bytes;
  while (num >= 1024 && i < units.length - 1) { num /= 1024; i++; }
  return `${num.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

class ClipRecorder {
  constructor(stream) {
    this.stream = stream;
    this.recorder = null;
    this.chunks = [];
    this.startedAt = null;
    this.stoppedAt = null;
    this.mimeType = pickMimeType();
  }
  start() {
    this.chunks = [];
    this.startedAt = performance.now();
    this.recorder = new MediaRecorder(this.stream, this.mimeType ? { mimeType: this.mimeType } : undefined);
    this.recorder.onerror = (e) => console.error("MediaRecorder error", e);
    this.recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) this.chunks.push(e.data); };
    this.recorder.start(200);
  }
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.recorder) return reject(new Error("Recorder not started"));
      this.recorder.onstop = () => {
        this.stoppedAt = performance.now();
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType || "video/webm" });
        const durationSeconds = Math.max(1, Math.round((this.stoppedAt - this.startedAt) / 1000));
        resolve({ blob, durationSeconds, mimeType: this.recorder.mimeType || "video/webm" });
      };
      this.recorder.stop();
    });
  }
}

// ─── Interview state ───────────────────────────────────────────────────────────
let stream            = null;
let practiceClip      = null;
let practiceRerecords = 0;
let interviewPlan     = [];
let currentIdx        = 0;
let currentClip       = null;
let mainClip          = null;   // holds the main-answer clip while in follow-up phase
let currentPhase      = "main"; // "main" | "followup"
let recordedClips     = [];
let recorder          = null;

let visibilityHiddenCount = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) visibilityHiddenCount++;
});

// ─── Speed test state ──────────────────────────────────────────────────────────
let speedTestResults = null;

// ─── Start button ──────────────────────────────────────────────────────────────
els.startBtn.addEventListener("click", async () => {
  if (!els.consent.checked) { alert("Consent is required to proceed."); return; }
  const name = safeName(els.fullName.value);
  if (!name) { alert("Please enter your full name."); return; }
  const email = safeEmail(els.email.value);
  if (email && !isProbablyEmail(email)) { alert("Please enter a valid email address (or leave it blank)."); return; }

  try {
    setStatus("Requesting camera…");
    stream = await getCameraStream();
    els.preview.srcObject = stream;
    setStatus("Camera ready");
  } catch (e) {
    console.error(e);
    setStatus("Camera blocked");
    alert("Camera/Mic permission is required for this interview.");
    return;
  }

  if (!hasRecordingSupport()) {
    setStatus("Recording unsupported");
    alert("Your browser does not support in-browser recording (MediaRecorder). Please use the latest Chrome or Edge on desktop, or the latest Chrome on Android.\n\nIf you're on iPhone/iPad, update iOS and try again, or use a desktop browser.");
    stream?.getTracks?.().forEach(t => t.stop());
    stream = null;
    return;
  }

  showStep(els.speedtest);
  speak("Before we start, we'll run a quick internet speed test to ensure a smooth interview experience.");
  runSpeedTest();
});

// ─── Speed test ────────────────────────────────────────────────────────────────
function getSpeedTestBase() {
  return SUPABASE_URL + "/functions/v1/speed-test";
}
async function measurePing() {
  const endpoints = ["https://www.google.com/generate_204", "https://www.gstatic.com/generate_204"];
  const samples = [];
  for (let i = 0; i < 8; i++) {
    const url = endpoints[i % endpoints.length] + "?_=" + (Date.now() + i);
    const t0 = performance.now();
    await fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const trimmed = samples.slice(1, -2);
  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}
async function measureDownload(pingMs = 0) {
  const base = getSpeedTestBase();
  const t0 = performance.now();
  const res = await fetch(`${base}?action=download&_=${Date.now()}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
  });
  const text = await res.text();
  const totalMs = performance.now() - t0;
  // Subtract one-way ping latency (pingMs is round-trip, so divide by 2)
  const transferMs = Math.max(totalMs - (pingMs / 2), 1);
  const size = new Blob([text]).size;
  if (!size) throw new Error("Download test failed: empty response");
  const download_mbps = parseFloat(((size * 8) / (transferMs / 1000) / 1_000_000).toFixed(2));
  return download_mbps;
}
async function measureUpload() {
  const base    = getSpeedTestBase();
  const size    = 2 * 1024 * 1024;
  const payload = new Uint8Array(size);
  crypto.getRandomValues(payload.subarray(0, 4096));
  const res = await fetch(`${base}?action=upload`, {
    method: "POST", body: payload,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/octet-stream" },
  });
  const data = await res.json();
  if (!data.ok) throw new Error("Upload test failed: " + (data.error || "unknown"));
  return data.upload_mbps;
}
function speedRating(ping, down, up) {
  if (down >= 5  && up >= 1   && ping <= 120) return { label: "Excellent", color: "#06d6c8", bg: "rgba(6,214,200,0.08)",    border: "rgba(6,214,200,0.28)"   };
  if (down >= 2  && up >= 0.5 && ping <= 250) return { label: "Good",      color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.28)"  };
  if (down >= 1  && up >= 0.3)                return { label: "Fair",      color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.30)"  };
  return                                              { label: "Poor",      color: "#f43f5e", bg: "rgba(244,63,94,0.08)",   border: "rgba(244,63,94,0.28)"   };
}
async function runSpeedTest() {
  const stBar      = document.getElementById("speedTestBar");
  const stStatus   = document.getElementById("speedTestStatus");
  const stProgress = document.getElementById("speedTestProgress");
  const stPing     = document.getElementById("stPing");
  const stDown     = document.getElementById("stDown");
  const stUp       = document.getElementById("stUp");
  const stRating   = document.getElementById("speedTestRating");
  const contBtn    = document.getElementById("speedTestContinueBtn");

  const setBar = pct => { stBar.style.width = `${pct}%`; };
  const setMsg = msg => { stStatus.textContent = msg; };

  let ping = null, down = null, up = null;

  try {
    stProgress.textContent = "Measuring ping...";
    setMsg("Measuring ping...");
    setBar(10);
    ping = await measurePing();
    stPing.textContent = ping;
  } catch (e) { console.error("Ping failed:", e?.message || e); stPing.textContent = "—"; }
  setBar(33);

  try {
    stProgress.textContent = "Measuring download speed...";
    setMsg("Measuring download speed...");
    down = await measureDownload(ping || 0);
    stDown.textContent = down;
  } catch (e) { console.error("Download failed:", e?.message || e); stDown.textContent = "—"; setMsg("Download test failed: " + (e?.message || e)); }
  setBar(66);

  try {
    stProgress.textContent = "Measuring upload speed...";
    setMsg("Measuring upload speed...");
    up = await measureUpload();
    stUp.textContent = up;
  } catch (e) { console.error("Upload failed:", e?.message || e); stUp.textContent = "—"; setMsg("Upload test failed: " + (e?.message || e)); }
  setBar(100);

  const ratingLabel = (down !== null && up !== null && ping !== null) ? speedRating(ping, down, up).label : "Partial";
  speedTestResults = { ping_ms: ping, download_mbps: down, upload_mbps: up, rating: ratingLabel };

  if (down !== null && up !== null && ping !== null) {
    const rating = speedRating(ping, down, up);
    stRating.textContent = "Connection quality: " + rating.label;
    stRating.style.cssText = `background:${rating.bg};border:1px solid ${rating.border};color:${rating.color};padding:12px 14px;border-radius:10px;font-size:14px;font-weight:700;margin-top:12px;display:block;`;
    stRating.classList.remove("hidden");
    stProgress.textContent = "Done";
    setMsg("Speed test complete.");
  } else {
    stProgress.textContent = "Partial results";
    setMsg("Some tests could not complete. Partial results saved.");
  }
  contBtn.disabled = false;
}

document.getElementById("speedTestContinueBtn").addEventListener("click", () => {
  showStep(els.practice);
  speak("Let's do a quick practice. This is not scored. Please say your name and today's date, then briefly introduce yourself as a marketing professional — your background, the tools you use, and a recent project you are proud of.");
});

// ─── Practice ──────────────────────────────────────────────────────────────────
let practiceRecorder = null;

els.practiceRecordBtn.addEventListener("click", () => {
  if (!stream) return;
  practiceRecorder = new ClipRecorder(stream);
  practiceRecorder.start();
  els.practiceRecordBtn.disabled = true;
  els.practiceStopBtn.disabled   = false;
  els.practiceContinueBtn.disabled = true;
  setStatus("Recording practice…");
});

els.practiceStopBtn.addEventListener("click", async () => {
  if (!practiceRecorder) return;
  let clip;
  try { clip = await practiceRecorder.stop(); }
  catch (e) {
    console.error(e);
    setStatus("Practice stop failed");
    alert("Recording failed. Please try again.");
    els.practiceRecordBtn.disabled = false;
    els.practiceStopBtn.disabled   = true;
    els.practiceContinueBtn.disabled = true;
    return;
  }
  practiceClip = clip;
  const url = URL.createObjectURL(clip.blob);
  els.practicePlayback.src = url;
  els.practicePlaybackWrap.classList.remove("hidden");
  els.practiceStopBtn.disabled    = true;
  els.practiceRecordBtn.disabled  = true;
  els.practiceContinueBtn.disabled = false;
  setStatus("Practice recorded");
});

els.practiceContinueBtn.addEventListener("click", () => {
  const mains = QUESTIONS;
  interviewPlan = mains.map((q, i) => ({
    index      : i,
    question   : q,
    followupText: pickRandom(q.followups, CONFIG.followupsPerQuestion)[0] || null,
  }));
  currentIdx    = 0;
  recordedClips = [];
  showStep(els.interview);
  loadQuestion();
});

// ─── Interview: load a question ────────────────────────────────────────────────
function loadQuestion() {
  const total = interviewPlan.length;
  const item  = interviewPlan[currentIdx];

  // Reset phase tracking for this question
  currentPhase = "main";
  mainClip     = null;
  currentClip  = null;

  els.qBadge.textContent    = `Question ${currentIdx + 1}`;
  els.qProgress.textContent = `${currentIdx + 1} of ${total}`;
  els.question.textContent  = item.question.text;

  // Always hide follow-up at the start — revealed after main answer is recorded
  els.followup.classList.add("hidden");

  // Reset playback
  els.playbackWrap.classList.add("hidden");
  els.playback.removeAttribute("src");
  els.playbackMeta.textContent = "";
  els.hintText.textContent     = "Recording has started. Answer clearly and professionally. Press Stop when done.";

  // Auto-start recording
  recorder = new ClipRecorder(stream);
  recorder.start();

  els.recordBtn.disabled = true;
  els.recordBtn.classList.add("hidden");
  els.stopBtn.disabled = false;
  els.nextBtn.disabled = true;

  setStatus("Recording…");

  // AI voice reads only the main question
  const voiceText = `Question ${currentIdx + 1}. ${item.question.text}`;
  els.aiText.textContent = `"${voiceText}"`;
  speak(voiceText);
}

// ─── Stop button — handles both main & follow-up phases ───────────────────────
els.stopBtn.addEventListener("click", async () => {
  if (!recorder) return;
  let clip;
  try { clip = await recorder.stop(); }
  catch (e) {
    console.error(e);
    setStatus("Stop failed");
    alert("Recording failed. Please try again.");
    els.stopBtn.disabled = true;
    els.nextBtn.disabled = true;
    return;
  }

  const item = interviewPlan[currentIdx];

  if (currentPhase === "main" && item.followupText) {
    // ── Main answer done → reveal follow-up ────────────────────────
    mainClip     = clip;
    currentPhase = "followup";

    // Show playback of main answer
    if (els.playback.src?.startsWith("blob:")) URL.revokeObjectURL(els.playback.src);
    const url = URL.createObjectURL(clip.blob);
    els.playback.src = url;
    els.playbackWrap.classList.remove("hidden");
    els.playbackMeta.textContent = `Main answer • Duration: ~${clip.durationSeconds}s • Size: ${formatBytes(clip.blob.size)}`;

    // Reveal follow-up question
    els.followup.textContent = item.followupText;
    els.followup.classList.remove("hidden");
    els.qBadge.textContent = `Question ${currentIdx + 1} – Follow-up`;
    els.hintText.textContent = "Now answer the follow-up question above. Recording will start automatically in a moment.";

    // AI speaks the follow-up
    const followVoice = "Follow-up question: " + item.followupText;
    els.aiText.textContent = `"${followVoice}"`;
    speak(followVoice);

    // Brief delay then auto-start follow-up recording
    els.stopBtn.disabled = true;
    setTimeout(() => {
      recorder = new ClipRecorder(stream);
      recorder.start();
      els.stopBtn.disabled = false;
      els.nextBtn.disabled = true;
      setStatus("Recording follow-up…");
    }, 1400);

  } else {
    // ── Follow-up done (or question had no follow-up) ───────────────
    currentClip = clip;

    if (els.playback.src?.startsWith("blob:")) URL.revokeObjectURL(els.playback.src);
    const url = URL.createObjectURL(clip.blob);
    els.playback.src = url;
    els.playbackWrap.classList.remove("hidden");
    const label = currentPhase === "followup" ? "Follow-up answer" : "Answer";
    els.playbackMeta.textContent = `${label} • Duration: ~${clip.durationSeconds}s • Size: ${formatBytes(clip.blob.size)}`;

    els.stopBtn.disabled = true;
    els.nextBtn.disabled = false;
    setStatus("Recorded");
  }
});

// ─── Next button ───────────────────────────────────────────────────────────────
els.nextBtn.addEventListener("click", () => {
  if (!currentClip) { alert("Please stop the recording before continuing."); return; }

  const item = interviewPlan[currentIdx];

  if (mainClip) {
    // Push main answer
    recordedClips.push({
      question_id      : item.question.id,
      question_text    : item.question.text,
      followup_text    : null,
      blob             : mainClip.blob,
      duration_seconds : mainClip.durationSeconds,
      mime_type        : mainClip.mimeType,
    });
    // Push follow-up answer
    recordedClips.push({
      question_id      : item.question.id + "-followup",
      question_text    : item.followupText,
      followup_text    : null,
      blob             : currentClip.blob,
      duration_seconds : currentClip.durationSeconds,
      mime_type        : currentClip.mimeType,
    });
  } else {
    // No follow-up phase
    recordedClips.push({
      question_id      : item.question.id,
      question_text    : item.question.text,
      followup_text    : item.followupText,
      blob             : currentClip.blob,
      duration_seconds : currentClip.durationSeconds,
      mime_type        : currentClip.mimeType,
    });
  }

  currentIdx++;
  if (currentIdx < interviewPlan.length) {
    loadQuestion();
  } else {
    submitInterview().catch(e => {
      console.error(e);
      alert("Submission failed. Please try again or contact support.");
      setStatus("Submission failed");
      showStep(els.interview);
    });
  }
});

// ─── Submit ────────────────────────────────────────────────────────────────────
async function submitInterview() {
  showStep(els.submit);
  setStatus("Uploading…");

  let interviewId = null;
  const candidateName  = safeName(els.fullName.value);
  const candidateEmail = safeEmail(els.email.value);
  const ua         = navigator.userAgent || "";
  const deviceHint = /Mobi|Android/i.test(ua) ? "mobile" : "desktop";

  const { data: interview, error: interviewErr } = await supabase
    .from("interviews")
    .insert({
      candidate_name        : candidateName,
      candidate_email       : candidateEmail || null,
      role                  : CONFIG.role,
      mode                  : CONFIG.mode,
      status                : "uploading",
      total_questions       : recordedClips.length,
      user_agent            : ua,
      device_hint           : deviceHint,
      visibility_hidden_count: visibilityHiddenCount,
      practice_rerecords    : practiceRerecords,
      speed_ping_ms         : speedTestResults?.ping_ms         ?? null,
      speed_download_mbps   : speedTestResults?.download_mbps   ?? null,
      speed_upload_mbps     : speedTestResults?.upload_mbps     ?? null,
      speed_rating          : speedTestResults?.rating          ?? null,
    })
    .select()
    .single();

  if (interviewErr) throw interviewErr;
  interviewId = interview.id;

  try {
    // Upload practice clip
    if (practiceClip) {
      const ext          = practiceClip.mimeType.includes("mp4") ? "mp4" : "webm";
      const practicePath = `interviews/${interviewId}/practice.${ext}`;
      els.uploadStatus.textContent = "Uploading practice recording…";

      const { error: practiceUpErr } = await supabase.storage
        .from("interviews")
        .upload(practicePath, practiceClip.blob, { contentType: practiceClip.mimeType, upsert: false });
      if (practiceUpErr) throw practiceUpErr;

      await supabase.from("interviews").update({
        practice_storage_path   : practicePath,
        practice_mime_type      : practiceClip.mimeType,
        practice_duration_seconds: practiceClip.durationSeconds,
      }).eq("id", interviewId);
    }

    // Upload each interview clip
    const totalUploads = recordedClips.length;
    let completed = 0;

    for (let i = 0; i < recordedClips.length; i++) {
      const c   = recordedClips[i];
      const ext = c.mime_type.includes("mp4") ? "mp4" : "webm";
      const path = `interviews/${interviewId}/q${String(i + 1).padStart(2, "0")}_${c.question_id}.${ext}`;

      els.uploadStatus.textContent = `Uploading ${i + 1} of ${totalUploads}…`;

      const { error: upErr } = await supabase.storage
        .from("interviews")
        .upload(path, c.blob, { contentType: c.mime_type, upsert: false });
      if (upErr) throw upErr;

      const { error: ansErr } = await supabase.from("interview_answers").insert({
        interview_id  : interviewId,
        question_index: i + 1,
        question_text : c.question_text,
        followup_text : c.followup_text,
        storage_path  : path,
        duration_seconds: c.duration_seconds,
        mime_type     : c.mime_type,
      });
      if (ansErr) throw ansErr;

      completed++;
      els.uploadBar.style.width = `${Math.round((completed / totalUploads) * 100)}%`;
    }

    // Trigger notification email
    els.uploadStatus.textContent = "Sending notification…";
    const { error: fnErr } = await supabase.functions.invoke("send-marketing-interview-email", {
      body: { interview_id: interviewId, to_email: CAREERS_EMAIL },
    });
    if (fnErr) throw fnErr;

    await supabase.from("interviews").update({ status: "submitted" }).eq("id", interviewId);

    // Clean up blob URLs to avoid range errors
    if (els.playback.src?.startsWith("blob:")) URL.revokeObjectURL(els.playback.src);
    els.playback.removeAttribute("src");
    els.playback.load();
    if (els.practicePlayback.src?.startsWith("blob:")) URL.revokeObjectURL(els.practicePlayback.src);
    els.practicePlayback.removeAttribute("src");
    els.practicePlayback.load();

    els.uploadBar.style.width = "100%";
    els.uploadStatus.textContent = "Submitted.";
    setStatus("Submitted");
    showStep(els.done);

  } catch (e) {
    try { if (interviewId) await supabase.from("interviews").update({ status: "failed" }).eq("id", interviewId); } catch {}
    throw e;
  } finally {
    try { stream?.getTracks?.().forEach(t => t.stop()); } catch {}
  }
}
