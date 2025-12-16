const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // serve static files

// ===================
// FILE PATHS
// ===================
const usersFile = path.join(__dirname, "users.json");
const reviewsFile = path.join(__dirname, "reviews.json");
const productsFile = path.join(__dirname, "products.json");
const messagesFile = path.join(__dirname, "messages.json");
const ordersFile = path.join(__dirname, "buyerOrders.json");

// Ensure files exist
const ensureFile = (file) => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([]));
};
[usersFile, reviewsFile, productsFile, messagesFile, ordersFile].forEach(ensureFile);

// ===================
// ROUTES
// ===================

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===================
// REGISTER
// ===================
app.post("/register", (req, res) => {
  const { name, email, phone, state, farm, message, password, role } = req.body;
  if (!email || !name || !role) return res.status(400).send("Missing required fields");

  let users = JSON.parse(fs.readFileSync(usersFile));
  if (users.find((u) => u.email === email)) {
    return res.send(`
      <script>
        alert("⚠️ User already registered. Please login.");
        window.location.href = "/login.html";
      </script>
    `);
  }

  users.push({ name, email, phone, state, farm, message, password, role });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.send(`
    <script>
      alert("✅ Registration Successful!");
      window.location.href = "/login.html";
    </script>
  `);
});

// ===================
// LOGIN
// ===================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.send(`
      <script>
        alert("❌ Invalid Email or Password!");
        window.location.href = "/login.html";
      </script>
    `);
  }

  res.send(`
    <script>
      localStorage.setItem("loggedInUser", '${JSON.stringify(user)}');
      if ('${user.role}' === 'seller') {
        window.location.href = "/seller-dashboard.html";
      } else {
        window.location.href = "/buyer-dashboard.html";
      }
    </script>
  `);
});

// ===================
// REVIEWS
// ===================
app.post("/api/reviews", (req, res) => {
  const { name, message } = req.body;
  if (!name || !message)
    return res.status(400).json({ error: "Name and message required" });

  let reviews = JSON.parse(fs.readFileSync(reviewsFile));
  reviews.push({ name, message, date: new Date() });
  fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
  res.json({ success: true });
});

app.get("/api/reviews", (req, res) => {
  const reviews = JSON.parse(fs.readFileSync(reviewsFile));
  res.json(reviews);
});

// ===================
// PRODUCTS
// ===================
function loadProducts() {
  return JSON.parse(fs.readFileSync(productsFile));
}

function saveProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

app.get("/api/products", (req, res) => {
  res.json(loadProducts());
});

app.post("/api/products", (req, res) => {
  const { name, desc, price, link, sellerEmail } = req.body;
  if (!name || !price || !sellerEmail)
    return res.status(400).json({ error: "Missing required fields" });

  const products = loadProducts();
  const newProduct = {
    id: Date.now().toString(),
    name,
    desc: desc || "",
    price: Number(price),
    link: link || "",
    sellerEmail,
    createdAt: new Date(),
  };
  products.push(newProduct);
  saveProducts(products);
  res.json({ success: true, product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const { name, desc, price, link } = req.body;
  const products = loadProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });

  if (name) products[idx].name = name;
  if (desc) products[idx].desc = desc;
  if (price) products[idx].price = Number(price);
  if (link) products[idx].link = link;

  saveProducts(products);
  res.json({ success: true, product: products[idx] });
});

app.delete("/api/products/:id", (req, res) => {
  const id = req.params.id;
  let products = loadProducts();
  products = products.filter((p) => p.id !== id);
  saveProducts(products);
  res.json({ success: true });
});

// ===================
// MESSAGES (Buyer → Seller requests)
// ===================
app.post("/api/messages", (req, res) => {
  try {
    const { buyerEmail, sellerEmail, productName } = req.body;
    if (!buyerEmail || !sellerEmail || !productName)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    let messages = JSON.parse(fs.readFileSync(messagesFile));
    messages.push({
      buyerEmail,
      sellerEmail,
      productName,
      date: new Date().toISOString(),
      read: false,
    });

    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    res.json({ success: true, message: "Request saved successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET messages for a seller
app.get("/api/messages/:email", (req, res) => {
  try {
    const sellerEmail = req.params.email;
    const messages = JSON.parse(fs.readFileSync(messagesFile));
    const sellerMessages = messages.filter(
      (m) => m.sellerEmail === sellerEmail
    );
    res.json(sellerMessages);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error reading messages" });
  }
});

// ✅ MARK MESSAGE AS READ + ADD TO BUYER ORDERS
app.post("/api/messages/mark-read", (req, res) => {
  const { buyerEmail, productName } = req.body;
  if (!buyerEmail || !productName)
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });

  try {
    let messages = JSON.parse(fs.readFileSync(messagesFile));
    const msgIndex = messages.findIndex(
      (m) => m.buyerEmail === buyerEmail && m.productName === productName
    );

    if (msgIndex === -1)
      return res.status(404).json({ success: false, message: "Message not found" });

    messages[msgIndex].read = true;
    messages[msgIndex].status = "approved";
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));

    // Add to buyerOrders.json
    let orders = JSON.parse(fs.readFileSync(ordersFile));
    orders.push({
      buyerEmail,
      productName,
      date: new Date(),
      status: "approved",
    });
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    res.json({ success: true, message: "Marked as read & added to buyer orders" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===================
// START SERVER
// ===================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
