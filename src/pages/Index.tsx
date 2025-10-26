import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinear } from '@/contexts/LinearContext';
import { ConnectLinear } from '@/components/auth/ConnectLinear';

const Index = () => {
  const { isConnected } = useLinear();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  return <ConnectLinear />;
};

export default Index;
