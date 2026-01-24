console.log('🖥️ AI TERMINAL v7 - FULL');

const API_KEY = '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';
const API_URL = 'https://api.perplexity.ai/chat/completions';
const PASSWORD_HASH = 'd8894d6842a31c162c2d0f14ece07bb286d32b5a2f4825c6c8d4f2c1a0ad3166';
const USERNAME = 'aokiji';

let authenticated = false;
let currentInput = '';
let commandHistory = [];
let historyIndex = -1;
let uploadedFiles = [];

const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const fileInput = document.getElementById('file-input');

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function writeLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `line ${className}`;
    line.textContent = text;
    output.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function writePrompt() {
    const line = document.createElement('div');
    line.className = 'input-line';
    
    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = authenticated ? 'user@ai:~$ ' : 'login> ';
    
    const input = document.createElement('input');
    input.id = 'input-field';
    input.type = authenticated ? 'text' : (currentInput === '' ? 'text' : 'password');
    input.autocomplete = 'off';
    input.spellcheck = false;
    
    line.appendChild(prompt);
    line.appendChild(input);
    output.appendChild(line);
    
    input.focus();
    terminal.scrollTop = terminal.scrollHeight;
    
    input.addEventListener('keydown', handleInput);
}

async function handleInput(e) {
    const input = e.target;
    
    if (e.key === 'Enter') {
        e.preventDefault();
        const command = input.value.trim();
        input.disabled = true;
        
        if (!authenticated) {
            await handleLogin(command);
        } else {
            await handleCommand(command);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        } else {
            historyIndex = -1;
            input.value = '';
        }
    }
}

async function handleLogin(input) {
    if (currentInput === '') {
        currentInput = input;
        writeLine('password: ', 'system');
        writePrompt();
    } else {
        const username = currentInput;
        const password = input;
        const hash = await hashPassword(password);
        
        if (username === USERNAME && hash === PASSWORD_HASH) {
            writeLine('✅ Authentication successful', 'system');
            writeLine('Welcome to AI Terminal. Type "help" for commands.', 'system');
            writeLine('Type "upload" to attach files/images.', 'system');
            writeLine('', '');
            authenticated = true;
        } else {
            writeLine('❌ Authentication failed', 'error');
            writeLine('', '');
        }
        currentInput = '';
        writePrompt();
    }
}

async function handleCommand(command) {
    if (command) {
        commandHistory.push(command);
        historyIndex = -1;
    }
    
    writeLine('');
    
    if (command === 'clear') {
        output.innerHTML = '';
        writePrompt();
        return;
    }
    
    if (command === 'help') {
        writeLine('Available commands:', 'system');
        writeLine('  help     - Show this help', 'system');
        writeLine('  upload   - Upload files/images', 'system');
        writeLine('  clear    - Clear screen', 'system');
        writeLine('  exit     - Logout', 'system');
        writeLine('  [text]   - Ask AI anything', 'system');
        writeLine('', '');
        writePrompt();
        return;
    }
    
    if (command === 'upload') {
        fileInput.click();
        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                const base64 = await fileToBase64(file);
                uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    base64: base64
                });
                writeLine(`📎 ${file.name} (${(file.size/1024).toFixed(1)}KB) loaded`, 'file-info');
            }
            writeLine('Files ready. Ask your question now.', 'system');
            writeLine('', '');
            writePrompt();
        };
        return;
    }
    
    if (command === 'exit') {
        writeLine('Logging out...', 'system');
        authenticated = false;
        currentInput = '';
        uploadedFiles = [];
        writeLine('', '');
        writePrompt();
        return;
    }
    
    if (command) {
        await askAI(command);
    } else {
        writePrompt();
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function askAI(question) {
    writeLine('> thinking...', 'system');
    
    const messages = [];
    const content = [];
    
    content.push({ type: 'text', text: question });
    
    // Ajouter fichiers uploadés
    if (uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                content.push({
                    type: 'image_url',
                    image_url: { url: file.base64 }
                });
            }
        });
        uploadedFiles = []; // Clear après envoi
    }
    
    messages.push({ role: 'user', content: content });
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: messages,
                max_tokens: 4000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        // Efface "thinking..."
        output.lastChild.remove();
        
        // Type réponse
        await typeResponse(reply);
        
    } catch (err) {
        output.lastChild.remove();
        writeLine(`❌ Error: ${err.message}`, 'error');
    }
    
    writeLine('', '');
    writePrompt();
}

async function typeResponse(text) {
    const lines = text.split('\n');
    for (const line of lines) {
        const div = document.createElement('div');
        div.className = 'line response';
        output.appendChild(div);
        
        for (let i = 0; i < line.length; i++) {
            div.textContent += line[i];
            terminal.scrollTop = terminal.scrollHeight;
            await new Promise(r => setTimeout(r, 15));
        }
    }
}

// Init
writeLine('AI Terminal v7.0', 'system');
writeLine('Secure connection established', 'system');
writeLine('', '');
writePrompt();

// Click anywhere to focus
terminal.addEventListener('click', () => {
    const input = document.getElementById('input-field');
    if (input) input.focus();
});

console.log('✅ TERMINAL READY');
