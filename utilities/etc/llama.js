require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');
const llamaPath = path.join('mnt', 'c', path.relative('C:\\', __dirname), 'llama.sh');
const handleData = (data, streamType) => {
    if (process.env.debug === "true")
    console.log(`${streamType}: ${data}`);
};


function WSL_llama() {

    const ollamaInst = spawn('wsl', ['-e', 'sh', `/${llamaPath.replace(/\\/g, '/')}`]);


    ollamaInst.stdout.on('data', (data) => handleData(data, 'stdout'));
    ollamaInst.stderr.on('data', (data) => handleData(data, 'stderr'));
    
    ollamaInst.on('error', (err) => {
        if (process.env.debug === "true")
    
        console.error(`OLLAMA STARTSH Failed to start process: ${err.message}`);
    });
    
    ollamaInst.on('close', (code) => {
        if (process.env.debug === "true")
    
        console.log(`OLLAMA STARTSH exited with code ${code}`);
    });
}

function llama() {

    const ollamaInst = spawn('ollama', ['serve']);


    ollamaInst.stdout.on('data', (data) => handleData(data, 'stdout'));
    ollamaInst.stderr.on('data', (data) => handleData(data, 'stderr'));
    
    ollamaInst.on('error', (err) => {
        if (process.env.debug === "true")
    
        console.error(`OLLAMA STARTSH Failed to start process: ${err.message}`);
    });
    
    ollamaInst.on('close', (code) => {
        if (process.env.debug === "true")
    
        console.log(`OLLAMA STARTSH exited with code ${code}`);
    });
}

module.exports.init = llama;

