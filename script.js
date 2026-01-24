// Fonction hash SHA-256
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const API_URL = 'https://api.perplexity.ai/chat/completions';
let currentModel = 'sonar-pro';

// 🔥 MODE DEBUG : Affiche le hash ET teste sans hash temporairement
const DEBUG_MODE = true;
const USERNAME = 'aokiji';
const PASSWORD = '#Amine232008'; // Sera hashé à l'exécution

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

// Login DEBUG
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    loginError.textContent = '🔐 Calcul hash...';
    
    try {
        const passwordHash = await sha256(password);
        console.log('🔑 DEBUG - Ton hash calculé:', passwordHash); // ← REGARDE ÇA DANS CONSOLE F12 !
        
        // 🔥 MODE DEBUG : Accepte TOUS les mots de passe + bon username (supprime ligne 47 après)
        if (DEBUG_MODE || (username === USERNAME && passwordHash === await sha256(PASSWORD))) {
            loginScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            loginError.textContent = '✅ Connexion OK !';
            setTimeout(() => loginError.textContent = '', 2000);
            messageInput.focus();
        } else {
            loginError.textContent = `❌ KO - Username: ${username === USERNAME ? 'OK' : 'NO'} | Hash attendu: ${await sha256(PASSWORD)} | Ton hash: ${passwordHash}`;
            document.getElementById('password').value = '';
        }
    } catch (error) {
        loginError.textContent = '❌ Erreur hash';
        console.error('Hash error:', error);
    }
});

// Le reste du code (identique)...
logoutBtn.addEventListener('click', () => {
    loginScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    chatMessages.innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

modelBtn.addEventListener('click', () => modelModal.classList.remove('hidden'));
confirmModel.addEventListener('click', () => {
    currentModel = modelSelect.value;
    modelDisplay.textContent = currentModel.replace(/-/g, ' ').toUpperCase();
    modelModal.classList.add('hidden');
});
cancelModel.addEventListener('click', () => modelModal.classList.add('hidden'));

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    messageInput.value = '';
    sendBtn.disabled = true;
    messageInput.placeholder = 'Transmission...';

    try {
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

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const botReply = data.choices[0].message.content;
        typeMessage('bot', botReply);
    } catch (error) {
        addMessage('bot', `❌ Erreur: ${error.message}`);
        console.error('API Error:', error);
    } finally {
        sendBtn.disabled = false;
        messageInput.placeholder = 'Tapez votre commande...';
        messageInput.focus();
    }
}

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `${sender}-message message`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function typeMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `${sender}-message message typing`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    let i = 0;
    const typeInterval = setInterval(() => {
        div.textContent = text.slice(0, i) + '|';
        i++;
        if (i > text.length) {
            clearInterval(typeInterval);
            div.classList.remove('typing');
            div.textContent = text;
        }
    }, 20);
}
