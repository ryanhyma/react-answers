import mongoose from 'mongoose';
import '../models/interaction.js';
import '../models/question.js';
import '../models/answer.js';
import '../models/citation.js';
import '../models/expertFeedback.js';
import '../models/context.js';
import '../models/chat.js';
import '../models/batch.js';
import '../models/tool.js';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      tls: true,
      tlsCAFile: '/app/global-bundle.pem',
      retryWrites: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      connectTimeoutMS: 30000 // 30 seconds timeout
    };

    cached.promise = mongoose.connect(process.env.DOCDB_URI, opts).then((mongoose) => {
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