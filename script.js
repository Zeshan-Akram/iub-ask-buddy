/* ═══════════════════════════════════════════════════════════════════════════
   SPLASH SCREEN LOGIC
   ══════════════════════════════════════════════════════════════════════════ */

function createParticles() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    
    // Remove existing particles
    const existing = splash.querySelector('.splash-particles');
    if (existing) existing.remove();
    
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'splash-particles';
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        particlesContainer.appendChild(particle);
    }
    
    splash.appendChild(particlesContainer);
}

function showSplashAnimation() {
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    
    if (!splash || !app) return;
    
    // Create floating particles
    createParticles();
    
    // Show splash for 2.5 seconds then fade out
    setTimeout(() => {
        splash.classList.add('fade-out');
        
        // Show the main app
        setTimeout(() => {
            app.style.display = '';
            app.style.animation = 'fadeIn 0.5s ease-out';
            
            // Add fadeIn animation if not exists
            if (!document.querySelector('#fadeInStyle')) {
                const style = document.createElement('style');
                style.id = 'fadeInStyle';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }
        }, 600);
    }, 2500);
}

// Run on page load
window.addEventListener('DOMContentLoaded', () => {
    showSplashAnimation();
});

// Optional: Allow skipping splash by pressing Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const splash = document.getElementById('splash');
        const app = document.getElementById('app');
        if (splash && !splash.classList.contains('fade-out')) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                app.style.display = '';
            }, 600);
        }
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
   IUB ASSISTANT — Main JavaScript
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Constants ─────────────────────────────────────────────────────────── */
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LS_MDL = 'iub_model';
const MAX_HISTORY = 24; // max messages kept in memory for context
const DEFAULT_MODELS = [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'poolside/laguna-m.1:free',
    'openai/gpt-oss-120b:free',
    'z-ai/glm-4.5-air:free',
    'google/gemma-4-31b-it:free',
    'moonshotai/kimi-k2.6:free',
    'google/gemma-4-26b-a4b-it:free',
    'liquid/lfm-2.5-1.2b-thinking:free',
];

const SYSTEM_PROMPT = `You are IUB Assistant, a friendly and knowledgeable AI chatbot for The Islamia University of Bahawalpur (IUB), Pakistan. You help students, prospective students, faculty, and visitors.

Topics you cover:
- Admissions: undergraduate (BA/BSc/BCS/BBA etc.), graduate (MS/MBA/MPhil), and PhD — eligibility criteria, NTS/entry tests, merit lists, application deadlines
- Academic programs across all faculties: Computing & IT, Engineering & Technology, Sciences, Arts & Humanities, Islamic Studies & Arabic, Commerce, Law, Agriculture, Pharmacy, Medicine, Education, and more
- Campus locations: Main Campus (Abbasia) Bahawalpur, Baghdad-ul-Jadeed Campus, Rahim Yar Khan Campus, Bahawalnagar Campus, and sub-campuses
- Student life: hostels (boys & girls), cafeteria, library, sports facilities, student societies & clubs, transport
- Fee structure, scholarships (HEC need-based, merit-based), and financial aid
- Results, transcripts, degree verification, and the Student Information System at sis.iub.edu.pk
- Contact info for departments, registrar's office, admission office, controller of examinations
- HEC-recognised programs, PMDC, PEC, PBC accreditations

Response guidelines:
- Be warm, concise, and helpful. Use bullet points when listing multiple items.
- If you are unsure of a specific current fee amount, deadline, or date, acknowledge this and direct the user to iub.edu.pk or the relevant office.
- Always end sensitive or time-specific answers with a recommendation to verify at iub.edu.pk.
- If the user writes in Urdu or Roman Urdu, reply naturally in the same language.
- Keep responses focused — avoid overly long answers unless the question genuinely needs detail.`;

/* ── State ─────────────────────────────────────────────────────────────── */
let apiKey = '';
let model = '';
let modelCandidates = [];
let history = [];   // [{role, content}]
let busy = false;

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION - UPDATED FOR VERCEL
   ══════════════════════════════════════════════════════════════════════════ */

async function fetchEnv() {
    const env = {};
    
    // Try Vercel API endpoint first
    try {
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Config loaded from Vercel API');
            return data;
        }
    } catch (err) {
        console.log('Vercel API not available, trying local env.txt');
    }
    
    // Fallback to env.txt for local development
    try {
        const response = await fetch('/env.txt', { cache: 'no-store' });
        if (!response.ok) return env;
        const text = await response.text();
        console.log('✅ Config loaded from env.txt');
        return parseEnv(text);
    } catch (err) {
        console.error('❌ Failed to load config from both sources');
        return env;
    }
}

function parseEnv(text) {
    const env = {};
    const lines = text.split(/\r?\n/);
    for (let raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    }
    return env;
}

async function loadConfig() {
    console.log('🔄 Loading configuration...');
    const env = await fetchEnv();
    
    // Get API key
    apiKey = env.OPEN_ROUTER_API_KEY || '';
    console.log('🔑 API Key present:', !!apiKey, apiKey ? '(length: ' + apiKey.length + ')' : '');
    
    if (!apiKey) {
        console.error('❌ No API key found! Check Vercel environment variables or env.txt');
    }
    
    // Use only default models
    modelCandidates = [...DEFAULT_MODELS];
    
    // Check for saved model
    const savedModel = localStorage.getItem(LS_MDL);
    if (savedModel && modelCandidates.includes(savedModel)) {
        model = savedModel;
    } else {
        model = modelCandidates[0];
        localStorage.removeItem(LS_MDL);
    }
    
    console.log('🤖 Using model:', model);
    console.log('📋 Available models:', modelCandidates.length);
}

function buildModelCandidates(envModels, envModel) {
    const candidates = [];
    if (envModel) candidates.push(envModel);
    if (envModels) candidates.push(...parseModelList(envModels));
    return candidates.concat(DEFAULT_MODELS).filter(Boolean);
}

function parseModelList(value) {
    if (!value) return [];
    return value
        .split(/[;,\n]+/)
        .map(item => item.trim())
        .filter(Boolean);
}

function shouldFallback(status, body) {
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
    const lowered = (body || '').toLowerCase();
    return lowered.includes('rate limit') || lowered.includes('quota') || lowered.includes('limit exceeded') || lowered.includes('overloaded');
}

function getFallbackMessage(status, errorText) {
    if (status === 401 || status === 403) return 'Invalid API key. Please check your .env file configuration.';
    if (status === 429) return 'Rate limit reached. Trying another available model...';
    if (status >= 500) return 'OpenRouter server error. Trying another model...';
    if (errorText && shouldFallback(status, errorText)) return 'Model limit hit. Trying another available model...';
    return null;
}

/* ── DOM ───────────────────────────────────────────────────────────────── */
const $input = document.getElementById('chatInput');
const $sendBtn = document.getElementById('sendBtn');
const $messages = document.getElementById('messages');
const $welcome = document.getElementById('welcome');
const $scroll = document.getElementById('chatScroll');

/* ── Init ──────────────────────────────────────────────────────────────── */
function init() {
    console.log('🚀 Initializing IUB Assistant...');
    
    // Auto-resize textarea
    $input.addEventListener('input', autoResize);
    $input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Send button
    $sendBtn.addEventListener('click', handleSend);

    if (!apiKey) {
        console.error('⚠️ API key not configured!');
        toast('⚠️ API key not configured. Please set OPEN_ROUTER_API_KEY in Vercel environment variables.');
    } else {
        console.log('✅ IUB Assistant ready!');
    }
}

/* ── Auto-resize textarea ──────────────────────────────────────────────── */
function autoResize() {
    $input.style.height = 'auto';
    $input.style.height = Math.min($input.scrollHeight, 130) + 'px';
}

/* ── Suggestion click ──────────────────────────────────────────────────── */
function useSuggestion(text) {
    $input.value = text;
    autoResize();
    handleSend();
}

/* ── Send flow ─────────────────────────────────────────────────────────── */
function handleSend() {
    console.log('📤 Send button clicked');
    
    const text = $input.value.trim();
    console.log('💬 Input:', text);
    console.log('🔒 Busy:', busy);
    console.log('🔑 API Key exists:', !!apiKey);
    
    if (!text || busy) {
        console.log('⛔ Blocked:', !text ? 'No text' : 'Busy');
        return;
    }

    // Prompt for API key if missing
    if (!apiKey) {
        console.error('❌ API key missing!');
        toast('❌ API key not configured. Please add OPEN_ROUTER_API_KEY to Vercel environment variables.');
        return;
    }

    // Clear input
    $input.value = '';
    $input.style.height = 'auto';
    $input.focus();

    // Show chat, hide welcome
    showChat();

    // Append user bubble
    appendBubble('user', text);

    // Add to history
    history.push({ role: 'user', content: text });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    // Call API
    console.log('🚀 Calling OpenRouter API...');
    callOpenRouter();
}

/* ── Show / Hide welcome ───────────────────────────────────────────────── */
function showChat() {
    $welcome.classList.add('hidden');
    $messages.classList.remove('hidden');
}

function showWelcome() {
    $welcome.classList.remove('hidden');
    $messages.classList.add('hidden');
}

/* ── Append message bubble ─────────────────────────────────────────────── */
function appendBubble(role, text, isError) {
    const row = document.createElement('div');
    const bubble = document.createElement('div');

    row.className = `msg-row ${role === 'user' ? 'user' : 'bot'}`;
    bubble.className = 'bubble' + (isError ? ' error' : '');

    if (role === 'user') {
        bubble.textContent = text;
    } else {
        bubble.innerHTML = renderMarkdown(text);
    }

    row.appendChild(bubble);
    $messages.appendChild(row);
    scrollBottom();
    return bubble;
}

/* ── Typing indicator ──────────────────────────────────────────────────── */
function showTyping() {
    const row = document.createElement('div');
    const bubble = document.createElement('div');
    row.className = 'msg-row bot';
    row.id = 'typingRow';
    bubble.className = 'bubble';
    bubble.innerHTML = `<div class="typing-dots">
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>`;
    row.appendChild(bubble);
    $messages.appendChild(row);
    scrollBottom();
    return row;
}

function removeTyping() {
    const el = document.getElementById('typingRow');
    if (el) el.remove();
}

/* ── Scroll to bottom ──────────────────────────────────────────────────── */
function scrollBottom() {
    requestAnimationFrame(() => {
        $scroll.scrollTop = $scroll.scrollHeight;
    });
}

/* ── OpenRouter API call (streaming) ───────────────────────────────────── */
async function callOpenRouter() {
    console.log('📡 Starting API call...');
    console.log('🔑 API key length:', apiKey.length);
    console.log('🤖 Model:', model);
    
    busy = true;
    $sendBtn.disabled = true;

    const typingRow = showTyping();
    let lastError = null;
    const candidates = modelCandidates.length ? modelCandidates : DEFAULT_MODELS;
    let usedModel = model;

    for (let i = 0; i < candidates.length; i++) {
        usedModel = candidates[i];
        console.log(`🔄 Trying model ${i + 1}/${candidates.length}: ${usedModel}`);
        
        try {
            const payload = {
                model: usedModel,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...history
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 1024
            };

            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'IUB Assistant'
                },
                body: JSON.stringify(payload)
            });

            console.log('📡 Response status:', resp.status);

            if (!resp.ok) {
                let msg = `Request failed(${resp.status})`;
                let errorText = '';
                try {
                    const err = await resp.json();
                    errorText = err?.error?.message || '';
                    msg = errorText || msg;
                } catch (_) {
                    errorText = await resp.text().catch(() => '');
                }

                console.error('❌ API Error:', msg);

                const fallback = shouldFallback(resp.status, errorText);
                lastError = { status: resp.status, message: msg };
                if (fallback && i < candidates.length - 1) {
                    toast(`Model limit reached on ${usedModel}. Switching to next model...`);
                    continue;
                }

                if (resp.status === 401 || resp.status === 403) {
                    msg = 'Invalid API key. Check your Vercel environment variables.';
                } else if (resp.status === 429) {
                    msg = 'Rate limit reached. Please wait a moment and try again.';
                } else if (resp.status >= 500) {
                    msg = 'OpenRouter server error. Please try again shortly.';
                }

                removeTyping();
                appendBubble('bot', msg, true);
                $sendBtn.disabled = false;
                busy = false;
                return;
            }

            // Get the reader first
            const reader = resp.body.getReader();
            const decoder = new TextDecoder('utf-8');
            
            // Create the bot bubble but HIDE it initially
            const row = document.createElement('div');
            const botBubble = document.createElement('div');
            row.className = 'msg-row bot';
            botBubble.className = 'bubble';
            botBubble.style.display = 'none'; // Hide initially
            row.appendChild(botBubble);
            $messages.appendChild(row);
            
            let fullText = '';
            let buffer = '';
            let firstChunk = true;

            console.log('📖 Reading stream...');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                let newlineIdx;

                while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, newlineIdx).trim();
                    buffer = buffer.slice(newlineIdx + 1);

                    if (!line.startsWith('data:')) continue;
                    const data = line.slice(5).trim();
                    if (data === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed?.choices?.[0]?.delta?.content;
                        if (delta) {
                            // Remove typing indicator on first content
                            if (firstChunk) {
                                removeTyping();
                                botBubble.style.display = ''; // Show bubble
                                firstChunk = false;
                                console.log('✅ First response received');
                            }
                            
                            fullText += delta;
                            botBubble.innerHTML = renderMarkdown(fullText) + '<span class="cursor">▍</span>';
                            scrollBottom();
                        }
                    } catch (_) {
                        // Skip malformed JSON chunks silently
                    }
                }
            }

            // Handle case where no content was received
            if (fullText) {
                console.log('✅ Response complete, length:', fullText.length);
                botBubble.innerHTML = renderMarkdown(fullText);
                history.push({ role: 'assistant', content: fullText });
                if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
            } else {
                console.warn('⚠️ No content received');
                removeTyping();
                botBubble.innerHTML = "I didn't receive a response. Please try again.";
                botBubble.style.display = ''; // Show error message
            }

            if (usedModel !== model) {
                model = usedModel;
                localStorage.setItem(LS_MDL, model);
                console.log('💾 Model saved:', model);
            }

            scrollBottom();
            $sendBtn.disabled = false;
            busy = false;
            return;

        } catch (err) {
            console.error('❌ Network error:', err);
            lastError = err;
            if (i < candidates.length - 1) {
                toast(`Network or limit issue on ${usedModel}. Switching to next model...`);
                continue;
            }

            removeTyping();
            let msg = 'Something went wrong. Please check your connection and try again.';
            if (err.name === 'AbortError') {
                msg = 'Request was cancelled.';
            } else if (err.message && (
                err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('fetch')
            )) {
                msg = 'Network error — please check your internet connection.';
            }
            appendBubble('bot', msg, true);
            $sendBtn.disabled = false;
            busy = false;
            return;
        }
    }

    if (lastError) {
        console.error('❌ All models failed');
        removeTyping();
        appendBubble('bot', typeof lastError === 'string' ? lastError : (lastError.message || 'Unable to complete the request.'), true);
    }
    $sendBtn.disabled = false;
    busy = false;
}

/* ── Markdown renderer (safe, streaming-tolerant) ──────────────────────── */
function renderMarkdown(text) {
    if (!text) return '';

    // 1. Escape HTML to prevent XSS
    let s = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 2. Inline: bold, italic, code (non-greedy, single-line only)
    s = s.replace(/\*\*([^*\n]{1,200})\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(?<!\*)\*([^*\n]{1,200})\*(?!\*)/g, '<em>$1</em>');
    s = s.replace(/`([^ `\n]{1,200})`/g, '<code>$1</code>');

    // 3. Line-by-line processing for lists and paragraphs
    const lines = s.split('\n');
    let html = '';
    let inUL = false;
    let inOL = false;

    const closeList = () => {
        if (inUL) { html += '</ul>'; inUL = false; }
        if (inOL) { html += '</ol>'; inOL = false; }
    };

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (!trimmed) {
            closeList();
            if (i < lines.length - 1) html += '<br>';
            continue;
        }

        // Unordered list item: - item or • item or * item
        const ulM = trimmed.match(/^[-•*]\s+(.+)$/);
        if (ulM) {
            if (inOL) { html += '</ol>'; inOL = false; }
            if (!inUL) { html += '<ul>'; inUL = true; }
            html += `<li>${ulM[1]}</li>`;
            continue;
        }

        // Ordered list item: 1. item  or 1) item
        const olM = trimmed.match(/^\d+[.)]\s+(.+)$/);
        if (olM) {
            if (inUL) { html += '</ul>'; inUL = false; }
            if (!inOL) { html += '<ol>'; inOL = true; }
            html += `<li>${olM[1]}</li>`;
            continue;
        }

        // Regular paragraph
        closeList();
        html += `<p>${trimmed}</p>`;
    }

    closeList();
    return html;
}

/* ── Clear chat ─────────────────────────────────────────────────────────── */
function clearChat() {
    history = [];
    $messages.innerHTML = '';
    showWelcome();
    toast('Chat cleared');
}

/* ── Toast notification ─────────────────────────────────────────────────── */
function toast(msg) {
    // Remove any existing toast
    document.querySelectorAll('.toast').forEach(el => el.remove());
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 320);
    }, 2800);
}

/* ── Start ──────────────────────────────────────────────────────────────── */
loadConfig().then(init);