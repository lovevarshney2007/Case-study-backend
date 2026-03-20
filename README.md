cat << 'EOF' > README.md
# Agnisense (JusticeClear) - Backend API

Welcome to the official Node.js backend repository for Agnisense. This service acts as the core bridge between the frontend application, the MongoDB database, and our Python Machine Learning microservices.

## Tech Stack
* Runtime: Node.js
* Framework: Express.js
* Database: MongoDB (Mongoose)
* Authentication: JWT (JSON Web Tokens)
* File Handling: Multer
* Performance: Node-Cache (In-memory caching for sub-20ms responses)

## Environment Variables (.env)
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ML_SERVICE_URL=http://localhost:8000
MULTI_RAG_SERVICE_URL=http://localhost:8001

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
* POST /predict : Predict case outcomes. Requires case_type, lawyer_exp, judge_exp, judge_count, complexity, and evidence (Protected/Cached)
* POST /ask-vakil : Query the AI Vakil Sahab assistant. Requires JSON Body (Protected/Cached)
* POST /chat-agent : Talk to the MCP Agent for complex legal queries. Requires JSON Body (Protected)
* GET /search : Search legal databases/acts. Send data as URL Query, e.g., ?query=section+420 (Protected/Cached)
* GET /ingest : Trigger ingestion of new legal data. Send data as URL Query (Protected)

### 3. Document Processing APIs (/api/v1/document)
* POST /process : (MERGED ROUTE) Uploads document for OCR, AI Summary, AND pushes to RAG Knowledge Base. Must be sent as FormData. Field name MUST be "document" (Protected)
* GET /history : Fetch the list of previously processed documents for the user dashboard (Protected/Cached)

### 4. RAG Chat & Summarizer APIs (/api/v1/rag)
* GET /chat-status : Check if the RAG model is healthy and ready to chat (Protected)
* POST /chat : Chat with the uploaded RAG documents (Protected)
* POST /summarize-web : Provide a URL to get a summarized version of a web article (Protected/Cached with Timeout Protection)
* GET /blogs : Fetch a list of all saved blogs/documents in the hub (Protected/Cached)
* GET /blogs/:title : Fetch the exact markdown content of a specific blog by its title (Protected/Cached)
* DELETE /blogs/delete : Delete a specific blog from the hub. Requires the blog title in the JSON body (Protected)

## Important Notes for Frontend Developers (READ BEFORE INTEGRATION)
1. Single Upload Route: You no longer need to call two separate APIs for processing and RAG upload. Just hit /document/process and the backend will handle both!
2. Form Data Uploads: For /document/process, strictly use FormData. Do not manually set the Content-Type header; let the browser handle it.
3. Form Field Name: Use formData.append("document", file) for the Process route.
4. GET Requests: Data for /search and /ingest must be sent as URL parameters, NOT in a JSON body.
5. Large Articles: The /summarize-web route handles token limits. If you send a massive Wikipedia page, it will return a clean 400 error.
EOF