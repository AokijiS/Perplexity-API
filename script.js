console.log('🖥️ AI TERMINAL v8 - ULTRA REALISTIC');

// CONFIG
const API_KEY = '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';
const API_URL = 'https://api.perplexity.ai/chat/completions';
const PASSWORD_HASH = 'd8894d6842a31c162c2d0f14ece07bb286d32b5a2f4825c6c8d4f2c1a0ad3166';
const USERNAME = 'aokiji';

// STATE
let authenticated = false;
let loginStep = 0; // 0=username, 1=password
let tempUsername = '';
let commandHistory = [];
let historyIndex = -1;
let uploadedFiles = [];
let isTyping = false;
let abortController = null;

// ELEMENTS
const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const prompt = document.getElementById('prompt');
const input = document.getElementById('input');
const fileUpload = document.getElementById('file-upload');

// HASH
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// WRITE LINE
function writeLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `line ${className}`;
    line.textContent = text;
    output.appendChild(line);
    scrollToBottom();
}

function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
}

// FOCUS INPUT
function focusInput() {
    input.focus();
    // Place curseur en fin
    const range = document.createRange();
    const sel = window.getSelection();
    if (input.childNodes.length > 0) {
        range.setStart(input.childNodes[0], input.textContent.length);
    } else {
        range.setStart(input, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

// KEYBOARD HANDLER
document.addEventListener('keydown', async (e) => {
    // Ctrl+K → Clear
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        output.innerHTML = '';
        return;
    }
    
    // Ctrl+C → Stop AI
    if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (isTyping && abortController) {
            abortController.abort();
            writeLine('^C', 'error');
            writeLine('AI interrupted', 'warning');
            isTyping = false;
            focusInput();
        }
        return;
    }
    
    // Enter → Submit
    if (e.key === 'Enter') {
        e.preventDefault();
        const command = input.textContent.trim();
        input.textContent = '';
        
        if (!authenticated) {
            await handleLogin(command);
        } else {
            await handleCommand(command);
        }
        return;
    }
    
    // Arrows → History
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (authenticated && historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.textContent = commandHistory[commandHistory.length - 1 - historyIndex];
            focusInput();
        }
        return;
    }
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (authenticated) {
            if (historyIndex > 0) {
                historyIndex--;
                input.textContent = commandHistory[commandHistory.length - 1 - historyIndex];
            } else {
                historyIndex = -1;
                input.textContent = '';
            }
            focusInput();
        }
        return;
    }
});

// LOGIN
async function handleLogin(value) {
    if (loginStep === 0) {
        writeLine(`login> ${value}`);
        tempUsername = value;
        prompt.textContent = 'password> ';
        loginStep = 1;
        // Masquer input en mode password
        input.style.webkitTextSecurity = 'disc';
    } else {
        writeLine('password> ********');
        const hash = await hashPassword(value);
        
        if (tempUsername === USERNAME && hash === PASSWORD_HASH) {
            writeLine('✓ Authentication successful', 'success');
            writeLine('');
            writeLine('AI Terminal v8.0 - Ready', 'system');
            writeLine('Type "help" for commands', 'system');
            writeLine('');
            authenticated = true;
            prompt.textContent = 'user@ai:~$ ';
            input.style.webkitTextSecurity = 'none';
        } else {
            writeLine('✗ Authentication failed', 'error');
            writeLine('');
            loginStep = 0;
            tempUsername = '';
            prompt.textContent = 'login> ';
            input.style.webkitTextSecurity = 'none';
        }
    }
    focusInput();
}

// COMMANDS
async function handleCommand(command) {
    if (command) {
        writeLine(`user@ai:~$ ${command}`);
        commandHistory.push(command);
        historyIndex = -1;
    } else {
        return focusInput();
    }
    
    // Help
    if (command === 'help') {
        writeLine('');
        writeLine('Available commands:', 'system');
        writeLine('  help         Show this help');
        writeLine('  upload       Upload files/images for AI analysis');
        writeLine('  clear        Clear terminal (or Ctrl+K)');
        writeLine('  exit         Logout');
        writeLine('  [question]   Ask anything to AI');
        writeLine('');
        writeLine('Keyboard shortcuts:', 'system');
        writeLine('  Ctrl+K       Clear screen');
        writeLine('  Ctrl+C       Stop AI response');
        writeLine('  ↑/↓          Command history');
        writeLine('');
        return focusInput();
    }
    
    // Clear
    if (command === 'clear') {
        output.innerHTML = '';
        return focusInput();
    }
    
    // Exit
    if (command === 'exit') {
        writeLine('Logging out...', 'warning');
        writeLine('');
        authenticated = false;
        loginStep = 0;
        tempUsername = '';
        uploadedFiles = [];
        prompt.textContent = 'login> ';
        return focusInput();
    }
    
    // Upload
    if (command === 'upload') {
        fileUpload.click();
        fileUpload.onchange = async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                const base64 = await fileToBase64(file);
                uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    base64: base64
                });
                writeLine(`✓ ${file.name} (${(file.size/1024).toFixed(1)}KB) loaded`, 'file');
            }
            writeLine('Files ready. Ask your question.', 'system');
            writeLine('');
            focusInput();
        };
        return;
    }
    
    // Ask AI
    await askAI(command);
}

// FILE TO BASE64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ASK AI
async function askAI(question) {
    writeLine('');
    isTyping = true;
    abortController = new AbortController();
    
    const content = [{ type: 'text', text: question }];
    
    // Add uploaded files
    if (uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                content.push({
                    type: 'image_url',
                    image_url: { url: file.base64 }
                });
            }
        });
        uploadedFiles = [];
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [{ role: 'user', content: content }],
                max_tokens: 4000,
                temperature: 0.7
            }),
            signal: abortController.signal
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        await typeText(data.choices[0].message.content);
        
    } catch (err) {
        if (err.name === 'AbortError') {
            writeLine('Request aborted', 'warning');
        } else {
            writeLine(`✗ Error: ${err.message}`, 'error');
        }
    } finally {
        isTyping = false;
        writeLine('');
        focusInput();
    }
}

// TYPE TEXT
async function typeText(text) {
    const lines = text.split('\n');
    for (const line of lines) {
        const div = document.createElement('div');
        div.className = 'line response typing';
        output.appendChild(div);
        
        for (let i = 0; i < line.length; i++) {
            if (!isTyping) break;
            div.textContent += line[i];
            scrollToBottom();
            await sleep(15);
        }
        
        div.classList.remove('typing');
        if (!isTyping) break;
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// INIT
writeLine('AI Terminal v8.0', 'system');
writeLine('Secure connection established', 'system');
writeLine('');
focusInput();

// Click anywhere → focus
terminal.addEventListener('click', (e) => {
    if (e.target === terminal || e.target === output) {
        focusInput();
    }
});

console.log('✅ TERMINAL READY');
