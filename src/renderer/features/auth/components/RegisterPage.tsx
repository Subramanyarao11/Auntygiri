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
    parent_name: '',
    parent_email: '',
    parent_password: '',
    student_name: '',
    student_email: '',
    student_password: '',
    student_standard: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Parent validations
    if (!formData.parent_name.trim()) {
      newErrors.parent_name = 'Parent name is required';
    }
    if (!formData.parent_email.trim()) {
      newErrors.parent_email = 'Parent email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      newErrors.parent_email = 'Invalid email format';
    }
    if (!formData.parent_password) {
      newErrors.parent_password = 'Parent password is required';
    } else if (formData.parent_password.length < 6) {
      newErrors.parent_password = 'Password must be at least 6 characters';
    }

    // Student validations
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Student name is required';
    }
    if (!formData.student_email.trim()) {
      newErrors.student_email = 'Student email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.student_email)) {
      newErrors.student_email = 'Invalid email format';
    }
    if (!formData.student_password) {
      newErrors.student_password = 'Student password is required';
    } else if (formData.student_password.length < 6) {
      newErrors.student_password = 'Password must be at least 6 characters';
    }
    if (!formData.student_standard) {
      newErrors.student_standard = 'Student grade/standard is required';
    } else {
      const standard = parseInt(formData.student_standard);
      if (isNaN(standard) || standard < 1 || standard > 12) {
        newErrors.student_standard = 'Grade must be between 1 and 12';
      }
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
          ...formData,
          student_standard: parseInt(formData.student_standard),
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
          <p className="text-muted-foreground">Create Parent & Student Accounts</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Parent Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Parent Information</h2>

            <div>
              <label htmlFor="parent_name" className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                id="parent_name"
                name="parent_name"
                type="text"
                value={formData.parent_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.parent_name ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.parent_name && (
                <p className="text-destructive text-sm mt-1">{errors.parent_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="parent_email" className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                id="parent_email"
                name="parent_email"
                type="email"
                value={formData.parent_email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.parent_email ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.parent_email && (
                <p className="text-destructive text-sm mt-1">{errors.parent_email}</p>
              )}
            </div>

            <div>
              <label htmlFor="parent_password" className="block text-sm font-medium mb-2">
                Password *
              </label>
              <input
                id="parent_password"
                name="parent_password"
                type="password"
                value={formData.parent_password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.parent_password ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.parent_password && (
                <p className="text-destructive text-sm mt-1">{errors.parent_password}</p>
              )}
            </div>
          </div>

          {/* Student Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Student Information</h2>

            <div>
              <label htmlFor="student_name" className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                id="student_name"
                name="student_name"
                type="text"
                value={formData.student_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.student_name ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.student_name && (
                <p className="text-destructive text-sm mt-1">{errors.student_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="student_email" className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                id="student_email"
                name="student_email"
                type="email"
                value={formData.student_email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.student_email ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.student_email && (
                <p className="text-destructive text-sm mt-1">{errors.student_email}</p>
              )}
            </div>

            <div>
              <label htmlFor="student_password" className="block text-sm font-medium mb-2">
                Password *
              </label>
              <input
                id="student_password"
                name="student_password"
                type="password"
                value={formData.student_password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.student_password ? 'border-destructive' : 'border-input'
                } bg-background focus:outline-none focus:ring-2 focus:ring-ring`}
              />
              {errors.student_password && (
                <p className="text-destructive text-sm mt-1">{errors.student_password}</p>
              )}
            </div>

            <div>
              <label htmlFor="student_standard" className="block text-sm font-medium mb-2">
                Grade/Standard (1-12) *
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Accounts...' : 'Create Accounts'}
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
