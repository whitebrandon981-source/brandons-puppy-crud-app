import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import { createRemoteJWKSet, jwtVerify } from 'jose';

dotenv.config();

// ---- JWT Setup ----
const JWKS_URI = process.env.JWKS_URI;
const ISSUER = process.env.JWT_ISSUER;

let JWKS;
if (JWKS_URI) {
  JWKS = createRemoteJWKSet(new URL(JWKS_URI));
}

// middleware to verify Asgardeo JWT
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
    });

    // attach user id from the token sub claim
    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

// ---- Database Setup ----
const DB_SCHEMA = process.env.DB_SCHEMA || 'app';
const useSsl = process.env.PGSSLMODE === 'require';

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
    define: { schema: DB_SCHEMA },
    logging: false,
  }
);

// ---- Puppies Model ----
const Puppies = sequelize.define(
  'puppies',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    breed: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    age_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'puppies',
    timestamps: false,
  }
);

// ---- Routes ----

// health check
app.get('/', (req, res) => {
  res.json({ message: 'Puppy API is running!' });
});

// GET all puppies (for the authenticated user)
app.get('/api/puppies', authenticateJWT, async (req, res) => {
  try {
    const puppies = await Puppies.findAll({
      where: { user_id: req.userId },
    });
    res.json(puppies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve puppies' });
  }
});

// GET single puppy by id
app.get('/api/puppies/:id', authenticateJWT, async (req, res) => {
  try {
    const puppy = await Puppies.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }
    res.json(puppy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve puppy' });
  }
});

// POST create a new puppy
app.post('/api/puppies', authenticateJWT, async (req, res) => {
  try {
    const { name, breed, age_months } = req.body;

    if (!name || !breed || age_months === undefined) {
      return res.status(400).json({ error: 'name, breed, and age_months are required' });
    }

    const newPuppy = await Puppies.create({
      name,
      breed,
      age_months,
      user_id: req.userId,
    });
    res.status(201).json(newPuppy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create puppy' });
  }
});

// PUT update a puppy by id
app.put('/api/puppies/:id', authenticateJWT, async (req, res) => {
  try {
    const puppy = await Puppies.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found or not yours' });
    }

    const { name, breed, age_months } = req.body;
    await puppy.update({ name, breed, age_months });

    res.json(puppy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update puppy' });
  }
});

// DELETE a puppy by id
app.delete('/api/puppies/:id', authenticateJWT, async (req, res) => {
  try {
    const puppy = await Puppies.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found or not yours' });
    }

    await puppy.destroy();
    res.json({ message: 'Puppy deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete puppy' });
  }
});

// ---- Start Server ----
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // create schema if it doesn't exist yet
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA}"`);

    // sync model to create/update table
    await Puppies.sync({ alter: true });
    console.log(`Puppies table synced in "${DB_SCHEMA}" schema`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
};

startServer();
