console.log('🔥 TERMINAL SECURE v4');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM chargé');

    // HASH SHA-256
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 🔥 TON HASH EXACT
    const PASSWORD_HASH = 'd8894d6842a31c162c2d0f14ece07bb286d32b5a2f4825c6c8d4f2c1a0ad3166';
    const USERNAME = 'aokiji';
    const API_KEY = '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';
    const API_URL = 'https://api.perplexity.ai/chat/completions';
    let currentModel = 'sonar-pro';

    // Éléments
    const connectBtn = document.getElementById('connect-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loginSection = document.getElementById('login-section');
    const chatSection = document.getElementById('chat-section');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    const status = document.getElementById('status');
    const modelInfo = document.getElementById('model-info');
    const aiSelect = document.getElementById('ai-select');
    const fileBtn = document.querySelector('.file-btn');
    const fileUpload = document.getElementById('file-upload');

    // LOGIN
    connectBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        loginError.textContent = '🔐 VÉRIFICATION...';
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const hashedPassword = await hashPassword(password);
            console.log('Hash calculé:', hashedPassword.substring(0, 16) + '...');
            
            if (username === USERNAME && hashedPassword === PASSWORD_HASH) {
                console.log('✅ LOGIN OK');
                loginSection.style.display = 'none';
                chatSection.style.display = 'flex';
                loginError.textContent = '✅ SÉCURISÉ';
                setTimeout(() => loginError.textContent = '', 1000);
                input.focus();
                status.textContent = 'ONLINE';
            } else {
                loginError.textContent = '❌ REFUSÉ';
                passwordInput.value = '';
            }
        } catch (err) {
            loginError.textContent = '❌ ERREUR';
            console.error(err);
        }
    });

    // UPLOAD
    fileBtn.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            addMessage('user', `📎 ${file.name}`);
        });
    });

    // AI SELECT
    aiSelect.addEventListener('change', (e) => {
        currentModel = e.target.value;
        modelInfo.textContent = e.target.value.toUpperCase();
    });

    // CHAT
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) sendMessage();
    });

    function sendMessage() {
        const text = input.value.trim();
        addMessage('user', text);
        input.value = '';
        status.textContent = 'ENVOI...';

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'user', content: text }],
                max_tokens: 2000,
                temperature: 0.7
            })
        }).then(res => {
            if (!res.ok) throw new Error(res.status);
            return res.json();
        }).then(data => {
            typeMessage('ai', data.choices[0].message.content);
            status.textContent = 'READY';
        }).catch(err => {
            addMessage('ai', `❌ ${err.message}`);
            status.textContent = 'ERROR';
        });
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
        const timer = setInterval(() => {
            div.textContent = text.slice(0, i++) + '_';
            if (i > text.length) {
                clearInterval(timer);
                div.classList.remove('typing');
                div.textContent = text;
            }
        }, 25);
    }

    console.log('🎉 TERMINAL PRÊT - Hash sécurisé');
});
