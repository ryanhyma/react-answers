import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // This will work both locally and on Vercel
    const uri = process.env.REACT_APP_MONGODB_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default connectDB;