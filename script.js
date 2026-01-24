console.log('🖥️ AI TERMINAL v6 - FIX');

document.addEventListener('DOMContentLoaded', async () => {
    // API KEY Vercel
    const urlParams = new URLSearchParams(window.location.search);
    const API_KEY = urlParams.get('key') || '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';
    console.log('🔑 API:', API_KEY.substring(0, 10) + '...');

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

    // ✅ ÉLÉMENTS AVEC VÉRIFICATION
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

    if (!loginBtn) {
        console.error('❌ Bouton login-btn NON TROUVÉ');
        return;
    }
    console.log('✅ Tous éléments OK');

    loginBtn.onclick = async (e) => {
        e.preventDefault();
        loginMsg.textContent = '🔐 CHECK...';
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        try {
            const hash = await hashPassword(password);
            console.log('Hash:', hash.substring(0, 16) + '...');
            
            if (username === USERNAME && hash === PASSWORD_HASH) {
                console.log('✅ LOGIN');
                loginScreen.classList.add('hidden');
                chatScreen.classList.remove('hidden');
                loginMsg.textContent = '✅ OK';
                setTimeout(() => loginMsg.textContent = '', 1000);
                status.textContent = 'ONLINE';
                input.focus();
            } else {
                loginMsg.textContent = '❌ NO';
                passwordInput.value = '';
            }
        } catch (e) {
            loginMsg.textContent = '❌ ERR';
        }
    };

    input.onkeypress = (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const q = input.value.trim();
            addMessage('user', `user@ai:~$ ${q}`);
            input.value = '';
            status.textContent = 'WAIT...';

            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: q }],
                    max_tokens: 3000
                })
            })
            .then(r => r.json())
            .then(d => typeMessage('ai', d.choices[0].message.content))
            .catch(err => addMessage('ai', `ERR: ${err}`))
            .finally(() => status.textContent = 'READY');
        }
    };

    function addMessage(t, txt) {
        const d = document.createElement('div');
        d.className = `${t}-message message`;
        d.textContent = txt;
        messages.appendChild(d);
        messages.scrollTop = messages.scrollHeight;
    }

    function typeMessage(t, txt) {
        const d = document.createElement('div');
        d.className = `${t}-message message typing`;
        messages.appendChild(d);
        messages.scrollTop = messages.scrollHeight;
        let i = 0;
        const tmr = setInterval(() => {
            d.textContent = txt.slice(0, i++) + '█';
            if (i > txt.length) {
                clearInterval(tmr);
                d.classList.remove('typing');
                d.textContent = txt;
            }
        }, 25);
    }

    console.log('✅ TERMINAL READY');
});
