import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';
import MessagesPage from '@/pages/Messages';
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import Matches from '@/pages/Matches';
import Profile from '@/pages/Profile';

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </main>
      <Toaster />
    </Router>
  );
}

export default App;
