cat << 'EOF' > README.md
# Backend API Documentation

Welcome to the official Node.js backend repository. This service acts as the core bridge between the frontend application, the MongoDB database, and our Python Machine Learning microservices.

## Tech Stack
* Runtime: Node.js
* Framework: Express.js
* Database: MongoDB (Mongoose)
* Authentication: JWT (JSON Web Tokens)
* File Handling: Multer

## Environment Variables (.env)
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ML_SERVICE_URL=http://localhost:8000

## Installation & Setup
1. Clone the repository
2. Run "npm install"
3. Run "npm run dev" or "node src/index.js"

## API Endpoints Reference

[Auth Token Requirement]
Send JWT Token in Headers: { "Authorization": "Bearer <YOUR_ACCESS_TOKEN>" }

### 1. Authentication APIs (/api/v1/auth)
* POST /send-otp : Send OTP for user verification (Public)
* POST /register : Register a new user (Public)
* POST /login : Authenticate user & return JWT tokens (Public)
* POST /refresh-token : Generate a new access token using a refresh token (Public)
* POST /forgot-password : Initiate the password reset process (Public)
* POST /reset-password/:token : Reset password using the token sent via email (Public)
* POST /social-mock : Mock endpoint for social login integrations (Public)
* POST /update-password : Update the current logged-in user's password (Protected)
* POST /logout : Log out the user and invalidate tokens (Protected)

### 2. ML & Legal Assistant APIs (/api/v1/ml)
* POST /predict : Predict case outcomes based on case history. Requires JSON Body (Protected)
* POST /ask-vakil : Query the AI Vakil Sahab assistant. Requires JSON Body (Protected)
* POST /chat-agent : Talk to the MCP Agent for complex legal queries. Requires JSON Body (Protected)
* GET /search : Search legal databases/acts. Send data as URL Query, e.g., ?query=section+420 (Protected)
* GET /ingest : Trigger ingestion of new legal data. Send data as URL Query (Protected)

### 3. Document Processing APIs (/api/v1/document)
* POST /process : Upload and analyze a PDF document. Must be sent as FormData. Field name MUST be "document" (Protected)
* GET /history : Fetch the list of previously processed documents for the user dashboard (Protected)

### 4. RAG Chat & Summarizer APIs (/api/v1/rag)
* POST /upload : Upload a document to the RAG knowledge base. Must be sent as FormData. Field name MUST be "file" (Protected)
* GET /chat-status : Check if the RAG model is healthy and ready to chat (Protected)
* POST /chat : Chat with the uploaded RAG documents (Protected)
* POST /summarize-web : Provide a URL to get a summarized version of a web article (Protected)
* GET /blogs : Fetch a list of all saved blogs/documents in the hub (Protected)
* GET /blogs/:title : Fetch the exact markdown content of a specific blog by its title (Protected)
* DELETE /blogs/delete : Delete a specific blog from the hub. Requires the blog title in the JSON body (Protected)

## Important Notes for Frontend Developers
1. Form Data Uploads: For /document/process and /rag/upload, strictly use FormData. Do not manually set the Content-Type header.
2. Form Field Names: Use formData.append("document", file) for Process route. Use formData.append("file", file) for RAG Upload.
3. GET Requests: Data for /search and /ingest must be sent as URL parameters, NOT in a JSON body.
EOF