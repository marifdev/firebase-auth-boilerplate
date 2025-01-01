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
git clone https://github.com/yourusername/express-firebase-auth-boilerplate.git
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

## Project Structure

```
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Custom middleware
│   ├── routes/         # API routes
│   └── utils/          # Helper functions
├── .env              # Environment variables
├── .gitignore
└── package.json
```

## API Endpoints

### Authentication

#### POST /api/signup
Create a new user account.
```json
{
  "email": "user@example.com",
  "password": "password123"
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

#### POST /api/signin
Sign in to an existing account.
```json
{
  "email": "user@example.com",
  "password": "password123"
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

#### POST /api/refresh-token
Get a new access token using a refresh token.
```json
{
  "refreshToken": "your.refresh.token"
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

#### GET /api/check-auth
Check authentication status. Requires valid access token.

Headers:
```
Authorization: Bearer your.access.token
```

## Authentication Flow

1. User signs up/signs in and receives both access and refresh tokens
2. Access token is used for API requests (valid for 1 minute)
3. When access token expires, use refresh token to get new tokens
4. If refresh token expires (after 7 days), user needs to sign in again
5. Always include access token in Authorization header for protected routes

### Mobile App Implementation Guide

1. Store both tokens securely (e.g., Keychain for iOS, EncryptedSharedPreferences for Android)
2. For each API request:
   - Add access token to Authorization header
   - If request fails with 401 (Unauthorized):
     1. Use refresh token to get new tokens
     2. Update stored tokens
     3. Retry original request with new access token
   - If refresh token is invalid/expired:
     1. Clear stored tokens
     2. Redirect to login

## Token Management

The authentication system uses multiple token types for secure session management:

1. **Access Token**: Short-lived (1 minute) token for API access
2. **Refresh Token**: Long-lived (7 days) token for obtaining new tokens
3. **Firebase ID Token**: Used as fallback when refresh token expires

### Token Refresh Strategy

The system implements a three-tier token refresh strategy:

1. Use access token for API requests (valid for 1 minute)
2. When access token expires, use refresh token to get new tokens (valid for 7 days)
3. If refresh token expires, use Firebase ID token to re-authenticate and get new tokens

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

Error response when refresh token expires:
```json
{
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED",
  "message": "Please provide Firebase ID token to re-authenticate"
}
```

### Mobile App Implementation Guide

1. Store tokens securely (e.g., Keychain for iOS, EncryptedSharedPreferences for Android)
2. For each API request:
   - Add access token to Authorization header
   - If request fails with 401 (Unauthorized):
     1. Try to get new tokens using refresh token
     2. If refresh token is expired:
        - Get new Firebase ID token from Firebase SDK
        - Call refresh-token endpoint with both tokens
        - Update stored tokens
     3. Retry original request with new access token
   - Only redirect to login if Firebase authentication fails

### Example Mobile App Token Refresh Flow

```javascript
async function makeAuthenticatedRequest(endpoint, options) {
  try {
    // First attempt with access token
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers
      }
    });

    if (response.status !== 401) return response;

    // Access token expired, try refresh
    try {
      const tokens = await refreshTokens(refreshToken);
      // Update stored tokens
      updateStoredTokens(tokens);
      
      // Retry request with new access token
      return await fetch(endpoint, {
        ...options,
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          ...options.headers
        }
      });
    } catch (error) {
      if (error.code === 'REFRESH_TOKEN_EXPIRED') {
        // Get new Firebase ID token
        const firebaseIdToken = await firebase.auth().currentUser.getIdToken();
        
        // Try refresh with Firebase ID token
        const tokens = await refreshTokens(refreshToken, firebaseIdToken);
        updateStoredTokens(tokens);
        
        // Retry request one last time
        return await fetch(endpoint, {
          ...options,
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            ...options.headers
          }
        });
      }
      throw error;
    }
  } catch (error) {
    // Handle final authentication failure
    console.error('Authentication failed:', error);
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

For support, email your-email@example.com or open an issue in the repository.

## Token Types

The system uses three types of tokens:

1. **Access Token**: 
   - Short-lived (1 minute)
   - Used for API authorization
   - Obtained from our backend endpoints
   - Include in Authorization header

2. **Refresh Token**:
   - Long-lived (7 days)
   - Used to get new access tokens
   - Obtained from our backend endpoints
   - Send to refresh-token endpoint

3. **Firebase ID Token**:
   - Generated by Firebase SDK
   - Used as fallback authentication
   - Obtained from Firebase client SDK
   - Automatically managed by Firebase

### Getting Firebase ID Token

The Firebase ID token is NOT returned by our backend endpoints. Instead, get it from the Firebase SDK in your client app:

```javascript
// Initialize Firebase in your app first
firebase.initializeApp({
  // Your Firebase config
});

// Get the ID token
async function getFirebaseIdToken() {
  const currentUser = firebase.auth().currentUser;
  if (currentUser) {
    return await currentUser.getIdToken(true); // Force refresh
  }
  throw new Error('No user logged in');
}
```

### Complete Authentication Flow

1. **Initial Login**:
   ```javascript
   // 1. Sign in with Firebase
   await firebase.auth().signInWithEmailAndPassword(email, password);
   
   // 2. Call your backend signin endpoint
   const authData = await fetch('/api/signin', {
     method: 'POST',
     body: JSON.stringify({ email, password })
   });
   
   // 3. Store tokens
   const { accessToken, refreshToken } = await authData.json();
   ```

2. **Token Refresh Flow**:
   ```javascript
   async function refreshTokens(oldRefreshToken) {
     try {
       // First try with refresh token
       const response = await fetch('/api/refresh-token', {
         method: 'POST',
         body: JSON.stringify({ refreshToken: oldRefreshToken })
       });
       
       if (response.ok) return await response.json();
       
       // If refresh token expired, use Firebase ID token
       const firebaseIdToken = await firebase.auth().currentUser.getIdToken(true);
       
       return await fetch('/api/refresh-token', {
         method: 'POST',
         body: JSON.stringify({
           refreshToken: oldRefreshToken,
           firebaseIdToken
         })
       }).then(res => res.json());
     } catch (error) {
       // Handle errors
       console.error('Token refresh failed:', error);
       throw error;
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

### Testing Token Refresh Flow

1. **Initial Setup**:
   ```bash
   # 1. Sign in to get initial tokens
   curl -X POST http://localhost:3000/api/signin \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password123"}'
   ```

2. **Test Protected Endpoint**:
   ```bash
   # 2. Try accessing protected endpoint
   curl -X GET http://localhost:3000/api/protected-test \
     -H "Authorization: Bearer your.access.token"
   ```

3. **When Token Expires**:
   ```bash
   # 3. If access token expired, get new tokens
   curl -X POST http://localhost:3000/api/refresh-token \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "your.refresh.token"}'
   ```

4. **Retry with New Token**:
   ```bash
   # 4. Try protected endpoint with new access token
   curl -X GET http://localhost:3000/api/protected-test \
     -H "Authorization: Bearer your.new.access.token"
   ```
