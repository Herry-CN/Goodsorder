import express from 'express';
import { sql } from '@vercel/postgres';
import { put, del } from '@vercel/blob';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure Multer for memory storage (for Blob upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database initialization
async function initDB() {
  try {
    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL,
        image TEXT NOT NULL,
        spec TEXT NOT NULL
      )
    `;

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        status TEXT NOT NULL,
        items TEXT NOT NULL,
        totalAmount DOUBLE PRECISION NOT NULL,
        createdAt BIGINT NOT NULL,
        updatedAt BIGINT NOT NULL
      )
    `;

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `;

    // Initialize default categories if empty
    const { rows } = await sql`SELECT count(*) as count FROM categories`;
    if (rows[0].count === '0') {
      const defaultCategories = ['水果', '蔬菜', '禽蛋', '饮品', '粮油', '其他'];
      for (const cat of defaultCategories) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        await sql`INSERT INTO categories (id, name) VALUES (${id}, ${cat})`;
      }
    }
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Run DB init on start (careful in serverless, but okay for low traffic)
// initDB(); // Commented out to avoid cold start issues, use manual init or lazy init

// API Routes

app.get('/api/init', async (req, res) => {
  await initDB();
  res.send('Database initialization attempted. Check logs for details.');
});

// --- Categories ---

app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM categories`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { id, name } = req.body;
  try {
    await sql`INSERT INTO categories (id, name) VALUES (${id}, ${name}) ON CONFLICT (id) DO UPDATE SET name = ${name}`;
    res.json({ message: 'Category saved', id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await sql`DELETE FROM categories WHERE id = ${req.params.id}`;
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Products ---

app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM products`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { id, name, price, unit, category, image, spec } = req.body;
  try {
    await sql`
      INSERT INTO products (id, name, price, unit, category, image, spec) 
      VALUES (${id}, ${name}, ${price}, ${unit}, ${category}, ${image}, ${spec})
      ON CONFLICT (id) DO UPDATE SET 
      name=${name}, price=${price}, unit=${unit}, category=${category}, image=${image}, spec=${spec}
    `;
    res.json({ message: 'Product saved', id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
    });
    res.json({ 
      filename: req.file.originalname,
      path: blob.url 
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    res.status(500).json({ error: 'Failed to upload to blob storage' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    // First get the image path to delete it
    const { rows } = await sql`SELECT image FROM products WHERE id = ${req.params.id}`;
    const product = rows[0];

    if (product && product.image && product.image.startsWith('http')) {
      // Try to delete from blob if it's a blob url
      try {
        await del(product.image);
        console.log(`Deleted blob image: ${product.image}`);
      } catch (e) {
        console.error(`Failed to delete blob image: ${product.image}`, e);
      }
    }

    await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Orders ---

app.get('/api/orders', async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM orders`;
    // Parse items back to JSON
    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      totalAmount: parseFloat(order.totalamount), // Postgres might return string for numeric
      createdAt: parseInt(order.createdat),
      updatedAt: parseInt(order.updatedat)
    }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, clientId, status, items, totalAmount, createdAt, updatedAt } = req.body;
  const itemsJson = JSON.stringify(items);
  
  try {
    await sql`
      INSERT INTO orders (id, clientId, status, items, totalAmount, createdAt, updatedAt) 
      VALUES (${id}, ${clientId}, ${status}, ${itemsJson}, ${totalAmount}, ${createdAt}, ${updatedAt})
      ON CONFLICT (id) DO UPDATE SET 
      status=${status}, items=${itemsJson}, totalAmount=${totalAmount}, updatedAt=${updatedAt}
    `;
    res.json({ message: 'Order saved', id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For local dev, we might want to start the server
// But for Vercel, we export the app
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

export default app;