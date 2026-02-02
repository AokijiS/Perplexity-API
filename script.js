console.log("🖥️ AI TERMINAL v8 - ULTRA REALISTIC CONFIG");

// Configuration PDF.js
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// === CONFIG ===
const APIKEY = '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';
const APIURL = 'https://api.perplexity.ai/chat/completions';
const PASSWORDHASH = 'd8894d6842a31c162c2d0f14ece07bb286d32b5a2f4825c6c8d4f2c1a0ad3166';
const USERNAME = 'aokiji';

// === STATE ===
let authenticated = false;
let loginStep = 0; // 0=username, 1=password
let tempUsername = '';
let commandHistory = [];
let historyIndex = -1;
let uploadedFiles = []; // Persist files
let isTyping = false;
let abortController = null;
let conversationHistory = []; // Historique de conversation

// === PERSONAS ===
const PERSONAS = {
  dev: 'Tu es un expert dev full-stack Java/iJava, Linux, Web (Node/PHP), jeux Java. Commente code précisément, corrige bugs, explique algos. Style direct, technique.',
  linux: 'Expert sysadmin Ubuntu/NAS/Docker/VPN. Aide configs SSH, scripts bash, home lab. Précis, étapes claires.',
  general: 'Assistant général polyvalent, précis et concis.',
  code: 'Spécialiste code (Java, JS, Python). Analyse fichiers, commente ligne par ligne, optimise.',
  game: 'Expert dev jeux Java (FNAF-like), algos IA, mécanique jeux.'
};
let currentPersona = PERSONAS.dev;
let currentModel = 'sonar-pro';

// === ELEMENTS ===
const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const prompt = document.getElementById('prompt');
const input = document.getElementById('input');
const fileUpload = document.getElementById('file-upload');

// === HASH PASSWORD ===
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// === WRITE LINE UTILS ===
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

// === FOCUS INPUT ===
function focusInput() {
  input.focus();
  const range = document.createRange();
  const sel = window.getSelection();
  if (input.childNodes.length === 0) {
    range.setStart(input, 0);
  } else {
    range.selectNodeContents(input);
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

// === KEYBOARD HANDLER ===
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    output.innerHTML = '';
    return;
  }
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    if (isTyping) {
      abortController?.abort();
      writeLine('⌨️ Ctrl+C', 'error');
      writeLine('AI interrupted.', 'warning');
      isTyping = false;
    }
    focusInput();
    return;
  }
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
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (authenticated && commandHistory.length > 0) {
      historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      input.textContent = commandHistory[commandHistory.length - 1 - historyIndex];
      focusInput();
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (authenticated) {
      if (historyIndex === 0) {
        historyIndex--;
        input.textContent = '';
      } else {
        historyIndex = Math.max(historyIndex - 1, -1);
        input.textContent = historyIndex >= 0
          ? commandHistory[commandHistory.length - 1 - historyIndex]
          : '';
      }
      focusInput();
    }
    return;
  }
});

// === LOGIN ===
async function handleLogin(value) {
  if (loginStep === 0) {
    writeLine(`login: ${value}`);
    tempUsername = value;
    prompt.textContent = 'password:';
    loginStep = 1;
    input.style.webkitTextSecurity = 'disc';
  } else {
    writeLine('password: ********');
    const hash = await hashPassword(value);
    if (tempUsername === USERNAME && hash === PASSWORDHASH) {
      writeLine('Authentication successful!', 'success');
      writeLine('');
      writeLine('🤖 AI Terminal v8.0 - Ready', 'system');
      writeLine('Type "help" for commands', 'system');
      authenticated = true;
      prompt.textContent = 'user@ai:~$ ';
      input.style.webkitTextSecurity = 'none';
    } else {
      writeLine('Authentication failed!', 'error');
      writeLine('');
      loginStep = 0;
      tempUsername = '';
      prompt.textContent = 'login:';
      input.style.webkitTextSecurity = 'none';
    }
    focusInput();
  }
}

// === COMMANDS ===
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
    writeLine('📋 Available commands:', 'system');
    writeLine('  help              Show this help');
    writeLine('  upload            Upload files (.java, .txt, images, pdf...)');
    writeLine('  readfile [name]   Preview file content');
    writeLine('  clear   or Ctrl+K Clear terminal');
    writeLine('  clearhistory      Clear conversation history');
    writeLine('  history           Show conversation history');
    writeLine('  exit              Logout');
    writeLine('  personas          List personalities');
    writeLine('  setpersona [name] Set IA (dev, linux, code, game, general)');
    writeLine('  models            List models');
    writeLine('  model [name]      Switch model');
    writeLine('');
    writeLine('⌨️ Shortcuts: Ctrl+K clear, Ctrl+C stop, ↑↓ history', 'system');
    writeLine('');
    return focusInput();
  }

  // Clear
  if (command === 'clear') {
    output.innerHTML = '';
    return focusInput();
  }

  // Clear history
  if (command === 'clearhistory') {
    conversationHistory = [];
    writeLine('✅ Conversation history cleared', 'success');
    return focusInput();
  }

  // Show history
  if (command === 'history') {
    if (conversationHistory.length === 0) {
      writeLine('📭 No conversation history', 'system');
    } else {
      writeLine(`📜 Conversation history (${conversationHistory.length / 2} exchanges):`, 'system');
      conversationHistory.forEach((msg, idx) => {
        const role = msg.role === 'user' ? '👤 User' : '🤖 AI';
        const preview = typeof msg.content === 'string' 
          ? msg.content.substring(0, 80) 
          : msg.content[0]?.text?.substring(0, 80) || '[file attached]';
        writeLine(`  ${idx + 1}. ${role}: ${preview}${preview.length >= 80 ? '...' : ''}`, 'system');
      });
    }
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
    conversationHistory = []; // Reset l'historique
    prompt.textContent = 'login:';
    return focusInput();
  }

  // Upload
  if (command === 'upload') {
    fileUpload.click();
    fileUpload.onchange = async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const base64 = await fileToBase64(file);
        
        // Pour les PDFs, extraire le texte
        let extractedText = null;
        if (file.type === 'application/pdf') {
          writeLine(`📄 Extracting text from ${file.name}...`, 'system');
          extractedText = await extractPDFText(file);
          if (extractedText) {
            writeLine(`✅ Extracted ${extractedText.length} characters`, 'success');
          } else {
            writeLine(`⚠️ Could not extract text, will send as file`, 'warning');
          }
        }
        
        uploadedFiles.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64,
          extractedText // Texte extrait pour les PDFs
        });
        writeLine(`${file.name} (${(file.size / 1024).toFixed(1)}KB) loaded`, 'file');
      }
      writeLine('📁 Files ready. Ask: "analyse ce code", "commente ce Java", etc.', 'system');
      writeLine('');
      e.target.value = '';
      focusInput();
    };
    return;
  }

  // Readfile
  if (command.startsWith('readfile ')) {
    const fileName = command.split(' ').slice(1).join(' ');
    const file = uploadedFiles.find(f =>
      f.name.toLowerCase().includes(fileName.toLowerCase())
    );
    if (file) {
      getFileTextContent(file.base64).then(content => {
        writeLine(`📄 ${file.name} (preview):`, 'file');
        const preview = content.substring(0, 800);
        writeCodeBlock(preview, file.name); // affichage dans un bloc code
      }).catch(() => writeLine('❌ Cannot read file', 'error'));
    } else {
      writeLine(`❌ No file "${fileName}"`, 'error');
    }
    return focusInput();
  }

  // Personas
  if (command === 'personas') {
    writeLine('🧠 Personas:', 'system');
    Object.entries(PERSONAS).forEach(([key, desc]) => {
      const active = currentPersona === PERSONAS[key] ? ' (active)' : '';
      writeLine(`  ${key.padEnd(10)} ${active}`, 'system');
    });
    writeLine('→ setpersona dev', 'system');
    return focusInput();
  }

  if (command.startsWith('setpersona ')) {
    const name = command.split(' ')[1];
    if (PERSONAS[name]) {
      currentPersona = PERSONAS[name];
      writeLine(`✅ Persona: ${name}`, 'success');
    } else {
      writeLine('❌ Unknown. See "personas"', 'error');
    }
    return focusInput();
  }

  // Models
  if (command === 'models') {
    const models = [
      'sonar-pro',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-small-32k-online',
      'llama-3.1-sonar-small-128k-online',
      'llama-3.2-sonar-small-128k-online',
      'llama-3.2-sonar-large-128k-online'
    ];
    writeLine('🤖 Models:', 'system');
    models.forEach(m => {
      const active = m === currentModel ? ' (active)' : '';
      writeLine(`  ${m}${active}`, 'system');
    });
    writeLine('→ model sonar-pro', 'system');
    return focusInput();
  }

  if (command.startsWith('model ')) {
    const name = command.split(' ')[1];
    const valid = [
      'sonar-pro',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-small-32k-online',
      'llama-3.1-sonar-small-128k-online',
      'llama-3.2-sonar-small-128k-online',
      'llama-3.2-sonar-large-128k-online'
    ];
    if (valid.includes(name)) {
      currentModel = name;
      writeLine(`✅ Model: ${name}`, 'success');
    } else {
      writeLine('❌ Unknown. See "models"', 'error');
    }
    return focusInput();
  }

  // Ask AI
  await askAI(command);
}

// === FILE TO BASE64 ===
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// === EXTRACT TEXT FROM PDF ===
async function extractPDFText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}

// === EXTRAIT TEXTE DE BASE64 (pour preview seulement) ===
function getFileTextContent(base64Data) {
  return new Promise((resolve, reject) => {
    try {
      const byteCharacters = atob(base64Data.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'text/plain;charset=utf-8' });

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Cannot read as text'));
      reader.readAsText(blob);
    } catch (e) {
      reject(e);
    }
  });
}

// === ASK AI (avec fichiers en attachments API) ===
async function askAI(question) {
  writeLine("🤖 AI thinking...", "typing");
  isTyping = true;
  abortController = new AbortController();

  // Construire content user: texte + fichiers (seulement pour le premier message avec fichiers)
  const userContent = [{ type: "text", text: question }];

  // N'ajoute les fichiers QUE si c'est le premier message ou si l'historique est vide
  const shouldAttachFiles = uploadedFiles.length > 0 && conversationHistory.length === 0;
  
  if (shouldAttachFiles) {
    writeLine(
      `📎 Using ${uploadedFiles.length} file(s): ${uploadedFiles.map(f => f.name).join(', ')}`,
      "file"
    );

    for (const fileData of uploadedFiles) {
      if (fileData.size > 50 * 1024 * 1024) {
        writeLine(`❌ ${fileData.name} > 50MB, skipped`, "error");
        continue;
      }

      // Pour les PDFs avec texte extrait, envoyer le texte
      if (fileData.type === "application/pdf" && fileData.extractedText) {
        userContent[0].text += `\n\n📄 **Contenu du fichier ${fileData.name}:**\n${fileData.extractedText}`;
      }
      // Pour images: type image_url
      else if (fileData.type.startsWith("image/")) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: fileData.base64
          }
        });
      }
      // Pour autres fichiers texte
      else if (fileData.type.startsWith("text/")) {
        try {
          const text = await getFileTextContent(fileData.base64);
          userContent[0].text += `\n\n📄 **Contenu du fichier ${fileData.name}:**\n${text}`;
        } catch (e) {
          writeLine(`⚠️ Could not read ${fileData.name}`, 'warning');
        }
      }
    }
  }

  // Construire les messages avec l'historique
  const messages = [
    { role: "system", content: currentPersona },
    ...conversationHistory,
    { role: "user", content: userContent }
  ];

  try {
    const response = await fetch(APIURL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${APIKEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: currentModel,
        messages,
        max_tokens: 4000,
        temperature: 0.7
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // FIX: L'API retourne data.choices[0].message.content
    const content = data.choices[0].message.content;
    let aiResponseText = "";
    
    if (typeof content === "string") {
      aiResponseText = content;
      await renderAIResponse(content);
    } else if (Array.isArray(content)) {
      const fullText = content
        .filter(part => part.type === "output_text" || part.type === "text")
        .map(part => part.text)
        .join("\n");
      aiResponseText = fullText;
      await renderAIResponse(fullText);
    } else {
      aiResponseText = String(content);
      await renderAIResponse(String(content));
    }

    // Ajouter à l'historique (seulement le texte, pas les fichiers pour les messages suivants)
    conversationHistory.push(
      { role: "user", content: question },
      { role: "assistant", content: aiResponseText }
    );

    // Limiter l'historique aux 20 derniers messages (10 échanges)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      writeLine("Request aborted.", "warning");
    } else {
      writeLine(`❌ Error: ${err.message}`, "error");
    }
  } finally {
    isTyping = false;
    focusInput();
  }
}

// === RENDER AI RESPONSE AVEC BLOC CODE COPIABLE ===
async function renderAIResponse(text) {
  // Découpe par blocs de code markdown ```lang ... ```
  const parts = splitTextAndCode(text);
  for (const part of parts) {
    if (part.type === 'code') {
      writeCodeBlock(part.content, part.language);
    } else {
      await typeText(part.content);
    }
  }
}

// Détecte les blocs ```lang\n...\n``` dans le texte
function splitTextAndCode(text) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index).trim()
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2].trim()
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex).trim()
    });
  }

  return parts.filter(p => p.content);
}

// Affiche un bloc code avec bouton "Copier" et coloration syntaxique
function writeCodeBlock(code, label = 'code') {
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';

  const header = document.createElement('div');
  header.className = 'code-block-header';

  const title = document.createElement('span');
  title.textContent = label;

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copier';
  copyBtn.className = 'code-copy-btn';

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = 'Copié !';
      setTimeout(() => (copyBtn.textContent = 'Copier'), 1500);
    } catch (e) {
      copyBtn.textContent = 'Erreur';
      setTimeout(() => (copyBtn.textContent = 'Copier'), 1500);
    }
  });

  header.appendChild(title);
  header.appendChild(copyBtn);

  const pre = document.createElement('pre');
  const codeEl = document.createElement('code');
  
  // Applique la coloration syntaxique
  codeEl.innerHTML = highlightCode(code, label);
  
  pre.appendChild(codeEl);

  wrapper.appendChild(header);
  wrapper.appendChild(pre);

  output.appendChild(wrapper);
  scrollToBottom();
}

// === COLORATION SYNTAXIQUE ===
function highlightCode(code, language) {
  language = language.toLowerCase();
  
  // Échappe le HTML pour éviter les injections
  code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // JavaScript / TypeScript
  if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
    return highlightJavaScript(code);
  }
  // Java
  else if (language === 'java') {
    return highlightJava(code);
  }
  // Python
  else if (language === 'python' || language === 'py') {
    return highlightPython(code);
  }
  // HTML
  else if (language === 'html' || language === 'xml') {
    return highlightHTML(code);
  }
  // CSS
  else if (language === 'css') {
    return highlightCSS(code);
  }
  // JSON
  else if (language === 'json') {
    return highlightJSON(code);
  }
  // Bash / Shell
  else if (language === 'bash' || language === 'sh' || language === 'shell') {
    return highlightBash(code);
  }
  
  // Par défaut, retourne le code sans coloration
  return code;
}

function highlightJavaScript(code) {
  const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|async|await|class|extends|import|export|from|default|new|this|super|static|get|set|typeof|instanceof|delete|void|yield|in|of|null|undefined|true|false)\b/g;
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const functions = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;
  
  code = code.replace(comments, '<span class="comment">$1</span>');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(keywords, '<span class="keyword">$1</span>');
  code = code.replace(functions, '<span class="function">$1</span>');
  code = code.replace(numbers, '<span class="number">$1</span>');
  
  return code;
}

function highlightJava(code) {
  const keywords = /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|void|int|long|double|float|boolean|char|byte|short|String|this|super|null|true|false|import|package|enum|synchronized|volatile|transient|native|strictfp|assert)\b/g;
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b(\d+\.?\d*[LlFfDd]?)\b/g;
  const annotations = /(@[A-Z][a-zA-Z0-9_]*)/g;
  const functions = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  
  code = code.replace(comments, '<span class="comment">$1</span>');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(annotations, '<span class="annotation">$1</span>');
  code = code.replace(keywords, '<span class="keyword">$1</span>');
  code = code.replace(functions, '<span class="function">$1</span>');
  code = code.replace(numbers, '<span class="number">$1</span>');
  
  return code;
}

function highlightPython(code) {
  const keywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|global|nonlocal|assert|del|and|or|not|is|in|None|True|False|self)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|f"(?:[^"\\]|\\.)*"|f'(?:[^'\\]|\\.)*')/g;
  const comments = /(#.*$)/gm;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const decorators = /(@[a-zA-Z_][a-zA-Z0-9_]*)/g;
  const functions = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  
  code = code.replace(comments, '<span class="comment">$1</span>');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(decorators, '<span class="annotation">$1</span>');
  code = code.replace(keywords, '<span class="keyword">$1</span>');
  code = code.replace(functions, '<span class="function">$1</span>');
  code = code.replace(numbers, '<span class="number">$1</span>');
  
  return code;
}

function highlightHTML(code) {
  const tags = /(&lt;\/?[a-zA-Z][a-zA-Z0-9-]*)/g;
  const attributes = /\b([a-zA-Z-]+)(?==)/g;
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /(&lt;!--[\s\S]*?--&gt;)/g;
  
  code = code.replace(comments, '<span class="comment">$1</span>');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(tags, '<span class="tag">$1</span>');
  code = code.replace(attributes, '<span class="attribute">$1</span>');
  
  return code;
}

function highlightCSS(code) {
  const selectors = /^([.#]?[a-zA-Z][a-zA-Z0-9-_]*)/gm;
  const properties = /\b([a-z-]+)(?=\s*:)/g;
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /(\/\*[\s\S]*?\*\/)/g;
  const numbers = /\b(\d+\.?\d*(?:px|em|rem|%|vh|vw|pt)?)\b/g;
  const colors = /(#[0-9a-fA-F]{3,6})/g;
  
  code = code.replace(comments, '<span class="comment">$1</span>');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(colors, '<span class="number">$1</span>');
  code = code.replace(numbers, '<span class="number">$1</span>');
  code = code.replace(properties, '<span class="property">$1</span>');
  code = code.replace(selectors, '<span class="selector">$1</span>');
  
  return code;
}

function highlightJSON(code) {
  const keys = /("(?:[^"\\]|\\.)*")(\s*:)/g;
  const strings = /("(?:[^"\\]|\\.)*")/g;
  const numbers = /\b(-?\d+\.?\d*)\b/g;
  const booleans = /\b(true|false|null)\b/g;
  
  code = code.replace(keys, '<span class="json-key">$1</span>$2');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(booleans, '<span class="keyword">$1</span>');
  code = code.replace(numbers, '<span class="number">$1</span>');
  
  return code;
}

function highlightBash(code) {
  const keywords = /\b(if|then|else|elif|fi|case|esac|for|while|do|done|function|return|exit|export|source|alias|echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|sudo)\b/g;
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /(#.*$)/gm;
  const variables = /(\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\})/g;
  
  code = code.replace(comments, '<span class="comment">$1</span>');
  code = code.replace(strings, '<span class="string">$1</span>');
  code = code.replace(variables, '<span class="variable">$1</span>');
  code = code.replace(keywords, '<span class="keyword">$1</span>');
  
  return code;
}


// === TYPE TEXT (pour parties non code) ===
async function typeText(text) {
  if (!text) return;
  const lines = text.split('\n');
  for (const line of lines) {
    const div = document.createElement('div');
    div.className = 'line response typing';
    output.appendChild(div);
    for (let i = 0; i <= line.length; i++) {
      if (!isTyping) break;
      div.textContent = line.substring(0, i);
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

// === INIT ===
writeLine('🤖 AI Terminal v8.0', 'system');
writeLine('🔒 Secure connection established.', 'system');
writeLine('');
focusInput();
terminal.addEventListener('click', (e) => {
  if (e.target === terminal || e.target === output) focusInput();
});
console.log('✅ TERMINAL READY');