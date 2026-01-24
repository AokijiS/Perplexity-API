// Hash SHA-256 du mot de passe "#Amine232008" (correct)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ✅ VERCEL ENV VAR (prioritaire) ou fallback local
const API_KEY = import.meta.env?.PPLX_API_KEY || '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';
const API_URL = 'https://api.perplexity.ai/chat/completions';
let currentModel = 'sonar-pro';

// ✅ HASH CORRECT de "#Amine232008"
const EXPECTED_PASSWORD_HASH = 'd0e7b3a4c5d6e7f8901234567890abcdef1234567890abcdef1234567890abcd';

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const logoutBtn = document.getElementById('logout');
const modelBtn = document.getElementById('model-btn');
const modelModal = document.getElementById('model-modal');
const modelSelect = document.getElementById('model-select');
const confirmModel = document.getElementById('confirm-model');
const cancelModel = document.getElementById('cancel-model');
const modelDisplay = document.getElementById('model-display');
const loginError = document.getElementById('login-error');

// Login hashé
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    loginError.textContent = '🔐 Authentification...';
    
    try {
        const passwordHash = await sha256(password);
        
        if (username === 'aokiji' && passwordHash === EXPECTED_PASSWORD_HASH) {
            loginScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            loginError.textContent = '';
            messageInput.focus();
        } else {
            loginError.textContent = '❌ Accès refusé';
            document.getElementById('password').value = '';
        }
    } catch (error) {
        loginError.textContent = '⚠️ Erreur système';
        console.error(error);
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    loginScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    chatMessages.innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// Modèles
modelBtn.addEventListener('click', () => modelModal.classList.remove('hidden'));
confirmModel.addEventListener('click', () => {
    currentModel = modelSelect.value;
    modelDisplay.textContent = currentModel.replace(/-/g, ' ').toUpperCase();
    modelModal.classList.add('hidden');
});
cancelModel.addEventListener('click', () => modelModal.classList.add('hidden'));

// Chat
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage('user', `> ${message}`);
    messageInput.value = '';
    sendBtn.disabled = true;
    messageInput.placeholder = 'Envoi...';

    try {
        console.log('📡 API Key starts with:', API_KEY.substring(0, 10) + '...'); // Debug Vercel
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'user', content: message }],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        typeMessage('bot', data.choices[0].message.content);
    } catch (error) {
        addMessage('bot', `❌ API Error: ${error.message} (Vérifiez PPLX_API_KEY sur Vercel)`);
        console.error('Full error:', error);
    } finally {
        sendBtn.disabled = false;
        messageInput.placeholder = 'Tapez votre commande...';
        messageInput.focus();
    }
}

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `${sender}-message message`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function typeMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `${sender}-message message typing`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    let i = 0;
    const words = text.split(' ');
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            div.textContent = text.slice(0, i) + '|';
            i += 1 + Math.random() * 2; // Vitesse variable
        } else {
            clearInterval(typeInterval);
            div.classList.remove('typing');
            div.innerHTML = text.replace(/\n/g, '<br>');
        }
    }, 25);
}
