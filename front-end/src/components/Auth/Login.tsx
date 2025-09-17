import React, { useState } from 'react';
import styled from 'styled-components';
import authService from '../../services/authService';
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
  max-width: 400px;
  
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

const SubmitButton = styled.button<{ isLoading?: boolean }>`
  background: ${props => props.isLoading ? '#9ca3af' : '#4f46e5'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.isLoading ? '#9ca3af' : '#4338ca'};
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

const TwoFactorSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const TwoFactorTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
`;

interface LoginProps {
    onSuccess: () => void;
    onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToRegister }) => {
    const { checkAuthStatus } = useUser();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        twoFactorCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [testStatus, setTestStatus] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        console.log('🔐 Login form submitted:', {
            username: formData.username,
            hasTwoFactor: !!formData.twoFactorCode
        });

        if (!formData.username.trim() || !formData.password.trim()) {
            setError('Please fill in all required fields');
            setIsLoading(false);
            return;
        }

        try {
            console.log('📞 Calling authService.login...');
            const result = await authService.login(
                formData.username,
                formData.password,
                formData.twoFactorCode || undefined
            );

            console.log('📞 Login result received:', result);

            if (result.success) {
                console.log('✅ Login successful, checking auth status...');
                // Trigger a re-check of auth status to update the context
                await checkAuthStatus();
                console.log('✅ Auth status checked, calling onSuccess...');
                onSuccess();
            } else if (result.requiresTwoFactor) {
                console.log('🔐 Two factor required');
                setShowTwoFactor(true);
                setError('');
            } else {
                console.log('❌ Login failed:', result.message);
                setError(result.message || 'Invalid username or password');
            }
        } catch (error: any) {
            console.error('❌ Login error caught:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(`Error: ${error.message}`);
            } else {
                setError('❌ Network error. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContainer>
            <AuthCard>
                <AuthTitle>Welcome Back</AuthTitle>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <AuthForm onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor="username">Username or Email</Label>
                        <Input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username or email"
                            required
                            hasError={!!error}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            hasError={!!error}
                        />
                    </FormGroup>

                    {showTwoFactor && (
                        <TwoFactorSection>
                            <TwoFactorTitle>Two-Factor Authentication</TwoFactorTitle>
                            <FormGroup>
                                <Label htmlFor="twoFactorCode">Verification Code</Label>
                                <Input
                                    type="text"
                                    id="twoFactorCode"
                                    name="twoFactorCode"
                                    value={formData.twoFactorCode}
                                    onChange={handleChange}
                                    placeholder="Enter 6-digit code from your authenticator app"
                                    maxLength={6}
                                    required
                                />
                            </FormGroup>
                        </TwoFactorSection>
                    )}

                    <SubmitButton type="submit" isLoading={isLoading} disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </SubmitButton>

                    {testStatus && <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>{testStatus}</div>}
                </AuthForm>

                <AuthLink>
                    Don't have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
                        Sign up here
                    </a>
                </AuthLink>
            </AuthCard>
        </AuthContainer>
    );
};

export default Login;