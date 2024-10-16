const { KafkaClient, Consumer, Producer } = require('kafka-node');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: 'Ansivandana@143',
  port: 5432,
});

// Kafka Consumer and Producer Setup
const kafkaClient = new KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new Producer(kafkaClient);
const consumer = new Consumer(kafkaClient, [{ topic: 'OrderPlaced', partition: 0 }], { autoCommit: true });

// Process Payment (Mock function)
const processPayment = (order) => {
  // Simulate a payment success (In a real-world application, integrate a payment gateway)
  return true; 
};

// Publish event to Kafka
const publishEvent = (topic, message) => {
  const payloads = [{ topic: topic, messages: JSON.stringify(message) }];
  producer.send(payloads, (err, data) => {
    if (err) console.log('Error sending message to Kafka', err);
    else console.log('Message sent successfully', data);
  });
};

// Listen for "OrderPlaced" events
consumer.on('message', async (message) => {
  const order = JSON.parse(message.value);
  console.log('Processing order:', order);

  try {
    // Process Payment
    const paymentSuccess = processPayment(order);
    
    if (paymentSuccess) {
      // Update order status in the database
      await pool.query('UPDATE orders SET payment_status = $1 WHERE order_id = $2', ['processed', order.orderId]);

      // Publish "OrderProcessed" event to Kafka
      const orderProcessedEvent = {
        orderId: order.orderId,
        userId: order.userId,
        products: order.products,
        totalAmount: order.totalAmount,
      };
      publishEvent('OrderProcessed', orderProcessedEvent);
    }
  } catch (err) {
    console.error('Error processing order:', err);
  }
});
