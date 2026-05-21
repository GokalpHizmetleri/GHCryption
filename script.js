// Global State Tracker
let activeInputSource = 'text'; // 'text' | 'file'
let activeMode = 'encrypt';      // 'encrypt' | 'decrypt'

const b32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Switch Input Source between Plain Text and File upload
 */
function switchInputSource(source) {
    activeInputSource = source;
    
    const textBtn = document.getElementById('src-text-btn');
    const fileBtn = document.getElementById('src-file-btn');
    const textContainer = document.getElementById('input-text-container');
    const fileContainer = document.getElementById('input-file-container');
    
    // UI Cleanup
    clearOutput();

    if (source === 'text') {
        textBtn.classList.add('active');
        fileBtn.classList.remove('active');
        textContainer.style.display = 'flex';
        fileContainer.style.display = 'none';
    } else {
        fileBtn.classList.add('active');
        textBtn.classList.remove('active');
        textContainer.style.display = 'none';
        fileContainer.style.display = 'flex';
    }
}

/**
 * Toggle Core Operations Mode (Encrypt/Decrypt)
 */
function switchMode(mode) {
    activeMode = mode;
    const encryptBtn = document.getElementById('mode-encrypt');
    const decryptBtn = document.getElementById('mode-decrypt');
    const encodeTextarea = document.getElementById('encode-text');
    
    clearOutput();

    if (mode === 'encrypt') {
        encryptBtn.classList.add('active');
        decryptBtn.classList.remove('active');
        encodeTextarea.placeholder = "Paste sensitive data here...";
    } else {
        decryptBtn.classList.add('active');
        encryptBtn.classList.remove('active');
        encodeTextarea.placeholder = "Paste the final base64 sequence here to decrypt...";
    }
}

/**
 * Handle File Selection Event
 */
function handleFileSelect() {
    const fileInput = document.getElementById('encode-file');
    const nameDisplay = document.getElementById('file-name-display');
    
    if (fileInput.files.length > 0) {
        nameDisplay.innerText = `Selected: ${fileInput.files[0].name}`;
    } else {
        nameDisplay.innerText = '';
    }
}

/**
 * Clear workstation panel fields
 */
function clearInput() {
    document.getElementById('encode-text').value = '';
    document.getElementById('encode-file').value = '';
    document.getElementById('file-name-display').innerText = '';
    clearOutput();
}

function clearOutput() {
    document.getElementById('output-text').value = '';
    document.getElementById('output-text').style.display = 'block';
    document.getElementById('file-download-area').style.display = 'none';
    document.getElementById('progress-container').style.display = 'none';
    resetCopyButton();
}

/**
 * Master controller for processing data pipelines safely
 */
function handleProcess() {
    if (activeMode === 'encrypt') {
        processEncode();
    } else {
        processDecode();
    }
}

/**
 * Core Progress Simulator Loop
 */
function simulateProgress(callback) {
    const container = document.getElementById('progress-container');
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    
    container.style.display = 'flex';
    bar.style.width = '0%';
    text.innerText = 'Processing: 0%';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 6;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            bar.style.width = '100%';
            text.innerText = 'Complete! 100%';
            setTimeout(() => {
                container.style.display = 'none';
                callback();
            }, 300);
        } else {
            bar.style.width = progress + '%';
            text.innerText = `Processing: ${progress}%`;
        }
    }, 30);
}

/* --- PIPELINE CONVERTERS --- */

function stringToBase32(str) {
    let bin = "";
    for (let i = 0; i < str.length; i++) {
        let b = str.charCodeAt(i).toString(2);
        bin += "0".repeat(8 - b.length) + b;
    }
    let b32 = "";
    while (bin.length % 5 !== 0) bin += "0";
    for (let i = 0; i < bin.length; i += 5) {
        let chunk = bin.substr(i, 5);
        b32 += b32Alphabet[parseInt(chunk, 2)];
    }
    return b32;
}

function base32ToString(b32) {
    let bin = "";
    b32 = b32.toUpperCase().replace(/=+$/, "");
    for (let i = 0; i < b32.length; i++) {
        let idx = b32Alphabet.indexOf(b32[i]);
        if (idx === -1) continue;
        let b = idx.toString(2);
        bin += "0".repeat(5 - b.length) + b;
    }
    let str = "";
    for (let i = 0; i < bin.length - (bin.length % 8); i += 8) {
        str += String.fromCharCode(parseInt(bin.substr(i, 8), 2));
    }
    return str;
}

function stringToBinary(str) {
    return str.split('').map(char => {
        let b = char.charCodeAt(0).toString(2);
        return "0".repeat(8 - b.length) + b;
    }).join(' ');
}

function binaryToString(bin) {
    return bin.split(' ').map(b => {
        if(!b.trim()) return '';
        return String.fromCharCode(parseInt(b, 2));
    }).join('');
}

function utf8_to_b64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function b64_to_utf8(str) {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function runEncodeChain(inputString) {
    let step1 = utf8_to_b64(inputString);
    let step2 = stringToBase32(step1);
    let step3 = stringToBinary(step2);
    let step4 = stringToBase32(step3);
    return btoa(step4); 
}

/**
 * Execute Encoding Layer Chain
 */
function processEncode() {
    const fileInput = document.getElementById('encode-file');
    const textInput = document.getElementById('encode-text').value;
    const outputField = document.getElementById('output-text');
    
    clearOutput();

    if (activeInputSource === 'file' && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                let base64Data = e.target.result;
                let combinedInput = file.name + "--" + base64Data;
                
                simulateProgress(() => {
                    outputField.value = runEncodeChain(combinedInput);
                });
            } catch (err) {
                alert("An error occurred while preparing file data.");
            }
        };
        reader.readAsDataURL(file);
    } else if (activeInputSource === 'text' && textInput.trim() !== "") {
        simulateProgress(() => {
            outputField.value = runEncodeChain(textInput);
        });
    } else {
        alert("Please enter text or select a file to process!");
    }
}

/**
 * Execute Decoding / Reverse Encryption Layer Chain
 */
function processDecode() {
    const encryptedInput = document.getElementById('encode-text').value.trim();
    const outputField = document.getElementById('output-text');
    const downloadArea = document.getElementById('file-download-area');
    const downloadMessage = document.getElementById('download-message');
    
    if(!encryptedInput) {
        alert("Please paste a valid encrypted code sequence!");
        return;
    }

    resetCopyButton();

    try {
        simulateProgress(() => {
            let step1_reverse = atob(encryptedInput);
            let step2_reverse = base32ToString(step1_reverse);
            let step3_reverse = binaryToString(step2_reverse);
            let step4_reverse = base32ToString(step3_reverse);
            let originalRawString = b64_to_utf8(step4_reverse);

            if (originalRawString.includes("--")) {
                let separatorIndex = originalRawString.indexOf("--");
                let fileName = originalRawString.substring(0, separatorIndex);
                let base64DataUrl = originalRawString.substring(separatorIndex + 2);

                let matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
                let blob;
                
                if (matches) {
                    let mimeString = matches[1];
                    let byteString = atob(matches[2]);
                    let ab = new ArrayBuffer(byteString.length);
                    let ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    blob = new Blob([ab], {type: mimeString});
                } else {
                    let byteString = atob(base64DataUrl);
                    let ab = new ArrayBuffer(byteString.length);
                    let ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    blob = new Blob([ab], {type: "application/octet-stream"});
                }
                
                let downloadLink = document.getElementById('download-link');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = fileName;
                
                downloadMessage.innerText = `File parsed successfully: ${fileName}`;
                outputField.style.display = 'none';
                downloadArea.style.display = 'flex';
            } else {
                outputField.style.display = 'block';
                outputField.value = originalRawString;
            }
        });

    } catch (error) {
        alert("Decoding error! The chain code structure is invalid.");
        document.getElementById('progress-container').style.display = 'none';
    }
}

/**
 * System Utility: Safe Copy Action
 */
function copyToClipboard() {
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    
    if (outputText.style.display === 'none' || !outputText.value) {
        alert("Nothing to copy yet!");
        return;
    }
    
    navigator.clipboard.writeText(outputText.value).then(() => {
        copyBtnText.innerText = "COPIED";
        copyBtn.style.color = "var(--primary)";
        setTimeout(resetCopyButton, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function resetCopyButton() {
    const copyBtn = document.getElementById('copy-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    if(copyBtn && copyBtnText) {
        copyBtnText.innerText = "COPY";
        copyBtn.style.color = "var(--on-surface-variant)";
    }
}
