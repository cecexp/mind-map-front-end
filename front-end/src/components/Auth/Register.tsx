import React, { useState } from 'react';
import styled from 'styled-components';
import authService, { PasswordStrength } from '../../services/authService';
import { useUser } from '../../contexts/UserContext';

const AuthContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const AuthCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  
  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const AuthTitle = styled.h1`
  text-align: center;
  color: #1f2937;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 0.75rem;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#4f46e5'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)'};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordStrengthContainer = styled.div`
  margin-top: 0.5rem;
`;

const StrengthBar = styled.div<{ strength: 'weak' | 'medium' | 'strong' }>`
  height: 4px;
  border-radius: 2px;
  background: ${props => {
        switch (props.strength) {
            case 'weak': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'strong': return '#10b981';
            default: return '#e5e7eb';
        }
    }};
  width: ${props => {
        switch (props.strength) {
            case 'weak': return '33%';
            case 'medium': return '66%';
            case 'strong': return '100%';
            default: return '0%';
        }
    }};
  transition: all 0.3s ease;
`;

const StrengthText = styled.div<{ strength: 'weak' | 'medium' | 'strong' }>`
  font-size: 0.75rem;
  margin-top: 0.25rem;
  color: ${props => {
        switch (props.strength) {
            case 'weak': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'strong': return '#10b981';
            default: return '#6b7280';
        }
    }};
  font-weight: 500;
`;

const CriteriaList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
`;

const CriteriaItem = styled.li<{ met: boolean }>`
  color: ${props => props.met ? '#10b981' : '#6b7280'};
  margin-bottom: 0.25rem;
  
  &:before {
    content: ${props => props.met ? '"✓"' : '"○"'};
    margin-right: 0.5rem;
    font-weight: bold;
  }
`;

const SubmitButton = styled.button<{ isLoading?: boolean; disabled?: boolean }>`
  background: ${props => props.isLoading || props.disabled ? '#9ca3af' : '#4f46e5'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.isLoading || props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.isLoading || props.disabled ? '#9ca3af' : '#4338ca'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 0.875rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  font-size: 0.875rem;
  text-align: center;
`;

const AuthLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  
  a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

interface RegisterProps {
    onSuccess: () => void;
    onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
    const { checkAuthStatus } = useUser();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Check password strength in real-time
        if (name === 'password' && value) {
            checkPasswordStrength(value);
        } else if (name === 'password' && !value) {
            setPasswordStrength(null);
        }
    };

    const checkPasswordStrength = async (password: string) => {
        const strength = await authService.checkPasswordStrength(password);
        setPasswordStrength(strength);
    };

    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (!formData.username.trim()) {
            errors.push('Username is required');
        } else if (formData.username.length < 3) {
            errors.push('Username must be at least 3 characters');
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }

        if (!formData.email.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!formData.password) {
            errors.push('Password is required');
        } else if (!passwordStrength?.isValid) {
            errors.push('Password does not meet security requirements');
        }

        if (formData.password !== formData.confirmPassword) {
            errors.push('Passwords do not match');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        setValidationErrors([]);

        console.log('📝 Registration form submitted:', {
            username: formData.username,
            email: formData.email,
            passwordLength: formData.password.length
        });

        if (!validateForm()) {
            setIsLoading(false);
            setError('Please fix the validation errors below');
            return;
        }

        try {
            console.log('📞 Calling authService.register...');
            const result = await authService.register(
                formData.username,
                formData.email,
                formData.password
            );

            console.log('📞 Registration result received:', result);

            if (result.success) {
                console.log('✅ Registration successful');
                setSuccess('🎉 Account created successfully! Welcome to MindMaps!');
                // Update the context with the new user
                await checkAuthStatus();
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                console.log('❌ Registration failed:', result.message);
                setError(result.message || 'Registration failed. Please try again.');
                if (result.errors && Array.isArray(result.errors)) {
                    const errorMessages = result.errors.map((err: any) =>
                        typeof err === 'object' && err.msg ? err.msg : String(err)
                    );
                    setValidationErrors(errorMessages);
                }
            }
        } catch (error: any) {
            console.error('❌ Registration error caught:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(`Error: ${error.message}`);
            } else {
                setError('❌ Network error. Please check your connection and try again.');
            }

            if (error.response?.data?.errors) {
                setValidationErrors(error.response.data.errors.map((err: any) =>
                    typeof err === 'object' && err.msg ? err.msg : String(err)
                ));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const hasValidationErrors = validationErrors.length > 0;

    const isFormValid = () => {
        return (
            formData.username.trim().length >= 3 &&
            formData.email.trim().length > 0 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
            formData.password.length > 0 &&
            passwordStrength?.isValid &&
            formData.password === formData.confirmPassword
        );
    };

    const isButtonDisabled = isLoading || !isFormValid();

    return (
        <AuthContainer>
            <AuthCard>
                <AuthTitle>Join MindMaps</AuthTitle>

                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}
                {hasValidationErrors && (
                    <ErrorMessage>
                        {validationErrors.map((error, index) => (
                            <div key={index}>{error}</div>
                        ))}
                    </ErrorMessage>
                )}

                <AuthForm onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor="username">Username</Label>
                        <Input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required
                            hasError={hasValidationErrors}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            required
                            hasError={hasValidationErrors}
                        />
                    </FormGroup>

                    <FormGroup style={{ position: 'relative' }}>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            required
                            hasError={hasValidationErrors}
                            style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(prev => !prev)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '2.2rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            {showPassword ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10.44-7.5a10.05 10.05 0 0 1 2.13-3.36"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12C2.73 7.11 7.11 3 12 3s9.27 4.11 11 9c-1.73 4.89-6.11 9-11 9S2.73 16.89 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                        </button>

                        {passwordStrength && (
                            <PasswordStrengthContainer>
                                <StrengthBar strength={passwordStrength.strength} />
                                <StrengthText strength={passwordStrength.strength}>
                                    Password strength: {passwordStrength.strength}
                                </StrengthText>
                                <CriteriaList>
                                    <CriteriaItem met={passwordStrength.criteria.minLength}>
                                        At least 8 characters
                                    </CriteriaItem>
                                    <CriteriaItem met={passwordStrength.criteria.hasLowercase}>
                                        One lowercase letter
                                    </CriteriaItem>
                                    <CriteriaItem met={passwordStrength.criteria.hasUppercase}>
                                        One uppercase letter
                                    </CriteriaItem>
                                    <CriteriaItem met={passwordStrength.criteria.hasNumber}>
                                        One number
                                    </CriteriaItem>
                                    <CriteriaItem met={passwordStrength.criteria.hasSpecialChar}>
                                        One special character (@$!%*?&)
                                    </CriteriaItem>
                                </CriteriaList>
                            </PasswordStrengthContainer>
                        )}
                    </FormGroup>

                    <FormGroup style={{ position: 'relative' }}>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                            hasError={hasValidationErrors}
                            style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowConfirmPassword(prev => !prev)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '2.2rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            {showConfirmPassword ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10.44-7.5a10.05 10.05 0 0 1 2.13-3.36"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12C2.73 7.11 7.11 3 12 3s9.27 4.11 11 9c-1.73 4.89-6.11 9-11 9S2.73 16.89 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                        </button>
                    </FormGroup>

                    <SubmitButton
                        type="submit"
                        isLoading={isLoading}
                        disabled={isButtonDisabled}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </SubmitButton>
                </AuthForm>

                <AuthLink>
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
                        Sign in here
                    </a>
                </AuthLink>
            </AuthCard>
        </AuthContainer>
    );
};

export default Register;