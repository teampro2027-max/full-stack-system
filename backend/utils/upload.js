const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|pdf)$/i;
    const allowedMimeTypes = /^(image\/(jpeg|jpg|png)|application\/pdf)$/i;
    const hasValidExtension = allowedExtensions.test(path.extname(file.originalname));
    const hasValidMimeType = allowedMimeTypes.test(file.mimetype);

    if (hasValidExtension && hasValidMimeType) {
        return cb(null, true);
    }

    return cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

module.exports = upload;