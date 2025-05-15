import { useState } from 'react';
import { Loader, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/SiteLogo';
import MotionDiv from '../../components/MotionDiv';
import MotionButton from '../../components/MotionButton';
import axios from 'axios';

const AdminDashboardPage = () => {
  const [tmdbId, setTmdbId] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTmdbIdChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setTmdbId(value);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!tmdbId || !file) {
      toast.error('Please provide TMDB ID and select a video file.');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('tmdbId', tmdbId);
      formData.append('video', file);

      await axios.post('/api/v1/admin/upload', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Video uploaded successfully!');
      setTmdbId('');
      setFile(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen hero-bg">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Logo />
        <span className="text-white font-bold text-lg">Admin Panel</span>
      </header>
      <MotionDiv className="flex items-center justify-center mt-12 mx-3">
        <div className="w-full max-w-md px-10 py-10 space-y-6 bg-black/70 rounded-lg shadow-md mb-12">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">Upload Movie/TV Trailer</h1>
          <form className="space-y-4" onSubmit={handleUpload}>
            <input
              type="text"
              name="tmdbId"
              placeholder="TMDB ID (e.g. 603)"
              value={tmdbId}
              onChange={handleTmdbIdChange}
              className="w-full py-3 px-4 border border-gray-500 rounded-lg bg-transparent text-white focus:outline-none focus:ring"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
            />
            <input
              type="file"
              name="video"
              accept="video/mp4,video/webm,video/mov"
              onChange={handleFileChange}
              className="w-full py-2 px-2 border border-gray-500 rounded-lg bg-transparent text-white focus:outline-none focus:ring"
              required
            />
            <MotionButton type="submit" disabled={isUploading}>
              {isUploading ? <Loader className="size-6 animate-spin mx-auto" /> : <><Upload className="inline mr-2" />Upload</>}
            </MotionButton>
          </form>
        </div>
      </MotionDiv>
    </div>
  );
};

export default AdminDashboardPage;
