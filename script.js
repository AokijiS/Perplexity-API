console.log('✅ Script chargé !');

// API Key en dur (Vercel env var ne marche pas client-side facilement)
const API_KEY = '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';
const API_URL = 'https://api.perplexity.ai/chat/completions';
let currentModel = 'sonar-pro';

// Identifiants (EN CLAIR pour tester, hash après)
const USERNAME = 'aokiji';
const PASSWORD = '#Amine232008';

console.log('🔑 Config chargée - Username:', USERNAME);

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

console.log('✅ DOM éléments chargés');

// Login SIMPLE (sans hash)
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('🔐 Tentative de connexion...');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('Username saisi:', username);
    console.log('Password saisi:', password);
    console.log('Comparaison:', username === USERNAME, password === PASSWORD);
    
    if (username === USERNAME && password === PASSWORD) {
        console.log('✅ LOGIN OK !');
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        loginError.textContent = '';
        messageInput.focus();
    } else {
        console.log('❌ LOGIN REFUSÉ');
        loginError.textContent = '❌ Accès refusé';
        document.getElementById('password').value = '';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    console.log('🚪 Déconnexion');
    loginScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    chatMessages.innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// Modèles
modelBtn.addEventListener('click', () => {
    console.log('🤖 Ouvre sélecteur modèles');
    modelModal.classList.remove('hidden');
});
confirmModel.addEventListener('click', () => {
    currentModel = modelSelect.value;
    modelDisplay.textContent = currentModel.replace(/-/g, ' ').toUpperCase();
    modelModal.classList.add('hidden');
    console.log('🔄 Modèle changé:', currentModel);
});
cancelModel.addEventListener('click', () => modelModal.classList.add('hidden'));

// Chat
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    console.log('📤 Envoi message:', message);
    addMessage('user', message);
    messageInput.value = '';
    sendBtn.disabled = true;

    try {
        console.log('📡 Appel API Perplexity...');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'user', content: message }],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        console.log('📡 Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur API:', errorText);
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();
        console.log('✅ Réponse reçue:', data);
        typeMessage('bot', data.choices[0].message.content);
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        addMessage('bot', '❌ Erreur: ' + error.message);
    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = sender + '-message message';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function typeMessage(sender, text) {
    const div = document.createElement('div');
    div.className = sender + '-message message typing';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    let i = 0;
    const typeInterval = setInterval(() => {
        if (i <= text.length) {
            div.textContent = text.slice(0, i) + '|';
            i++;
        } else {
            clearInterval(typeInterval);
            div.classList.remove('typing');
            div.textContent = text;
        }
    }, 20);
}

console.log('✅ Script entièrement initialisé !');
