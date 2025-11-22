/**
 * Registration Page Component
 * Parent-Student Registration Form
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { registerParentStudent } from '../../../store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    student_standard: '',
    section: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.student_standard) {
      newErrors.student_standard = 'Grade/standard is required';
    } else {
      const standard = parseInt(formData.student_standard);
      if (isNaN(standard) || standard < 1 || standard > 12) {
        newErrors.student_standard = 'Grade must be between 1 and 12';
      }
    }
    if (!formData.section.trim()) {
      newErrors.section = 'Section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        registerParentStudent({
          parent_name: formData.username,
          parent_email: formData.email,
          parent_password: formData.password,
          student_name: '',
          student_email: '',
          student_password: '',
          student_standard: parseInt(formData.student_standard),
          section: formData.section,
        })
      ).unwrap();
      // Registration successful, user will be redirected by App.tsx
    } catch (err) {
      // Error is handled by Redux
      console.error('Registration failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary p-4">
      <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Student Monitor</h1>
          <p className="text-muted-foreground">Create Your Account</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.username ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.username && (
                <p className="text-destructive text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.email ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.password ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="student_standard" className="block text-sm font-medium mb-2">
                Student Grade/Standard (1-12) *
              </label>
              <input
                id="student_standard"
                name="student_standard"
                type="number"
                min="1"
                max="12"
                value={formData.student_standard}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.student_standard ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.student_standard && (
                <p className="text-destructive text-sm mt-1">{errors.student_standard}</p>
              )}
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium mb-2">
                Section *
              </label>
              <input
                id="section"
                name="section"
                type="text"
                value={formData.section}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.section ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
                placeholder="e.g., A, B, C"
              />
              {errors.section && (
                <p className="text-destructive text-sm mt-1">{errors.section}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-primary hover:underline"
            >
              Already have an account? Login here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
