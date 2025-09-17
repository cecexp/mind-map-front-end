import React, { useState } from 'react';
import styled from 'styled-components';
import authService, { User } from '../../services/authService';

const ProfileContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin: 2rem 0;
`;

const ProfileTitle = styled.h2`
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`;

const ProfileSection = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const InfoLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #1f2937;
`;

const StatusBadge = styled.span<{ status: 'enabled' | 'disabled' | 'verified' | 'unverified' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
        switch (props.status) {
            case 'enabled':
            case 'verified':
                return '#d1fae5';
            case 'disabled':
            case 'unverified':
                return '#fef3c7';
            default:
                return '#f3f4f6';
        }
    }};
  color: ${props => {
        switch (props.status) {
            case 'enabled':
            case 'verified':
                return '#065f46';
            case 'disabled':
            case 'unverified':
                return '#92400e';
            default:
                return '#374151';
        }
    }};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  ${props => {
        switch (props.variant) {
            case 'primary':
                return `
          background: #4f46e5;
          color: white;
          &:hover { background: #4338ca; }
        `;
            case 'danger':
                return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
            default:
                return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
        }
    }}
`;

const QRCodeContainer = styled.div`
  text-align: center;
  margin: 1rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
`;

const QRCodeImage = styled.img`
  max-width: 200px;
  height: auto;
  margin: 1rem 0;
`;

const SecretKey = styled.div`
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin: 0 0.5rem;
  width: 120px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 0.875rem;
  margin: 1rem 0;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  font-size: 0.875rem;
  margin: 1rem 0;
`;

interface UserProfileProps {
    user: User;
    onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
    const [twoFactorData, setTwoFactorData] = useState<any>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSetupTwoFactor = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await authService.setupTwoFactor();
            if (result.success) {
                setTwoFactorData(result.data);
                setShowTwoFactorSetup(true);
            } else {
                setError(result.message || 'Failed to setup two-factor authentication');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyTwoFactor = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a 6-digit verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await authService.verifyTwoFactor(verificationCode);
            if (result.success) {
                setMessage('Two-factor authentication enabled successfully!');
                setShowTwoFactorSetup(false);
                setTwoFactorData(null);
                setVerificationCode('');
                // Refresh user data
                window.location.reload();
            } else {
                setError(result.message || 'Invalid verification code');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisableTwoFactor = async () => {
        if (!disablePassword) {
            setError('Please enter your password to disable two-factor authentication');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await authService.disableTwoFactor(disablePassword);
            if (result.success) {
                setMessage('Two-factor authentication disabled successfully!');
                setDisablePassword('');
                // Refresh user data
                window.location.reload();
            } else {
                setError(result.message || 'Failed to disable two-factor authentication');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProfileContainer>
            <ProfileTitle>User Profile</ProfileTitle>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {message && <SuccessMessage>{message}</SuccessMessage>}

            <ProfileSection>
                <SectionTitle>Account Information</SectionTitle>

                <InfoItem>
                    <InfoLabel>Username:</InfoLabel>
                    <InfoValue>{user.username}</InfoValue>
                </InfoItem>

                <InfoItem>
                    <InfoLabel>Email:</InfoLabel>
                    <InfoValue>{user.email}</InfoValue>
                </InfoItem>

                <InfoItem>
                    <InfoLabel>Email Status:</InfoLabel>
                    <StatusBadge status={user.isEmailVerified ? 'verified' : 'unverified'}>
                        {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </StatusBadge>
                </InfoItem>

                <InfoItem>
                    <InfoLabel>Member Since:</InfoLabel>
                    <InfoValue>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </InfoValue>
                </InfoItem>
            </ProfileSection>

            <ProfileSection>
                <SectionTitle>Two-Factor Authentication</SectionTitle>

                <InfoItem>
                    <InfoLabel>Status:</InfoLabel>
                    <StatusBadge status={user.twoFactorEnabled ? 'enabled' : 'disabled'}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </StatusBadge>
                </InfoItem>

                {!user.twoFactorEnabled && !showTwoFactorSetup && (
                    <InfoItem>
                        <InfoLabel>Enhance your account security with two-factor authentication</InfoLabel>
                        <Button
                            variant="primary"
                            onClick={handleSetupTwoFactor}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Setting up...' : 'Enable 2FA'}
                        </Button>
                    </InfoItem>
                )}

                {showTwoFactorSetup && twoFactorData && (
                    <div>
                        <QRCodeContainer>
                            <p>Scan this QR code with your authenticator app:</p>
                            <QRCodeImage src={twoFactorData.qrCode} alt="2FA QR Code" />
                            <p>Or enter this secret key manually:</p>
                            <SecretKey>{twoFactorData.secret}</SecretKey>
                            <p>Then enter the 6-digit code from your app:</p>
                            <Input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                            />
                            <Button
                                variant="primary"
                                onClick={handleVerifyTwoFactor}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowTwoFactorSetup(false);
                                    setTwoFactorData(null);
                                    setVerificationCode('');
                                }}
                                style={{ marginLeft: '0.5rem' }}
                            >
                                Cancel
                            </Button>
                        </QRCodeContainer>
                    </div>
                )}

                {user.twoFactorEnabled && (
                    <InfoItem>
                        <InfoLabel>Enter your password to disable 2FA:</InfoLabel>
                        <div>
                            <Input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Password"
                            />
                            <Button
                                variant="danger"
                                onClick={handleDisableTwoFactor}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Disabling...' : 'Disable 2FA'}
                            </Button>
                        </div>
                    </InfoItem>
                )}
            </ProfileSection>

            <ProfileSection>
                <SectionTitle>Account Actions</SectionTitle>

                <InfoItem>
                    <InfoLabel>Sign out of your account</InfoLabel>
                    <Button variant="secondary" onClick={onLogout}>
                        Sign Out
                    </Button>
                </InfoItem>
            </ProfileSection>
        </ProfileContainer>
    );
};

export default UserProfile;