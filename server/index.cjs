
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'database.sqlite');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));

// Database initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

function createTables() {
  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      spec TEXT NOT NULL
    )
  `);

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      status TEXT NOT NULL,
      items TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Create categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Initialize default categories if empty
  db.get("SELECT count(*) as count FROM categories", (err, row) => {
    if (row && row.count === 0) {
      const defaultCategories = ['水果', '蔬菜', '禽蛋', '饮品', '粮油', '其他'];
      const stmt = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
      defaultCategories.forEach(cat => {
        stmt.run(Date.now().toString() + Math.random().toString(36).substr(2, 5), cat);
      });
      stmt.finalize();
    }
  });
}

// API Routes

// --- Categories ---

app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/categories', (req, res) => {
  const { id, name } = req.body;
  const sql = `INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?)`;
  
  db.run(sql, [id, name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Category saved', id: id });
  });
});

app.delete('/api/categories/:id', (req, res) => {
  const sql = 'DELETE FROM categories WHERE id = ?';
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Category deleted', changes: this.changes });
  });
});

// --- Products ---

app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Convert relative image path to full URL if needed, 
    // but better to store relative path and let frontend handle base URL
    res.json(rows);
  });
});

app.post('/api/products', (req, res) => {
  const { id, name, price, unit, category, image, spec } = req.body;
  const sql = `INSERT OR REPLACE INTO products (id, name, price, unit, category, image, spec) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, name, price, unit, category, image, spec], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product saved', id: id });
  });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path relative to the server root
  // Frontend can access it via http://server:port/uploads/filename
  res.json({ 
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}` 
  });
});

app.delete('/api/products/:id', (req, res) => {
  // First get the image path to delete it
  db.get('SELECT image FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('Error fetching product for deletion:', err);
    }
    
    if (row && row.image && row.image.startsWith('/uploads/')) {
      const filename = row.image.replace('/uploads/', '');
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted image: ${filePath}`);
        } catch (e) {
          console.error(`Failed to delete image: ${filePath}`, e);
        }
      }
    }

    // Then delete the database record
    const sql = 'DELETE FROM products WHERE id = ?';
    db.run(sql, [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Product deleted', changes: this.changes });
    });
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- Orders ---

app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse items JSON
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items || '[]')
    }));
    res.json(orders);
  });
});

app.post('/api/orders', (req, res) => {
  const { id, clientId, status, items, totalAmount, createdAt, updatedAt } = req.body;
  const itemsJson = JSON.stringify(items);
  
  const sql = `INSERT OR REPLACE INTO orders (id, clientId, status, items, totalAmount, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
               
  db.run(sql, [id, clientId, status, itemsJson, totalAmount, createdAt, updatedAt], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Order saved', id: id });
  });
});

app.delete('/api/orders/:id', (req, res) => {
  const sql = 'DELETE FROM orders WHERE id = ?';
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Order deleted', changes: this.changes });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
