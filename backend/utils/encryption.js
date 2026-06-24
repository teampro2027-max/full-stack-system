const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
let warnedAboutMissingKey = false;
let cachedKey = null;

const warnMissingKey = () => {
    if (warnedAboutMissingKey) return;
    warnedAboutMissingKey = true;
    console.warn('Encryption Warning: ENCRYPTION_KEY is missing/invalid. Add a 64-character hex ENCRYPTION_KEY to Render. Falling back when possible.');
};

const getEncryptionKey = () => {
    if (cachedKey) return cachedKey;

    const configuredKey = process.env.ENCRYPTION_KEY;
    if (configuredKey && /^[a-f0-9]{64}$/i.test(configuredKey)) {
        cachedKey = Buffer.from(configuredKey, 'hex');
        return cachedKey;
    }

    warnMissingKey();

    if (process.env.JWT_SECRET) {
        cachedKey = crypto.createHash('sha256').update(process.env.JWT_SECRET).digest();
        return cachedKey;
    }

    return null;
};

const encrypt = (text) => {
    if (!text) return text;

    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) return text;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    let encrypted = cipher.update(text.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text) => {
    if (!text || !text.includes(':')) return text;

    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) return text;

    try {
        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Failed to decrypt field:', error.message);
        return text;
    }
};

module.exports = { encrypt, decrypt };
