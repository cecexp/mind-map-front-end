import React from 'react';
import { useUser } from '../../contexts/UserContext';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
`;

const UserEmail = styled.p`
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.9rem;
`;

const StatusBadge = styled.span<{ verified: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => props.verified ? '#d4edda' : '#f8d7da'};
  color: ${props => props.verified ? '#155724' : '#721c24'};
  margin-left: 10px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const WelcomeMessage = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  margin: 0 0 10px 0;
  font-size: 1.8rem;
`;

const WelcomeSubtitle = styled.p`
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
`;

interface UserDashboardProps {
    mapsCount: number;
    lastLoginFormatted?: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
    mapsCount,
    lastLoginFormatted
}) => {
    const { user } = useUser();

    if (!user) {
        return null;
    }

    // Generate avatar initials
    const getInitials = (username: string) => {
        return username.substring(0, 2).toUpperCase();
    };

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate days since joining
    const getDaysSinceJoining = () => {
        if (!user.createdAt) return 0;
        const joinDate = new Date(user.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - joinDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <>
            <WelcomeMessage>
                <WelcomeTitle>¡Bienvenido, {user.username}!</WelcomeTitle>
                <WelcomeSubtitle>
                    Este es tu dashboard personal con tus mapas mentales
                </WelcomeSubtitle>
            </WelcomeMessage>

            <DashboardContainer>
                <UserInfo>
                    <Avatar>
                        {getInitials(user.username)}
                    </Avatar>
                    <UserDetails>
                        <UserName>
                            {user.username}
                            <StatusBadge verified={user.isEmailVerified}>
                                {user.isEmailVerified ? 'Verificado' : 'No verificado'}
                            </StatusBadge>
                            {user.twoFactorEnabled && (
                                <StatusBadge verified={true}>2FA Activo</StatusBadge>
                            )}
                        </UserName>
                        <UserEmail>{user.email}</UserEmail>
                    </UserDetails>
                </UserInfo>

                <StatsContainer>
                    <StatCard>
                        <StatValue>{mapsCount}</StatValue>
                        <StatLabel>Mapas Mentales</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>{getDaysSinceJoining()}</StatValue>
                        <StatLabel>Días como miembro</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>{formatDate(user.createdAt)}</StatValue>
                        <StatLabel>Miembro desde</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>{lastLoginFormatted || formatDate(user.lastActivity)}</StatValue>
                        <StatLabel>Última actividad</StatLabel>
                    </StatCard>
                </StatsContainer>
            </DashboardContainer>
        </>
    );
};

export default UserDashboard;