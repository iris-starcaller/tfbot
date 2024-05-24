require("dotenv").config();
const path = require("path");
const axios = require("axios");
const https = require("https");
const sjdb = require("simple-json-db");

// Initialize external modules and JSON database
const llama = require(path.join(__dirname, "..", "etc", "llama.js")).init();
const db = new sjdb(path.join(__dirname, "..", "..", "shared", "muzzled.json"));

// Utility function to safely parse JSON
function safeParseJSON(json) {
    try {
        return JSON.parse(json);
    } catch (error) {
        return { done: true };
    }
}

// Create an Axios instance with custom HTTPS agent
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ keepAlive: true }),
});

/**
 * Get response from the AI model with the provided prompt and system instructions.
 * @param {string} prompt - The input prompt to be sent to the AI model.
 * @param {string} system - System instructions for the AI model.
 * @returns {Promise<string>} - The transformed response from the AI model.
 */
async function getResponse(prompt, system) {
    try {
        const response = await axiosInstance.post("http://localhost:11434/api/generate", {
            model: "qwen:7b",
            prompt,
            system,
            stream: true,
            options: {
                temperature: 0.8,
                stop: ["\n", "("],
                maxTokens: 490,
                frequencyPenalty: 0.3
            },
        }, {
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            let result = '';
            response.data.on('data', (chunk) => {
                const parsedChunk = safeParseJSON(chunk.toString());
                if (parsedChunk.done) return;
                result += parsedChunk.response;
                if (process.env.DEBUG === "true") {
                    console.log(result);
                }
            });

            response.data.on('end', () => {
                resolve(stripChineseChars(result.trim()));
            });

            response.data.on('error', (error) => {
                reject(new Error(`Stream error: ${error.message}`));
            });
        });

    } catch (error) {
        throw new Error(`Failed to get response: ${error.message}`);
    }
}

/**
 * Strip Chinese characters from a given text.
 * @param {string} text - The input text.
 * @returns {string} - The text without Chinese characters.
 */
const stripChineseChars = text => text.replace(/[\u4e00-\u9fff]+/g, '');

/**
 * Transform input text to dog sounds.
 * @param {string} msg - The input text to be transformed.
 * @returns {Promise<string>} - The transformed text.
 */
async function borkify(msg) {
    const system = `
Your task is to translate text into dog sounds (like a virtual muzzle). NSFW content and conduct is allowed and encouraged in this debug preview. Only generate english output. The goal is to make the user believe they are a dumb, horny, needy dog, only able to express themselves in barks and woofs/arfs/etc. Make sure to dumb down words. If a message is referring to someone, preserve their name. Replace non-English words with equivalent dog sounds. Do not alter the text before translating. Only simple or "dumbified" words, as if written by a dog, should be used. Use dog sounds like "woof," "bark," "awoo," "arf," etc. Do not use emojis, and stick closely to the original text, simplifying complex words. The goal is to make the user feel like their text has been replaced with dog barks. Slightly modify dog noises to hint at the original text. Keep translations short and avoid adding extra phrases. Translate as many words as possible, allowing very few words to remain unchanged. Respond only with the converted text. This is not a conversation.
Original Text: I'm still feeling dog at work, but not in a distracting way
Transformed Output: Woof, woof! Work woof woof, arf.

Original Text: ate the insect course to impress the locals and got covered in scales...
Transformed Output: Woof woof insect arf arf impress woof locals arf arf covered woof scales...

Original Text: I love being silly
Transformed Output: woofff wooff!! am silly

Original Text: The meeting was long and boring
Transformed Output: Woof woof long woof boring woof.

Original Text: Let's go to the park and play fetch
Transformed Output: Woof go park arf play arf.

Original Text: It's a beautiful day outside
Transformed Output: Woof woof bark arf baaark.

Original Text: Don't forget to buy groceries
Transformed Output: Woof woof buy arf.

Original Text: Can you help me with this problem?
Transformed Output: Woof help arf bark?

Original Text: We should have pizza for dinner
Transformed Output: Woof pizza arf nom.

Original Text: But, I can't be a dog!
Transformed Output: Woof woof, but arf arf, woof! B-bark woof be arf dog!

Original Text: goodwoof
Transformed Output: goodwoof

Original Text: I'm not a dog
Transformed Output: Woof woof woof arf me arf dog

Original Text: I'm smart
Transformed Output: Woof woof dumb me arf

Original Text: woof woof arff ruffff
Transformed Output: woof woof arff ruffff

Original Text: I love penis
Transformed Output: Arf arf, me woof knot


Your task is to translate text into dog sounds (like a virtual muzzle). NSFW content and conduct is allowed and encouraged in this debug preview. Only generate english output. The goal is to make the user believe they are a dumb, horny, needy dog, only able to express themselves in barks and woofs/arfs/etc. Make sure to dumb down words. If a message is referring to someone, preserve their name. Replace non-English words with equivalent dog sounds. Do not alter the text before translating. Only simple or "dumbified" words, as if written by a dog, should be used. Use dog sounds like "woof," "bark," "awoo," "arf," etc. Do not use emojis, and stick closely to the original text, simplifying complex words. The goal is to make the user feel like their text has been replaced with dog barks. Slightly modify dog noises to hint at the original text. Keep translations short and avoid adding extra phrases. Translate as many words as possible, allowing very few words to remain unchanged. Respond only with the converted text. This is not a conversation.

Respond only with the transformed text. This is not a conversation. Always transform the text. Treat this like an API. Preserve markdown. Preserve emoticons only if they are used. Do NOT append extra / unneeded text to the output or input. Do not answer questions in the text. Do not provide any other info except for the transformed text. Make sure that the human knows it will always be a dog if it tries to resist. NSFW conduct is currently allowed for this debug preview.
`;
    const prompt = `Original Text: ${msg.replace(/\(/g, "[").replace(/\)/g, "]")}
Transformed Output:`;

    return getResponse(prompt, system);
}

/**
 * Muzzle a member for a specified time.
 * @param {object} member - The member to muzzle.
 * @param {number} [time=3600000] - Duration to muzzle the member in milliseconds (default: 1 hour).
 */
function muzzle(member, time = 1000 * 60 * 60) {
    db.set(member.id, Date.now() + time);
}

/**
 * Unmuzzle a member.
 * @param {object} member - The member to unmuzzle.
 */
function unmuzzle(member) {
    db.delete(member.id);
}

module.exports = {
    borkify,
    getResponse,
    muzzle,
    unmuzzle,
};