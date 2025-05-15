import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/SiteLogo';
import Input from '../../components/Input';
import MotionDiv from '../../components/MotionDiv';
import MotionButton from '../../components/MotionButton';
import axios from 'axios';

const AdminLoginPage = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleOnChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/api/v1/admin/login', form, { withCredentials: true });
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen hero-bg">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Logo />
      </header>
      <MotionDiv className="flex items-center justify-center mt-12 mx-3">
        <div className="w-full max-w-md px-16 py-10 space-y-6 bg-black/70 rounded-lg shadow-md mb-12">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">Admin Login</h1>
          <form className="space-y-4" onSubmit={handleOnSubmit}>
            <Input
              icon={User}
              type="text"
              name="username"
              placeholder="Admin Username"
              autoFocus={true}
              autoComplete="on"
              onChange={handleOnChange}
            />
            <Input
              icon={Lock}
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="on"
              onChange={handleOnChange}
            />
            <MotionButton type="submit" disabled={isLoading}>
              {isLoading ? <Loader className="size-6 animate-spin mx-auto" /> : 'Login'}
            </MotionButton>
          </form>
        </div>
      </MotionDiv>
    </div>
  );
};

export default AdminLoginPage;
