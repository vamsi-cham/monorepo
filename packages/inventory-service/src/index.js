const { KafkaClient, Consumer } = require('kafka-node');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: 'Ansivandana@143',
  port: 5432,
});

// Kafka Consumer Setup
const kafkaClient = new KafkaClient({ kafkaHost: 'localhost:9092' });
const consumer = new Consumer(kafkaClient, [{ topic: 'OrderProcessed', partition: 0 }], { autoCommit: true });

// Listen for "OrderProcessed" events
consumer.on('message', async (message) => {
  const order = JSON.parse(message.value);
  console.log('Updating inventory for order:', order);

  try {
    // Update inventory based on the products in the order
    for (let product of order.products) {
      const { productId, quantity } = product;

      await pool.query('UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2', [quantity, productId]);

      // Check if inventory is low
      const result = await pool.query('SELECT quantity FROM inventory WHERE product_id = $1', [productId]);
      const remainingQuantity = result.rows[0].quantity;
      
      if (remainingQuantity < 10) {
        console.log(`Low stock alert for product ${productId}: remaining stock is ${remainingQuantity}`);
      }
    }
  } catch (err) {
    console.error('Error updating inventory:', err);
  }
});
