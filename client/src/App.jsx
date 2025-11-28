import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/authPages/Signup';
import Signin from './pages/authPages/Signin';
import Chat from './pages/chatPage/Chat';
import LandingPage from './pages/landing/LandingPage';
// Small wrapper to protect /chat route


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default route → Signup */}
        <Route path="/signup" element={<Signup />} />
         <Route path="/" element={<LandingPage />} />
        {/* Login page */}
        <Route path="/signin" element={<Signin />} />

        {/* Protected Chat Page */}
        <Route
          path="/chat" element={<Chat />}/>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
