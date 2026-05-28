import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Structure of stored puzzles in database
interface StoredPuzzle {
  puzzleId: string;
  difficulty: string;
  board: string;
  solution: string;
  createdAt: string;
}

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'puzzles.json');

// In-memory cache for ultra-fast solution retrievals
const puzzleCache: Record<string, StoredPuzzle> = {};

// Validation helpers
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const PUZZLE_ID_RE = /^[EMHX]\d{4}$/;

function validatePuzzle(p: any): string | null {
  if (!p || typeof p !== 'object') return 'Invalid puzzle object.';
  if (typeof p.puzzleId !== 'string' || !PUZZLE_ID_RE.test(p.puzzleId)) {
    return 'Invalid puzzleId format (expected e.g. E1234).';
  }
  if (!VALID_DIFFICULTIES.includes(p.difficulty)) {
    return 'Invalid difficulty (expected easy|medium|hard|expert).';
  }
  if (typeof p.board !== 'string' || p.board.length !== 81 || /[^0-9]/.test(p.board)) {
    return 'Invalid board (expected 81 digits 0-9).';
  }
  if (typeof p.solution !== 'string' || p.solution.length !== 81 || /[^0-9]/.test(p.solution)) {
    return 'Invalid solution (expected 81 digits 0-9).';
  }
  return null;
}

// MongoDB Mongoose Schema
const PuzzleSchema = new mongoose.Schema({
  puzzleId: { type: String, required: true, unique: true, index: true },
  difficulty: { type: String, required: true },
  board: { type: String, required: true },
  solution: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PuzzleModel = mongoose.model('Puzzle', PuzzleSchema);

let useMongoDB = false;

// Initialize database (MongoDB with local file storage fallback)
async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log('[Database] MONGODB_URI environment variable detected. Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      useMongoDB = true;
      console.log('[Database] Connected to MongoDB successfully. Using MongoDB as primary database system.');
    } catch (err) {
      console.error('[Database] Failed to connect to MongoDB. Falling back to local file-based database.', err);
    }
  } else {
    console.log('[Database] No MONGODB_URI found. Defaulting to local file-based database (data/puzzles.json).');
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
      const puzzles: Record<string, StoredPuzzle> = JSON.parse(dataStr);
      Object.assign(puzzleCache, puzzles);
      console.log(`[Database] Loaded ${Object.keys(puzzles).length} puzzles into memory cache as local fallback.`);
    } catch (err) {
      // File doesn't exist or is corrupted, initialize empty
      await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
      console.log('[Database] Initialized new local puzzles fallback database file.');
    }
  } catch (err) {
    console.error('[Database] Failed to initialize local storage path:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  // Rate limiters
  const bulkLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many write requests. Try again later.' },
  });
  const lookupLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many lookup requests. Try again later.' },
  });

  // Initialize DB before handling requests
  await initDatabase();

  // API Route: Register a newly generated puzzle
  app.post('/api/puzzles', bulkLimiter, async (req, res) => {
    try {
      const error = validatePuzzle(req.body);
      if (error) {
         res.status(400).json({ error });
         return;
      }

      const { puzzleId, difficulty, board, solution } = req.body;

      const newPuzzle: StoredPuzzle = {
        puzzleId,
        difficulty,
        board,
        solution,
        createdAt: new Date().toISOString()
      };

      if (useMongoDB) {
        await PuzzleModel.findOneAndUpdate(
          { puzzleId },
          { puzzleId, difficulty, board, solution, createdAt: new Date() },
          { upsert: true, new: true }
        );
        console.log(`[Database] Standard puzzle saved to MongoDB: #${puzzleId}`);
      } else {
        // Store in memory & local file
        puzzleCache[puzzleId] = newPuzzle;
        await fs.writeFile(DATA_FILE, JSON.stringify(puzzleCache, null, 2), 'utf-8');
        console.log(`[Database] Standard puzzle saved locally: #${puzzleId}`);
      }

      res.status(201).json({ success: true, puzzle: newPuzzle });
    } catch (error) {
       console.error('[API] Error saving puzzle:', error);
       res.status(500).json({ error: 'Failed to write puzzle registry.' });
    }
  });

  // API Route: Save multiple puzzles in bulk
  app.post('/api/puzzles/bulk', bulkLimiter, async (req, res) => {
    try {
      const { puzzles } = req.body; // Array of StoredPuzzle
      if (!puzzles || !Array.isArray(puzzles)) {
         res.status(400).json({ error: 'Required puzzles array missing.' });
         return;
      }

      if (puzzles.length > 50) {
         res.status(400).json({ error: 'Bulk write limited to 50 puzzles per request.' });
         return;
      }

      for (const p of puzzles) {
        const err = validatePuzzle(p);
        if (err) {
          res.status(400).json({ error: err });
          return;
        }
      }

      if (useMongoDB) {
        const bulkOperations = puzzles
          .filter(p => p.puzzleId && p.difficulty && p.board && p.solution)
          .map(p => ({
            updateOne: {
              filter: { puzzleId: p.puzzleId },
              update: {
                puzzleId: p.puzzleId,
                difficulty: p.difficulty,
                board: p.board,
                solution: p.solution,
                createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
              },
              upsert: true
            }
          }));
        if (bulkOperations.length > 0) {
          await PuzzleModel.bulkWrite(bulkOperations);
        }
        console.log(`[Database] Bulk saved ${puzzles.length} puzzles directly to MongoDB.`);
      } else {
        for (const p of puzzles) {
          if (p.puzzleId && p.difficulty && p.board && p.solution) {
            puzzleCache[p.puzzleId] = {
              puzzleId: p.puzzleId,
              difficulty: p.difficulty,
              board: p.board,
              solution: p.solution,
              createdAt: p.createdAt || new Date().toISOString()
            };
          }
        }
        // Persist all in one local file write
        await fs.writeFile(DATA_FILE, JSON.stringify(puzzleCache, null, 2), 'utf-8');
        console.log(`[Database] Bulk saved ${puzzles.length} puzzles locally.`);
      }

      res.status(201).json({ success: true, count: puzzles.length });
    } catch (err) {
      console.error('[API] Bulk write failed:', err);
      res.status(500).json({ error: 'Failed to execute bulk puzzle writes.' });
    }
  });

  // API Route: Lookup a solution by puzzleId
  app.get('/api/puzzles/:id', lookupLimiter, async (req, res) => {
    try {
      const id = req.params.id.toUpperCase().trim();
      let puzzle = null;

      if (useMongoDB) {
        const mongoPuzzle = await PuzzleModel.findOne({ puzzleId: id });
        if (mongoPuzzle) {
          puzzle = {
            puzzleId: mongoPuzzle.puzzleId,
            difficulty: mongoPuzzle.difficulty,
            board: mongoPuzzle.board,
            solution: mongoPuzzle.solution,
            createdAt: mongoPuzzle.createdAt.toISOString()
          };
        }
      }

      // If not using MongoDB or not found in MongoDB, search from cache
      if (!puzzle) {
        puzzle = puzzleCache[id];
      }

      if (!puzzle) {
         res.status(404).json({ error: 'Puzzle registry not found.' });
         return;
      }

      res.json(puzzle);
    } catch (error) {
      console.error('[API] Error looking up puzzle:', error);
      res.status(500).json({ error: 'Failed to find puzzle solution.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Core Service running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close().catch(() => {});
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  mongoose.connection.close().catch(() => {});
  process.exit(0);
});
