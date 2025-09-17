# Mind Map Backend API

## Overview
This is the backend API for the Mind Map application built with Node.js, Express, and MongoDB.

## Features
- RESTful API for mind map operations
- MongoDB Atlas integration
- CORS enabled for frontend integration
- Environment variable configuration

## API Endpoints

### Base URL: `http://localhost:5000/api`

### Mind Maps
- `GET /maps` - Get all mind maps
- `GET /maps/:id` - Get a specific mind map
- `POST /maps` - Create a new mind map
- `PUT /maps/:id` - Update a mind map
- `DELETE /maps/:id` - Delete a mind map

### Health Check
- `GET /health` - API health status

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure your MongoDB Atlas connection string

3. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Database Schema

### MindMap Document
```json
{
  "title": "String (required)",
  "nodes": [
    {
      "id": "String (required)",
      "text": "String (required)",
      "x": "Number (required)",
      "y": "Number (required)", 
      "parent": "String (optional)",
      "color": "String (default: #ffffff)"
    }
  ],
  "connections": [
    {
      "from": "String (required)",
      "to": "String (required)"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```