import { getApiUrl } from '../utils/apiToUrl.js';

class AuthService {
  static async signup(username, password) {
    try {
      const response = await fetch(getApiUrl('signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // We can add more auth-related methods here later:
  // - login
  // - logout
  // - getCurrentUser
  // - isAuthenticated
  // etc.
}

export default AuthService;