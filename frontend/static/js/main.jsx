// =================CONFIGURATION=================
// IMPORTANT: Point this to where your BACKEND Flask app is running
const BACKEND_URL = 'http://localhost:5000'; 
const FRAME_INTERVAL_MS = 30000; // Send frame every 30 seconds per request
// ===============================================

// Global state
let socket = null;
let mediaStream = null;
let frameIntervalBtn = null;
let currentSessionId = null;
let ttsVoice = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuthCheck();
    setupEventListeners();
    initTTS(); // Initialize Text-to-Speech
});

function setupEventListeners() {
    // Auth Forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Dashboard Buttons
    const startBtn = document.getElementById('startSessionBtn');
    if (startBtn) startBtn.addEventListener('click', startSessionFlow);

    const stopBtn = document.getElementById('stopSessionBtn');
    if (stopBtn) stopBtn.addEventListener('click', stopSessionFlow);

    // Navbar logout
    document.addEventListener('click', (e) => {
        if(e.target && e.target.id === 'logoutBtn') handleLogout();
    });
}


// ================= AUTHENTICATION =================

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('suUsernameInput').value;
    const password = document.getElementById('suPasswordInput').value;
    const alertBox = document.getElementById('signupAlert');

    try {
        const res = await fetch(`${BACKEND_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        alertBox.textContent = data.msg;
        alertBox.classList.remove('d-none', 'alert-danger');
        alertBox.classList.add('alert-success');

        if (res.ok) {
            setTimeout(() => window.location.href = '/', 1500);
        }
    } catch (err) {
        alertBox.textContent = "Signup failed. Ensure backend is running.";
        alertBox.classList.remove('d-none');
        alertBox.classList.add('alert-danger');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const alertBox = document.getElementById('loginAlert');

    try {
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            // Store user info for this demo session
            localStorage.setItem('socratic_user', JSON.stringify({
                user_id: data.user_Id,
                username: data.username
            }));
            window.location.href = '/dashboard';
        } else {
            alertBox.textContent = data.msg;
            alertBox.classList.remove('d-none');
        }
    } catch (err) {
        console.error(err);
        alertBox.textContent = "Login failed. Cannot connect to backend.";
        alertBox.classList.remove('d-none');
    }
}

function initAuthCheck() {
    const userStr = localStorage.getItem('socratic_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const navContainer = document.getElementById('navAuthButtons');
    
    if (user) {
        // User is logged in
        if (navContainer) {
             navContainer.innerHTML = `
                 <span class="navbar-text me-3">Hi, <span class="text-cyan">${user.username}</span></span>
                 <button id="logoutBtn" class="btn btn-sm btn-outline-secondary">Logout</button>
             `;
        }
        
        // If on dashboard, show content
        const dashAuth = document.getElementById('dashboardAuthCheck');
        if (dashAuth) {
            dashAuth.classList.remove('d-none');
            document.getElementById('welcomeMsg').textContent = `Ready to code, ${user.username}?`;
        }
    } else {
        // User not logged in
        if (navContainer) {
            // Don't show login btn on login page
            if(window.location.pathname !== '/' && window.location.pathname !== '/signup')
             navContainer.innerHTML = `<a href="/" class="btn btn-sm btn-cyan">Login</a>`;
        }

        // If on dashboard, redirect
        const redirectMsg = document.getElementById('loginRedirectMsg');
        if (redirectMsg && window.location.pathname === '/dashboard') {
             redirectMsg.classList.remove('d-none');
             setTimeout(() => window.location.href = '/', 1000);
        }
    }
}

function handleLogout() {
    localStorage.removeItem('socratic_user');
    window.location.href = '/';
}


// ================= SESSION & STREAMING =================

async function startSessionFlow() {
    const user = JSON.parse(localStorage.getItem('socratic_user'));
    if (!user) return;

    updateStatus("Initializing Session...", "warning");

    // 1. Generate a session ID locally for demo purposes
    currentSessionId = 'sess_' + Math.random().toString(36).substr(2, 9);

    try {
        // 2. Tell backend session started (via HTTP POST as per your backend code)
        const res = await fetch(`${BACKEND_URL}/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.user_id, session_id: currentSessionId })
        });
        
        if(!res.ok) throw new Error("Backend failed to initialize session");
        const data = await res.json();
        addFeedbackToLog("System", data.message, null, "neutral");

        // 3. Connect Socket.IO
        connectSocket();

        // 4. Start Screen Share Prompt
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: false
        });
        
        const videoElement = document.getElementById('screenPreview');
        videoElement.srcObject = mediaStream;
        videoElement.classList.remove('d-none');
        document.getElementById('videoPlaceholder').classList.add('d-none');

        // Handle user clicking "Stop Sharing" on browser UI
        mediaStream.getVideoTracks()[0].onended = () => stopSessionFlow();

        // UI Updates
        document.getElementById('startSessionBtn').classList.add('d-none');
        document.getElementById('stopSessionBtn').classList.remove('d-none');
        updateStatus("Live: Streaming Active", "success");

        // 5. Start sending frames periodically
        startFrameSending();

    } catch (err) {
        console.error("Session start failed:", err);
        updateStatus("Error: Could not start session or screen share cancelled.", "danger");
        currentSessionId = null;
    }
}

function stopSessionFlow() {
    // Stop stream tracks
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    // Stop frame timer
    if (frameIntervalBtn) {
        clearInterval(frameIntervalBtn);
        frameIntervalBtn = null;
    }
    // Disconnect socket
    if(socket && socket.connected) {
        socket.disconnect();
    }

    // Reset UI
    document.getElementById('screenPreview').srcObject = null;
    document.getElementById('screenPreview').classList.add('d-none');
    document.getElementById('videoPlaceholder').classList.remove('d-none');
    document.getElementById('startSessionBtn').classList.remove('d-none');
    document.getElementById('stopSessionBtn').classList.add('d-none');
    updateStatus("Offline: Session Ended", "secondary");
    
    stopTTS(); // Stop speaking if currently talking
}

function connectSocket() {
    // Connect to backend socket
    socket = io(BACKEND_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5
    });

    socket.on('connect', () => {
        console.log("Socket connected:", socket.id);
    });

    socket.on('connect_error', (err) => {
         console.error("Socket connect error:", err);
         updateStatus("Warning: Socket connection unstable", "warning");
    });

    // LISTEN FOR MENTOR FEEDBACK
    socket.on('mentor_feedback', (data) => {
        console.log("Received feedback:", data);
        addFeedbackToLog("Mentor", data.mentor_message, data.thought_process, data.vibe);
        
        // Trigger TTS if enabled
        const ttsEnabled = document.getElementById('ttsToggle').checked;
        if(ttsEnabled && data.mentor_message) {
             speakText(data.mentor_message);
        }
    });
    
    socket.on('error', (data) => {
         addFeedbackToLog("System Error", data.msg, null, "critical");
    });
}

function startFrameSending() {
    const video = document.getElementById('screenPreview');
    const canvas = document.getElementById('frameCanvas');
    const ctx = canvas.getContext('2d');
    const deepDebug = document.getElementById('deepDebugToggle').checked;

    // Send one immediately
    captureAndSendFrame(video, canvas, ctx, deepDebug);

    // Then periodically every 30s
    frameIntervalBtn = setInterval(() => {
        if (mediaStream && socket && socket.connected) {
            captureAndSendFrame(video, canvas, ctx, deepDebug);
            updateStatus("Processing Frame...", "info");
            // Revert status after a few seconds
            setTimeout(() => updateStatus("Live: Streaming Active", "success"), 3000);
        }
    }, FRAME_INTERVAL_MS);
}

function captureAndSendFrame(video, canvas, ctx, deepDebug) {
    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 JPG
    const base64Image = canvas.toDataURL('image/jpeg', 0.7); // 0.7 quality

    const payload = {
        session_id: currentSessionId,
        image: base64Image,
        settings: { deepdebug: deepDebug }
    };

    socket.emit('stream_frame', payload);
    console.log(`Sent frame for session: ${currentSessionId}`);
}


// ================= UI & TTS HELPERS =================

function updateStatus(msg, type) {
    const indicator = document.getElementById('statusIndicator');
    if(!indicator) return;
    indicator.textContent = `Status: ${msg}`;
    // Reset classes and add new bg class
    indicator.className = `badge mb-2 bg-${type}`;
}

function addFeedbackToLog(sender, message, thoughts, vibe) {
    const log = document.getElementById('feedbackLog');
    const bubble = document.createElement('div');
    bubble.className = `mentor-bubble vibe-${vibe}`;
    
    let html = `<strong>${sender}:</strong> ${message}`;
    if (thoughts) {
        html += `<div class="thought-process">🧠 Internal thought: ${thoughts}</div>`;
    }
    
    bubble.innerHTML = html;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight; // Auto scroll to bottom
}

// --- TTS (Text to Speech) ---
function initTTS() {
    if (!('speechSynthesis' in window)) {
        console.warn("TTS not supported in this browser.");
        document.getElementById('ttsToggle').disabled = true;
        return;
    }

    // Wait for voices to load (Chrome needs this)
    window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices.length);
        
        // Attempt to find a good "mature male teacher" voice.
        // Priority list: specific known good voices, then general male English.
        ttsVoice = voices.find(v => v.name === 'Microsoft David Desktop - English (United States)') ||
                   voices.find(v => v.name.includes('Google US English Male')) ||
                   voices.find(v => v.lang.includes('en') && v.name.toLowerCase().includes('male')) ||
                   voices.find(v => v.lang.includes('en')); // Fallback to any English

        if (ttsVoice) {
             console.log("Selected Voice:", ttsVoice.name);
        }
    };
}

function speakText(text) {
    if (!ttsVoice || window.speechSynthesis.speaking) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = ttsVoice;
    // Adjust pitch and rate for a more "mature teacher" sound
    utterance.pitch = 0.8; // Slightly lower pitch
    utterance.rate = 0.9;  // Slightly slower rate
    
    window.speechSynthesis.speak(utterance);
}

function stopTTS() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}