// server.js

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sachi@123',
  database: 'rangaMart'
});

// Import Nodemailer
const nodemailer = require('nodemailer');

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sachi.umay@gmail.com', 
    pass: 'dnnk bonx hrqc gipo'
  }
});


// Function to send order successful email
function sendOrderSuccessfulEmail(email, orderId) {
  const mailOptions = {
    from: 'sachi.umay@gmail.com',
    to: 'antanyjulian@gmail.com', 
    subject: 'Order Placed Successfully',
    text: `Your order with ID ${orderId} has been successfully placed. Thank you for shopping with us!`
  };

  // Send email
  transporter.sendMail(mailOptions, function (error, info) { 
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

// Function to send email
const sendEmail = async (to, subject, text) => {
  try {
    // Send mail with defined transport object
    await transporter.sendMail({
      from: 'sachi.umay@gmail.com',
      to: 'antanyjulian@gmail.com',
      subject: 'Ranga Mart Order Status Confirmation',
      text: 'Your Order has been sent off for delivery'
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Route to handle updating order status
app.put('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { status, email } = req.body;

  // Prepare SQL statement to update order status
  const sql = 'UPDATE orders SET status = ? WHERE id = ?';

  // Execute the query
  db.query(sql, [status, orderId], async (err, result) => {
    if (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: 'Error updating order status' });
    }
    // Successful update
    console.log('Order status updated successfully');

    // Send an email to the specified email address
    await sendEmail(email, 'Order Status Update', `Your order status has been updated to: ${status}`);

    return res.status(200).json({ message: 'Order status updated successfully' });
  });
});


// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// Middleware to parse JSON bodies
app.use(express.json());


// Route to handle storing order details
app.post('/api/orders', (req, res) => {
  const { name, address, contactNo, email, cartItems, totalPrice, paymentMethod } = req.body;

  // Generate description from cartItems
  const description = cartItems.map(item => `${item.qty} x ${item.title}`).join(', ');

  // Prepare a SQL statement with parameterized query to prevent SQL injection
  const sql = 'INSERT INTO orders (name, address, contact_no, email_address, description, total_payment, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  // Use prepared statements to execute the query with parameters
  db.query(sql, [name, address, contactNo, email, description, totalPrice, paymentMethod, 'pending'], (err, result) => {
    if (err) {
      console.error('Error storing order details:', err);
      // Proper error handling: Return a 500 status code and error message
      return res.status(500).json({ error: 'Error storing order details' });
    }
    console.log('Order details stored successfully');

    // Send email notification
    sendOrderSuccessfulEmail(email, result.insertId); 

    return res.status(200).json({ message: 'Order details stored successfully' });
  });
});

// Route to retrieve all orders
app.get('/api/orders', (req, res) => {
  const sql = 'SELECT * FROM orders';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving orders:', err);
      return res.status(500).json({ error: 'Error retrieving orders' });
    }
    return res.status(200).json(results);
  });
});

// Route to handle user registration
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  // Insert user data into the users table
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.error('Error registering user:', err);
      return res.status(500).json({ error: 'Error registering user' });
    }
    // User registration successful
    console.log('User registered successfully');
    return res.status(200).json({ message: 'User registered successfully' });
  });
});


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if the username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username and password" });
  }

  // Query the database to check if the user exists and the password is correct
  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (error, results) => {
      if (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      // If no user found with the given credentials, return an error
      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // Extract user role from the database results'[=]
      console.log(results[0]);
      const { id, role } = results[0];
      console.log(results);

      const data = {
        id,
        role,
      };

      // Send the user role back to the client
      res.status(200).json({ data });
    }
  )
});

// POST route to handle sending email
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      // Configure email service (e.g., Gmail)
      service: 'Gmail',
      auth: {
        user: 'sachi.umay@gmail.com', 
        pass: 'dnnk bonx hrqc gipo' 
      },
    });

    // Send mail with defined transport object
    await transporter.sendMail({
      from: 'sachi.umay@gmail.com',
      to: 'antanyjulian@gmail.com',
      subject: 'New Message from Ranga Mart',
      text: `Hello ${name},\n\nThank you for contacting us! Your message has been received.\n\nMessage: ${message}`,
    });

    res.status(200).send('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Failed to send email. Please try again later.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
