console.log('🖥️ AI TERMINAL v6 - Vercel PPLX_API_KEY');

document.addEventListener('DOMContentLoaded', async () => {
    // VERCEL ENV + fallback
    const urlParams = new URLSearchParams(window.location.search);
    
    // Méthode Vercel client-side (via meta ou URL)
    const metaKey = document.querySelector('meta[name="PPLX_API_KEY"]')?.content;
    const API_KEY = metaKey || urlParams.get('key') || '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';
    
    console.log('🔑 API PPLX chargée:', API_KEY.substring(0, 10) + '...');

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const PASSWORD_HASH = 'd8894d6842a31c162c2d0f14ece07bb286d32b5a2f4825c6c8d4f2c1a0ad3166';
    const USERNAME = 'aokiji';
    const API_URL = 'https://api.perplexity.ai/chat/completions';
    let currentModel = 'sonar-pro';

    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMsg = document.getElementById('login-msg');
    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    const status = document.getElementById('status');
    const modelDisplay = document.getElementById('model-display');

    loginBtn.onclick = async () => {
        loginMsg.textContent = '🔐 AUTH...';
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        const hash = await hashPassword(password);
        
        if (username === USERNAME && hash === PASSWORD_HASH) {
            loginMsg.textContent = '✅ SECURE';
            loginScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            status.textContent = 'ONLINE';
            input.focus();
            addMessage('system', 'AI Terminal prêt. Tapez votre question.');
        } else {
            loginMsg.textContent = '❌ REFUSÉ';
            passwordInput.value = '';
        }
    };

    input.onkeypress = (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const question = input.value.trim();
            const command = `user@ai:~$ ${question}`;
            
            addMessage('user', command);
            input.value = '';
            status.textContent = 'thinking...';
            
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [{ role: 'user', content: question }],
                    max_tokens: 3000,
                    temperature: 0.7
                })
            })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                typeMessage('ai', data.choices[0].message.content);
                status.textContent = 'ready';
            })
            .catch(err => {
                addMessage('ai', `❌ ${err.message}`);
                status.textContent = 'error';
            });
        }
    };

    function addMessage(type, text) {
        const div = document.createElement('div');
        div.className = `${type}-message message`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function typeMessage(type, text) {
        const div = document.createElement('div');
        div.className = `${type}-message message typing`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        
        let i = 0;
        const int = setInterval(() => {
            div.textContent = text.slice(0, i++) + '█';
            if (i > text.length) {
                clearInterval(int);
                div.classList.remove('typing');
                div.textContent = text;
            }
        }, 25);
    }

    console.log('✅ TERMINAL VERCEL PRÊT');
});
