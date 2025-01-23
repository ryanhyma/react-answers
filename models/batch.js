import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  status: { type: String, required: false },
  batchId: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  provider: { type: String, required: true },
  language: { type: String, required: true },
  interactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interaction'
  }]
}, { timestamps: true });


export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
