const express = require('express');
const { KafkaClient, Producer } = require('kafka-node');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

// Set up Express and PostgreSQL connection
const app = express();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: 'Ansivandana@143',
  port: 5432,
});

app.use(bodyParser.json()); 

// Kafka Client and Producer Setup
const kafkaClient = new KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new Producer(kafkaClient);

// Publish the event to Kafka
const publishEvent = (topic, message) => {
  const payloads = [{ topic: topic, messages: JSON.stringify(message) }];
  producer.send(payloads, (err, data) => {
    if (err) console.log('Error sending message to Kafka', err);
    else console.log('Message sent successfully', data);
  });
};

// API to place an order
app.post('/order', async (req, res) => {
  const { userId, products, totalAmount } = req.body;
  
  try {
    // Store order details in the database
    const result = await pool.query(
      'INSERT INTO orders(user_id, total_amount, payment_status) VALUES($1, $2, $3) RETURNING order_id',
      [userId, totalAmount, 'pending']
    );
    const orderId = result.rows[0].order_id;

    // Publish "OrderPlaced" event to Kafka
    const orderPlacedEvent = {
      orderId,
      userId,
      products,
      totalAmount,
    };
    publishEvent('OrderPlaced', orderPlacedEvent);

    res.status(200).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.listen(3000, () => {
  console.log('Order service running on port 3000');
});
