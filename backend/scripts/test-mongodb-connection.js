/**
 * MongoDB Connection Test Script
 * 
 * This script tests the connection to MongoDB for the Listen and Change application.
 * It verifies that the connection is working and that the necessary collections exist.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/listen-and-change';

console.log('Testing MongoDB connection...');
console.log(`Connection URI: ${MONGODB_URI}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Successfully connected to MongoDB');
  
  // Check if User collection exists
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  console.log('\nAvailable collections:');
  collectionNames.forEach(name => console.log(`- ${name}`));
  
  if (collectionNames.includes('users')) {
    console.log('\n✅ User collection exists');
    
    // Count users
    const User = mongoose.model('User');
    const userCount = await User.countDocuments();
    console.log(`- Found ${userCount} users in the database`);
  } else {
    console.log('\n❌ User collection does not exist');
    console.log('Run "npm run setup" to create the necessary collections');
  }
  
  if (collectionNames.includes('audios')) {
    console.log('\n✅ Audio collection exists');
    
    // Count audio files
    const Audio = mongoose.model('Audio');
    const audioCount = await Audio.countDocuments();
    console.log(`- Found ${audioCount} audio files in the database`);
  } else {
    console.log('\n❌ Audio collection does not exist');
    console.log('Run "npm run setup" to create the necessary collections');
  }
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Error connecting to MongoDB:', error.message);
  process.exit(1);
}); 