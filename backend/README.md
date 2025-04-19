# VNSM Backend

This is the backend service for the VNSM application, built with Express.js and TypeScript.

## Features

*   RESTful API
*   Authentication (Register, Login, Forgot Password)
*   Database integration (MySQL)
*   Swagger API Documentation

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   MySQL Server

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd vnsm/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file with your database credentials, JWT secret, and other configurations.

4.  **Set up the database:**
    *   Ensure your MySQL server is running.
    *   Connect to your MySQL server and create the database specified in `.env` (e.g., `vnsm_db`).
    *   Run the `db.sql` script to create the necessary tables:
        ```bash
        # Example using mysql command line client
        mysql -u <your_db_user> -p <your_db_name> < db.sql
        ```

## Running the Application

*   **Development Mode (with hot-reloading):**
    ```bash
    npm run dev
    ```

*   **Production Mode:**
    1.  Build the TypeScript code:
        ```bash
        npm run build
        ```
    2.  Start the server:
        ```bash
        npm start
        ```

## API Documentation

Once the server is running, API documentation (Swagger UI) is available at:
`http://localhost:<PORT>/api-docs` (Replace `<PORT>` with the port number specified in your `.env` file, e.g., 3001)

## Project Structure

```
backend/
├── dist/               # Compiled JavaScript code
├── src/
│   ├── config/         # Configuration files (DB, etc.)
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware (auth, validation, etc.)
│   ├── models/         # Database models/interfaces
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.ts       # Server entry point
├── .env                # Environment variables (ignored by git)
├── .env.example        # Example environment variables
├── .gitignore          # Files ignored by git
├── db.sql              # Database schema
├── package.json        # Project metadata and dependencies
├── README.md           # This file
└── tsconfig.json       # TypeScript compiler options
``` 