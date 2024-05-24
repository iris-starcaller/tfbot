require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Construct the path to the llama.sh script (wsl)
const llamaPath = path.join('mnt', 'c', path.relative('C:\\', __dirname), 'llama.sh');

/**
 * Handle data output from the spawned process.
 * @param {Buffer} data - The data output.
 * @param {string} streamType - The type of stream ('stdout' or 'stderr').
 */
function handleData(data, streamType) {
    if (process.env.DEBUG === "true") {
        console.log(`${streamType}: ${data}`);
    }
}

/**
 * Initialize the Ollama process within WSL. Old method used when Ollama was not available on Windows.
 */
function WSL_llama() {
    const ollamaInst = spawn('wsl', ['-e', 'sh', `/${llamaPath.replace(/\\/g, '/')}`]);

    ollamaInst.stdout.on('data', (data) => handleData(data, 'stdout'));
    ollamaInst.stderr.on('data', (data) => handleData(data, 'stderr'));

    ollamaInst.on('error', (err) => {
        if (process.env.DEBUG === "true") {
            console.error(`OLLAMA STARTSH failed to start process: ${err.message}`);
        }
    });

    ollamaInst.on('close', (code) => {
        if (process.env.DEBUG === "true") {
            console.log(`OLLAMA STARTSH exited with code ${code}`);
        }
    });
}

/**
 * Initialize the Ollama server (assuming windows version is installed).
 */
function llama() {
    const ollamaInst = spawn('ollama', ['serve']);

    ollamaInst.stdout.on('data', (data) => handleData(data, 'stdout'));
    ollamaInst.stderr.on('data', (data) => handleData(data, 'stderr'));

    ollamaInst.on('error', (err) => {
        if (process.env.DEBUG === "true") {
            console.error(`OLLAMA STARTSH failed to start process: ${err.message}`);
        }
    });

    ollamaInst.on('close', (code) => {
        if (process.env.DEBUG === "true") {
            console.log(`OLLAMA STARTSH exited with code ${code}`);
        }
    });
}

module.exports.init = llama;
