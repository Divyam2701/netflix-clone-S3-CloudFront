<a name="top"></a>
<h1 align="center">MERN Netflix Clone with S3 and CloudFront 🎬</h1>

![Demo App](./preview/home-screen.png 'Preview')


### 🔧 Backend 
- 🗄️ MongoDB Setup
- 🔐 Authentication with JWT
- 🔄 Forgot & Reset Password
- 📧 Sending account related emails
- 🔒 Protecting Our Routes
- 🎬 Fetch Movies and Tv Shows from TMDB API
- 🙌 Fetch Similar Movies and Tv Shows
- 🔎 Search for Actors and Movies
-     fetching the video from the s3 using cloudfront URL
  
### 🌐 Frontend
- 📋 Signup Page UI
- 🔓 Login Page UI
-     admin page for video upload to S3
- ✅ Email Verification Page UI
- 📤 Implementing Signup
- 🔑 Implementing Login
- 📧 Implementing Email Verification
- 🔄 Implementing Forgot Password
- 📱 Responsive UI
- 🎥 Watch Trailers
- 🔥 Fetch Search History
- 💙 Awesome Landing Page
- 🌐 Deployment
- 🚀 And Many More Cool Features

<br/>

## System requirements

> [!NOTE]
> Before you start, make sure you have the following installed:
- [x] Node.js 20.12.0 or later installed.
- [x] React.js 18.3.1 or later.
- [x] Operating systems: macOS, Windows, or Linux.
- [x] VSCode or another text editor of your choice.


<br/>

## 🚀 Quick Start Guide

To spin up this project locally, follow these steps

### Clone

Use the ` git clone ` CLI to clone template directly  to your machine


### Run project on local

```bash
npm run build
npm start
```

## Project Dev Steps

1. Environment Setup
   
   Create a `.env` file on the root of project
   PUT THIS INSIDE

```bash

# Node server
SERVER_PORT=8000
NODE_ENV=development

# Client config
CLIENT_HOST=localhost
CLIENT_PORT=5173
CLIENT_URL=http://localhost:5173

# JWT secret
JWT_SECRET=<any-secret-code-base64>

# Database integration
MONGO_URI=<your-mongodb-url>

# TMDB API integration
TMDB_API_KEY=<your-api-key>

# Mailtrap API Integration (using Email API)
MAILTRAP_API_TOKEN=<your-api-token>
# The new base URL now includes the endpoint path (with the provided ID 3689529).
MAILTRAP_BASE_URL=<your-base-url>
MAILTRAP_SENDER_EMAIL=<your-sender-mail>
MAILTRAP_SENDER_NAME="Mailtrap Test"

# Mailtrap Email Template Settings
# (Replace with your actual template UUID from your Mailtrap dashboard)
EMAIL_TEMPLATE_ID=<your-template-id>

# Default Email Template Variables (as a JSON string)
EMAIL_TEMPLATE_VARIABLES={"company_info_name":"Test_Company_info_name","name":"Test_Name","company_info_address":"Test_Company_info_address","company_info_city":"Test_Company_info_city","company_info_zip_code":"Test_Company_info_zip_code","company_info_country":"Test_Company_info_country"}

# S3 bucket and CloudFront distribution URL
S3_BUCKET=<s3-bucket-name>
CLOUDFRONT_URL=<your-cloudfront-url>
    
```

2.  Project Folders & Files Structure

3.  Update `package.json` file from root directory

```json

// For mac and linux users
 "scripts": {
    "dev": "NODE_ENV=development&& concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\" ",
    "start": "NODE_ENV=production&& node backend/app.js",
    "build": "npm install && npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend",
    "format": "prettier --print-width=120 --write ."
  }

// For windows users
 "scripts": {
    "dev": "SET NODE_ENV=development&& concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\" ",
    "start": "SET NODE_ENV=production&& node backend/app.js",
    "build": "npm install && npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend",
    "format": "prettier --print-width=120 --write ."
  }


```
4.  Setup the s3 trailer data store

```bash
cd ../scripts
node generateTrailerMapS3.js
cd ..
```
   
5.  Run project in development

```bash

npm install
npm run dev

```

> [!TIP]
> Run this command to format code before running `git commit` command.

```bash
npm run format
```

