console.log('🚀 AI Terminal v2.0 chargé !');

const API_KEYS = {
    perplexity: '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',
    claude: 'sk-proj-ANTHROPIC_KEY_REQUIRED', // Ajoute ta clé Claude
    gpt: 'sk-openai-key-required' // Ajoute ta clé OpenAI
};

const API_URLS = {
    perplexity: 'https://api.perplexity.ai/chat/completions',
    claude: 'https://api.anthropic.com/v1/messages',
    gpt: 'https://api.openai.com/v1/chat/completions'
};

const USERNAME = 'aokiji';
const PASSWORD = '#Amine232008';
let currentAI = 'perplexity';

const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const messages = document.getElementById('messages');
const input = document.getElementById('input');
const aiSelect = document.getElementById('ai-select');
const fileUpload = document.getElementById('file-upload');
const loginError = document.getElementById('login-error');
const modelInfo = document.getElementById('model-info');
const status = document.getElementById('status');

// Login simple
document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    if (user === USERNAME && pass === PASSWORD) {
        loginSection.classList.remove('active');
        chatSection.classList.remove('hidden');
        input.focus();
    } else {
        loginError.textContent = '❌ Accès refusé';
    }
};

// Upload fichier
fileUpload.onchange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => addMessage('user', `📎 ${file.name} (${(file.size/1024).toFixed(1)}KB) chargé`);
        reader.readAsDataURL(file);
    });
};

// Switch AI
aiSelect.onchange = (e) => {
    currentAI = e.target.value;
    const names = {perplexity: 'PERPLEXITY SONAR', claude: 'CLAUDE 3.5', gpt: 'GPT-4o'};
    modelInfo.textContent = names[currentAI];
};

// Envoi
input.onkeypress = sendMessage;
document.querySelector('.file-btn').onclick = () => fileUpload.click();

async function sendMessage(e) {
    if (e.key !== 'Enter' || !input.value.trim()) return;
    
    const text = input.value.trim();
    addMessage('user', text);
    input.value = '';
    status.textContent = 'TRANSMISSION...';
    
    try {
        const response = await fetch(API_URLS[currentAI], {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEYS[currentAI]}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentAI === 'perplexity' ? 'sonar-pro' : 'gpt-4o-mini',
                messages: [{role: 'user', content: text}],
                max_tokens: 1500
            })
        });
        
        if (!response.ok) throw new Error(response.status);
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        typeMessage('ai', reply);
    } catch (error) {
        addMessage('ai', `❌ ERREUR ${currentAI.toUpperCase()}: ${error.message}`);
    } finally {
        status.textContent = 'READY';
        input.focus();
    }
}

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `${sender}-message message`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function typeMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `${sender}-message message typing`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    
    let i = 0;
    const iv = setInterval(() => {
        div.textContent = text.slice(0, i++) + '█';
        if (i > text.length) {
            clearInterval(iv);
            div.classList.remove('typing');
            div.textContent = text;
        }
    }, 25);
}
