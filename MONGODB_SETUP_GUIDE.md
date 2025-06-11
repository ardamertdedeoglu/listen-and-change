# MongoDB Setup Guide for Listen and Change

This guide will help you set up MongoDB for the Listen and Change application.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Step 1: Install MongoDB

### Windows

1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the instructions
3. Make sure to install MongoDB Compass (the GUI tool) if you want a visual interface

### macOS

Using Homebrew:
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### Linux (Ubuntu)

```bash
# Import the MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Update the package database
sudo apt-get update

# Install MongoDB packages
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

## Step 2: Configure the Application

1. Copy the environment example files:
   ```bash
   # In the backend directory
   cp env.example .env
   
   # In the frontend directory
   cp env.example .env
   ```

2. Edit the `.env` files to match your MongoDB configuration:
   - In `backend/.env`, set `MONGODB_URI` to your MongoDB connection string
   - Default: `mongodb://localhost:27017/listen-and-change`

## Step 3: Set Up the Database

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the setup script:
   ```bash
   npm run setup
   ```

   This script will:
   - Create the necessary collections in MongoDB
   - Set up indexes for better performance
   - Create a test user (username: testuser, password: password123)

3. Test the connection:
   ```bash
   npm run test-connection
   ```

   This will verify that the application can connect to MongoDB and that the necessary collections exist.

## Step 4: Start the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Make sure MongoDB is running:
   ```bash
   # Windows
   Check Services app for MongoDB service
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

2. Verify your connection string in the `.env` file

3. Check if MongoDB is listening on the default port (27017):
   ```bash
   # Windows
   netstat -an | findstr 27017
   
   # macOS/Linux
   netstat -an | grep 27017
   ```

### Database Setup Issues

If the setup script fails:

1. Check the MongoDB logs for errors
2. Make sure you have the necessary permissions
3. Try running the setup script with verbose logging:
   ```bash
   DEBUG=* npm run setup
   ```

## Using MongoDB Compass

MongoDB Compass is a GUI tool that makes it easy to explore and manipulate your MongoDB data.

1. Download MongoDB Compass from [MongoDB Download Center](https://www.mongodb.com/try/download/compass)
2. Install and open MongoDB Compass
3. Connect to your MongoDB instance using the connection string: `mongodb://localhost:27017`
4. Navigate to the `listen-and-change` database
5. Explore the collections and documents

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Compass Documentation](https://docs.mongodb.com/compass/) 