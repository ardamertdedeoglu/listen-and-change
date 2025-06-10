# MongoDB Integration for User Authentication

This document explains how to set up and use MongoDB for user authentication in the Listen and Change application.

## Prerequisites

- MongoDB installed locally or a MongoDB Atlas account
- Node.js and npm installed

## Setup Instructions

### 1. Install MongoDB

#### Local Installation
- Download and install MongoDB Community Edition from [MongoDB website](https://www.mongodb.com/try/download/community)
- Start the MongoDB service

#### MongoDB Atlas (Cloud)
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster
- Set up database access (username and password)
- Set up network access (IP whitelist)
- Get your connection string

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the following variables:
   ```
   MONGO_URI=mongodb://localhost:27017/listen-and-change
   JWT_SECRET=your_secure_random_string
   ```

   For MongoDB Atlas, use your connection string:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/listen-and-change?retryWrites=true&w=majority
   ```

### 3. Install Dependencies

The required dependencies are already included in `package.json`:
- mongoose
- mongodb
- bcryptjs
- jsonwebtoken

If you need to install them manually:
```bash
npm install mongoose mongodb bcryptjs jsonwebtoken
```

## Usage

The MongoDB integration is already set up in the following files:

- `models/User.js`: User schema and model
- `config/db.js`: Database connection
- `routes/auth.js`: Authentication routes using MongoDB
- `server.js`: Server setup with MongoDB connection

### API Endpoints

- **Register**: `POST /api/auth/register`
  - Body: `{ "email": "user@example.com", "password": "password123", "name": "User Name" }`

- **Login**: `POST /api/auth/login`
  - Body: `{ "email": "user@example.com", "password": "password123" }`

- **Get Profile**: `GET /api/auth/profile`
  - Headers: `Authorization: Bearer <token>`

## Security Considerations

- Passwords are automatically hashed using bcrypt before saving to the database
- JWT tokens are used for authentication
- Environment variables are used for sensitive information

## Troubleshooting

- **Connection Issues**: Check your MongoDB connection string and ensure MongoDB is running
- **Authentication Errors**: Verify your MongoDB username and password
- **Database Errors**: Check MongoDB logs for detailed error messages 