import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import AudioEditor from './components/AudioEditor';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserAudios from './components/UserAudios';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

// Create a calm, family-friendly theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4FC3F7', // Soft blue
    },
    secondary: {
      main: '#81C784', // Soft green
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E3440',
      secondary: '#5E6B7D',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#2E3440',
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ 
            minHeight: '100vh', 
            backgroundColor: theme.palette.background.default 
          }}>
            <Navbar />
            <Box sx={{ pt: 8 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/editor" element={<AudioEditor />} />
                <Route path="/login" element={<Login />} />
                <Route path="/my-audios" element={<UserAudios />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
