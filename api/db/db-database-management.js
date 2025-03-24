import dbConnect from './db-connect.js';
import { authMiddleware, adminMiddleware, withProtection } from '../../middleware/auth.js';
import mongoose from 'mongoose';

async function databaseManagementHandler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const connection = await dbConnect();
    
    // Get all registered models from Mongoose
    const collections = Object.keys(mongoose.models).reduce((acc, modelName) => {
      acc[modelName.toLowerCase()] = mongoose.models[modelName];
      return acc;
    }, {});

    if (req.method === 'GET') {
      // Export database
      const backup = {};
      
      for (const [name, model] of Object.entries(collections)) {
        backup[name] = await model.find({}).lean();
      }

      res.setHeader('Content-Disposition', `attachment; filename=database-backup-${new Date().toISOString()}.json`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(backup);

    } else if (req.method === 'POST') {
      // Import database
      if (!req.files || !req.files.backup) {
        return res.status(400).json({ message: 'No backup file provided' });
      }

      let backup;
      try {
        backup = JSON.parse(req.files.backup.data.toString());
      } catch (error) {
        return res.status(400).json({ message: 'Invalid backup file format' });
      }

      const session = await connection.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Clear existing data
          await Promise.all(Object.values(collections).map(model => 
            model.deleteMany({}, { session })
          ));

          // Import new data
          for (const [name, data] of Object.entries(backup)) {
            const model = collections[name.toLowerCase()];
            if (Array.isArray(data) && data.length > 0 && model) {
              await model.insertMany(data, { session });
            }
          }
        });

        await session.endSession();
        return res.status(200).json({ message: 'Database restored successfully' });
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        throw error;
      }
    }
  } catch (error) {
    console.error('Database management error:', error);
    return res.status(500).json({ 
      message: 'Database operation failed', 
      error: error.message 
    });
  }
}

export default function handler(req, res) {
  return withProtection(databaseManagementHandler, authMiddleware, adminMiddleware)(req, res);
}