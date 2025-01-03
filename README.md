# Express Firebase Auth Boilerplate

A production-ready Express.js boilerplate with Firebase Authentication and JWT token management.

## Features

- 🔐 Firebase Authentication
- 🎫 JWT Token Management
- 🔄 Token Refresh Mechanism
- 🔒 Protected Routes
- 🌐 CORS Configuration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Firebase Account
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/marifdev/express-firebase-auth-boilerplate.git
cd express-firebase-auth-boilerplate
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
JWT_SECRET=your_jwt_secret
```

4. Start the server:
```bash
npm run dev
```

## Token Types

The system uses three types of tokens:

1. **Access Token**: 
   - Valid for 1 day
   - Used for API authorization
   - Obtained from our backend endpoints
   - Include in Authorization header

2. **Refresh Token**:
   - Valid for 7 days
   - Used to get new access tokens
   - Obtained from our backend endpoints
   - Send to refresh-token endpoint

3. **Firebase ID Token**:
   - Generated by Firebase SDK
   - Used as fallback authentication
   - Obtained from Firebase client SDK
   - Automatically managed by Firebase

## API Endpoints

### Authentication

#### POST /api/signin
Sign in using Firebase ID token. First sign in with Firebase client SDK, then call this endpoint.

Client-side code:
```javascript
// 1. First sign in with Firebase
const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
const firebaseIdToken = await userCredential.user.getIdToken();

// 2. Then call your backend
const response = await fetch('/api/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firebaseIdToken
  })
});

const { accessToken, refreshToken } = await response.json();
```

Request:
```json
{
  "firebaseIdToken": "firebase.id.token"
}
```

Response:
```json
{
  "accessToken": "your.access.token",
  "refreshToken": "your.refresh.token",
  "user": {
    "email": "user@example.com",
    "uid": "user123"
  }
}
```

#### POST /api/signup
Create a new user account. Similar to signin, first create account with Firebase client SDK.

Client-side code:
```javascript
// 1. First create account with Firebase
const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
const firebaseIdToken = await userCredential.user.getIdToken();

// 2. Then call your backend
const response = await fetch('/api/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firebaseIdToken
  })
});

const { accessToken, refreshToken } = await response.json();
```

Request:
```json
{
  "firebaseIdToken": "firebase.id.token"
}
```

#### POST /api/refresh-token
Get new tokens using either refresh token or Firebase ID token.
```json
{
  "refreshToken": "your.refresh.token",
  "firebaseIdToken": "firebase.id.token" // Optional, required if refresh token expired
}
```

Response:
```json
{
  "accessToken": "new.access.token",
  "refreshToken": "new.refresh.token",
  "user": {
    "email": "user@example.com",
    "uid": "user123"
  }
}
```

### Protected Routes

#### GET /api/protected-test
A simple endpoint to test authentication and token refresh flow.

Headers:
```
Authorization: Bearer your.access.token
```

Success Response:
```json
{
  "message": "You have accessed a protected endpoint!",
  "user": {
    "email": "user@example.com",
    "uid": "user123"
  },
  "timestamp": "2024-01-20T15:30:00.000Z"
}
```

Error Response (401 Unauthorized):
```json
{
  "error": "Token expired"
}
```

## Authentication Flow

1. Client signs up/signs in using Firebase client SDK
2. Client gets Firebase ID token
3. Client sends Firebase ID token to backend
4. Backend verifies Firebase ID token and returns custom tokens (access + refresh)
5. Client uses access token for API requests (valid for 1 day)
6. When access token expires, use refresh token to get new tokens
7. If refresh token expires (after 7 days), use new Firebase ID token to re-authenticate
8. Always include access token in Authorization header for protected routes

### Client Implementation Guide

1. Initialize Firebase in your client app:
```javascript
// Initialize Firebase
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  // ... other config
});
```

2. Handle authentication:
```javascript
async function signIn(email, password) {
  try {
    // 1. Sign in with Firebase
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const firebaseIdToken = await userCredential.user.getIdToken();

    // 2. Get custom tokens from your backend
    const response = await fetch('/api/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ firebaseIdToken })
    });

    // 3. Store tokens
    const { accessToken, refreshToken } = await response.json();
    // Store tokens securely...

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
}
```

3. Handle token refresh:
```javascript
async function refreshTokens(oldRefreshToken) {
  try {
    // 1. Try with refresh token first
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: oldRefreshToken })
    });

    if (response.ok) return await response.json();

    // 2. If refresh token expired, get new Firebase token
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error('No Firebase user found');
    }

    const firebaseIdToken = await currentUser.getIdToken(true);
    
    // 3. Try with Firebase token
    return await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: oldRefreshToken,
        firebaseIdToken
      })
    }).then(res => res.json());
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}
```

## Security Features

- Firebase Authentication
- JWT token encryption
- Protected routes
- CORS configuration
- Request validation

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:
```json
{
  "error": "Error message here"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, open an issue in the repository.
