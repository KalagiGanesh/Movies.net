const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL");
    
    // Create database if not exists
    connection.query("CREATE DATABASE IF NOT EXISTS auth_app", (err) => {
        if (err) {
            console.error("Error creating database:", err);
            return;
        }
        console.log("Database auth_app created or already exists");
        
        // Use the database
        connection.changeUser({ database: "auth_app" }, (err) => {
            if (err) {
                console.error("Error changing database:", err);
                return;
            }
            
            // Create users table if not exists
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255),
                    password VARCHAR(255)
                )
            `;
            
            connection.query(createTableQuery, (err) => {
                if (err) {
                    console.error("Error creating table:", err);
                    return;
                }
                console.log("Users table created or already exists");
            });
        });
    });
});

// Root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Registration route
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: "Username and password required" });
    }
    
    const query = "INSERT INTO users (username, password) VALUES (?, ?)";
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error("Registration error:", err);
            return res.json({ success: false, message: "Registration failed" });
        }
        res.json({ success: true });
    });
});

// Login route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: "Username and password required" });
    }
    
    const query = "SELECT * FROM users WHERE username = ?";
    connection.query(query, [username], (err, results) => {
        if (err) {
            console.error("Login query error:", err);
            return res.json({ success: false, message: "Login failed" });
        }
        
        if (results.length === 0) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        
        const user = results[0];
        if (user.password === password) {
            res.json({
                success: true,
                redirectUrl: "https://netflix-movies-sigma.vercel.app/"
            });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
});

// Start server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});