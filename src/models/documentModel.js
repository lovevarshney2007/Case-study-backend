import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    originalFileName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded',
    },
    extractedText: {
        type: String,
        default: null, 
    },
    simplifiedSummary: {
        type: String,
        default: null,
    },
    entities: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    }
}, { timestamps: true });

export const Document = mongoose.model('Document', documentSchema);