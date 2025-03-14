import { getApiUrl } from '../utils/apiToUrl.js';

class AuthService {
  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static removeToken() {
    localStorage.removeItem('token');
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static async signup(email, password) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  static async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  static logout() {
    this.removeToken();
  }

  static getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export default AuthService;