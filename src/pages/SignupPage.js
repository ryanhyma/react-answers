import React, { useState } from 'react';
import { GcdsContainer, GcdsText, GcdsButton, GcdsLink } from '@cdssnc/gcds-components-react';
import { useTranslations } from '../hooks/useTranslations.js';
import AuthService from '../services/AuthService.js';

const SignupPage = ({ lang = 'en' }) => {
  const { t } = useTranslations(lang);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await AuthService.signup(formData.username, formData.password);
      setMessage(t('signup.messages.success'));
      setFormData({ username: '', password: '' });
    } catch (error) {
      console.error('Signup error:', error);
      setMessage(error.message || t('signup.messages.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className="mb-400">{t('signup.title')}</h1>
      
      {message && (
        <div className={`mb-400 p-4 rounded ${message.includes('successful') ? 'bg-green-100' : 'bg-red-100'}`}>
          {message}
          {message.includes('successful') && (
            <>
              {" "}
              <GcdsLink href={`/${lang}/login`}>{t('signup.messages.loginLink')}</GcdsLink>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-400">
          <label htmlFor="username" className="block mb-2">
            {t('signup.form.username')}
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            minLength={3}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>

        <div className="mb-400">
          <label htmlFor="password" className="block mb-2">
            {t('signup.form.password')}
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>

        <GcdsButton type="submit" disabled={isLoading}>
          {isLoading ? t('signup.form.submitting') : t('signup.form.submit')}
        </GcdsButton>
      </form>
    </GcdsContainer>
  );
};

export default SignupPage;