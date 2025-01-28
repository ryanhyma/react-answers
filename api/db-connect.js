import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
// Does this need to called each time??
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      //useNewUrlParser: true,
      //useUnifiedTopology: true,
      bufferCommands: false,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 120000,        
      connectTimeoutMS: 60000,        
    
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;