import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { AudioFile, Home, Login, Logout, LibraryMusic } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: 'primary.main',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          <AudioFile />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          Listen & Change
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Home />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          
          {isAuthenticated && (
            <>
              <Button
                color="inherit"
                startIcon={<AudioFile />}
                onClick={() => navigate('/editor')}
              >
                Editor
              </Button>
              
              <Button
                color="inherit"
                startIcon={<LibraryMusic />}
                onClick={() => navigate('/my-audios')}
              >
                My Audios
              </Button>
            </>
          )}

          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                Welcome, {user?.name}
              </Typography>
              <Button
                color="inherit"
                startIcon={<Logout />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <Button
              color="inherit"
              startIcon={<Login />}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
