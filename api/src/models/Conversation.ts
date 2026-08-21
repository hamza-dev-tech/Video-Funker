import mongoose, { Document } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  icpId?: mongoose.Types.ObjectId | null;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
}

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    icpId: { type: mongoose.Schema.Types.ObjectId, ref: 'ICPProfile', default: null, index: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', conversationSchema);
