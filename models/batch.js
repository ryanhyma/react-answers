import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  status: { type: String, required: false },
  batchId: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  aiProvider: { type: String, required: true },
  pageLanguage: { type: String, required: true },
  referringUrl: { type: String, required: false },
  interactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interaction'
  }]
},{
  timestamps: true, versionKey: false,
  id: false,
});;


export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
