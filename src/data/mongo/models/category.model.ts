import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  available: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model('Category', CategorySchema);
