import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page as registration is automatic via OTP
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

export default RegisterPage;
