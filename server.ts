import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Initialize Database
const db = new Database(process.env.DB_PATH || "grocery.db");
db.pragma("journal_mode = WAL");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    city TEXT,
    phone TEXT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    purchase_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount REAL NOT NULL,
    total_profit REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    profit REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATE DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('DEBT', 'PAYMENT')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );
`);

// Map to store active connections: userId -> WebSocket
const clients = new Map<number, WebSocket>();

wss.on('connection', (ws: WebSocket, request: any, user: any) => {
  const userId = user.id;
  clients.set(userId, ws);
  console.log(`User ${userId} connected via WebSocket`);

  // Broadcast online status to others
  broadcastOnlineUsers();

  ws.on('message', async (data: any) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'CHAT_MESSAGE') {
        const { receiverId, content } = message;
        
        // Save to DB
        const stmt = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)");
        const info = stmt.run(userId, receiverId, content);
        const savedMsg = {
          id: info.lastInsertRowid,
          sender_id: userId,
          receiver_id: receiverId,
          content,
          created_at: new Date().toISOString()
        };

        // Send to receiver if online
        const receiverSocket = clients.get(Number(receiverId));
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
          receiverSocket.send(JSON.stringify({ type: 'NEW_MESSAGE', message: savedMsg }));
        }
        
        // Send back to sender for confirmation
        ws.send(JSON.stringify({ type: 'MESSAGE_SENT', message: savedMsg }));
      }
    } catch (err) {
      console.error('WS Message Error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`User ${userId} disconnected`);
    broadcastOnlineUsers();
  });
});

function broadcastOnlineUsers() {
  const onlineUserIds = Array.from(clients.keys());
  const payload = JSON.stringify({ type: 'ONLINE_USERS', users: onlineUserIds });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Handle Upgrade
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url!, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, user);
    });
  });
});

app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  const { full_name, city, phone, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (full_name, city, phone, username, password) VALUES (?, ?, ?, ?, ?)");
    stmt.run(full_name, city, phone, username, hashedPassword);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, full_name: user.full_name, username: user.username } });
});

// --- DASHBOARD STATS ---
app.get("/api/stats", authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const salesToday: any = db.prepare("SELECT SUM(total_amount) as total, SUM(total_profit) as profit FROM sales WHERE DATE(created_at) = DATE('now')").get();
  const expensesToday: any = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE DATE(date) = DATE('now')").get();
  const lowStock: any = db.prepare("SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold").get();
  const totalDebts: any = db.prepare("SELECT SUM(balance) as total FROM customers").get();

  res.json({
    salesToday: salesToday.total || 0,
    profitToday: salesToday.profit || 0,
    expensesToday: expensesToday.total || 0,
    lowStockCount: lowStock.count || 0,
    totalDebts: totalDebts.total || 0
  });
});

// --- PRODUCT ROUTES ---
app.get("/api/products", authenticateToken, (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

app.post("/api/products", authenticateToken, (req, res) => {
  const { name, barcode, purchase_price, selling_price, quantity, low_stock_threshold } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO products (name, barcode, purchase_price, selling_price, quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(name, barcode, purchase_price, selling_price, quantity, low_stock_threshold);
    res.status(201).json({ message: "Product added" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/products/:id", authenticateToken, (req, res) => {
  const { name, barcode, purchase_price, selling_price, quantity, low_stock_threshold } = req.body;
  const { id } = req.params;
  try {
    const stmt = db.prepare("UPDATE products SET name=?, barcode=?, purchase_price=?, selling_price=?, quantity=?, low_stock_threshold=? WHERE id=?");
    stmt.run(name, barcode, purchase_price, selling_price, quantity, low_stock_threshold, id);
    res.json({ message: "Product updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/products/:id", authenticateToken, (req, res) => {
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ message: "Product deleted" });
});

// --- POS ROUTES ---
app.post("/api/sales", authenticateToken, (req, res) => {
  const { items } = req.body; // items: [{id, quantity}]
  
  const transaction = db.transaction(() => {
    let totalAmount = 0;
    let totalProfit = 0;

    const saleStmt = db.prepare("INSERT INTO sales (total_amount, total_profit) VALUES (?, ?)");
    const { lastInsertRowid: saleId } = saleStmt.run(0, 0);

    for (const item of items) {
      const product: any = db.prepare("SELECT * FROM products WHERE id = ?").get(item.id);
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product?.name || 'unknown product'}`);
      }

      const itemTotal = product.selling_price * item.quantity;
      const itemProfit = (product.selling_price - product.purchase_price) * item.quantity;
      
      totalAmount += itemTotal;
      totalProfit += itemProfit;

      db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price, profit) VALUES (?, ?, ?, ?, ?)")
        .run(saleId, item.id, item.quantity, product.selling_price, itemProfit);

      db.prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?")
        .run(item.quantity, item.id);
    }

    db.prepare("UPDATE sales SET total_amount = ?, total_profit = ? WHERE id = ?")
      .run(totalAmount, totalProfit, saleId);

    return { saleId, totalAmount, totalProfit };
  });

  try {
    const result = transaction();
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- EXPENSE ROUTES ---
app.get("/api/expenses", authenticateToken, (req, res) => {
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY created_at DESC").all();
  res.json(expenses);
});

app.post("/api/expenses", authenticateToken, (req, res) => {
  const { title, amount, date } = req.body;
  db.prepare("INSERT INTO expenses (title, amount, date) VALUES (?, ?, ?)").run(title, amount, date || null);
  res.status(201).json({ message: "Expense added" });
});

// --- CUSTOMER & DEBT ROUTES ---
app.get("/api/customers", authenticateToken, (req, res) => {
  const customers = db.prepare("SELECT * FROM customers").all();
  res.json(customers);
});

app.post("/api/customers", authenticateToken, (req, res) => {
  const { name, phone } = req.body;
  db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(name, phone);
  res.status(201).json({ message: "Customer added" });
});

app.post("/api/debts", authenticateToken, (req, res) => {
  const { customer_id, amount, type, description } = req.body; // type: 'DEBT' or 'PAYMENT'
  
  const transaction = db.transaction(() => {
    db.prepare("INSERT INTO debts (customer_id, amount, type, description) VALUES (?, ?, ?, ?)")
      .run(customer_id, amount, type, description);
    
    const balanceChange = type === 'DEBT' ? amount : -amount;
    db.prepare("UPDATE customers SET balance = balance + ? WHERE id = ?")
      .run(balanceChange, customer_id);
  });

  transaction();
  res.status(201).json({ message: "Debt record updated" });
});

app.get("/api/customers/:id/history", authenticateToken, (req, res) => {
  const history = db.prepare("SELECT * FROM debts WHERE customer_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json(history);
});

// --- CHAT ROUTES ---
app.get("/api/users", authenticateToken, (req, res) => {
  const users = db.prepare("SELECT id, full_name, username FROM users").all();
  res.json(users);
});

app.get("/api/chat/:otherUserId", authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(userId, otherUserId, otherUserId, userId);
  res.json(messages);
});

// message deletion endpoint
app.delete("/api/messages/:id", authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const msgId = req.params.id;
  const msg = db.prepare("SELECT * FROM messages WHERE id = ?").get(msgId);
  if (!msg) {
    return res.status(404).json({ error: "Message not found" });
  }
  if (msg.sender_id !== userId) {
    return res.status(403).json({ error: "Not authorized to delete this message" });
  }

  db.prepare("DELETE FROM messages WHERE id = ?").run(msgId);

  // notify involved parties via websocket
  broadcastMessageDeleted(msgId, msg.receiver_id);
  broadcastMessageDeleted(msgId, msg.sender_id);

  res.json({ message: "Deleted" });
});

// helper for ws broadcast
function broadcastMessageDeleted(messageId: number, userId: number | null) {
  if (!userId) return;
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'MESSAGE_DELETED', messageId }));
  }
}

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
