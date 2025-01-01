const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Create user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Generate access token
    const accessToken = jwt.sign(
      {
        email: userRecord.email,
        uid: userRecord.uid
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Generate refresh token with longer expiry
    const refreshToken = jwt.sign(
      {
        uid: userRecord.uid,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        email: userRecord.email,
        uid: userRecord.uid
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);

    // Generate access token with short expiry
    const accessToken = jwt.sign(
      {
        email: user.email,
        uid: user.uid
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Generate refresh token with longer expiry
    const refreshToken = jwt.sign(
      {
        uid: user.uid,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        uid: user.uid
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken, firebaseIdToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
      // First try to verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Check if it's actually a refresh token
      if (decoded.type !== 'refresh') {
        return res.status(400).json({ error: 'Invalid refresh token' });
      }

      // Get user data from Firebase
      const user = await admin.auth().getUser(decoded.uid);

      // Generate new tokens
      const [accessToken, newRefreshToken] = await generateTokens(user);

      return res.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          email: user.email,
          uid: user.uid
        }
      });
    } catch (tokenError) {
      // If refresh token is expired or invalid, try to use Firebase ID token
      if (!firebaseIdToken) {
        return res.status(401).json({
          error: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Please provide Firebase ID token to re-authenticate'
        });
      }

      // Verify Firebase ID token
      const decodedIdToken = await admin.auth().verifyIdToken(firebaseIdToken);
      const user = await admin.auth().getUser(decodedIdToken.uid);

      // Generate new tokens
      const [accessToken, newRefreshToken] = await generateTokens(user);

      return res.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          email: user.email,
          uid: user.uid
        }
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// Helper function to generate tokens
async function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      email: user.email,
      uid: user.uid
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const refreshToken = jwt.sign(
    {
      uid: user.uid,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return [accessToken, refreshToken];
}

// Simple test endpoint that requires authorization
router.get('/protected-test', verifyToken, (req, res) => {
  res.json({
    message: 'You have accessed a protected endpoint!',
    user: {
      email: req.user.email,
      uid: req.user.uid
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 