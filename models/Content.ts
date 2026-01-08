import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  type: 'blog' | 'email' | 'social';
  prompt: string;
  config?: Record<string, unknown>; // For email specific configs
  content: string; // The generated result
  imageUrl?: string; // Generated image URL (base64 or remote)
  status: 'generated' | 'approved' | 'published' | 'archived';
  createdAt: Date;
}

const ContentSchema: Schema = new Schema({
  type: { type: String, required: true, enum: ['blog', 'email', 'social'] },
  prompt: { type: String, required: true },
  config: { type: Schema.Types.Mixed },
  content: { type: String, required: true },
  imageUrl: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ['processing', 'generated', 'approved', 'published', 'archived'],
    default: 'processing'
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
