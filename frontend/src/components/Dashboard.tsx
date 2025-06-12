import React from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
} from "@mui/material";
import {
  AudioFile,
  RecordVoiceOver,
  EditNote,
  VolumeUp,
  Security,
  FamilyRestroom,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <RecordVoiceOver sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Speech-to-Text",
      description:
        "Convert spoken words in audio files into text format for easy identification.",
      color: "#E3F2FD",
    },
    {
      icon: <EditNote sx={{ fontSize: 40, color: "secondary.main" }} />,
      title: "Smart Word Replacement",
      description:
        "Analyze and understand context to accurately identify target words for replacement.",
      color: "#E8F5E8",
    },
    {
      icon: <VolumeUp sx={{ fontSize: 40, color: "warning.main" }} />,
      title: "Audio Editing",
      description:
        "Professional-grade audio editing tools with word replacement and sound insertion.",
      color: "#FFF3E0",
    },
    {
      icon: <Security sx={{ fontSize: 40, color: "error.main" }} />,
      title: "Content Filtering",
      description:
        "Advanced content filtering to create a safer internet environment for children.",
      color: "#FFEBEE",
    },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/editor");
    } else {
      navigate("/login");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #E3F2FD 0%, #E8F5E8 100%)",
          borderRadius: 3,
          p: 6,
          textAlign: "center",
          mb: 6,
        }}
      >
        <FamilyRestroom sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          Listen & Change
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
        >
          Create a family-friendly internet environment by identifying and
          replacing inappropriate words in audio files with suitable
          alternatives.
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Chip label="Family Safe" color="primary" />
          <Chip label="Easy to Use" color="secondary" />
          <Chip label="Professional Quality" color="default" />
        </Box>

        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForward />}
          onClick={handleGetStarted}
          sx={{
            mt: 4,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            fontSize: "1.1rem",
          }}
        >
          {isAuthenticated ? "Go to Editor" : "Get Started"}
        </Button>
      </Paper>
      {/* Features Section */}
      <Typography
        variant="h4"
        component="h2"
        align="center"
        gutterBottom
        sx={{ mb: 4, fontWeight: 600 }}
      >
        Powerful Features
      </Typography>{" "}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid sx={{ xs: 12, md: 6 }} key={index}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                borderRadius: 2,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    backgroundColor: feature.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* How It Works Section */}
      <Paper
        elevation={1}
        sx={{ p: 4, borderRadius: 3, backgroundColor: "grey.50" }}
      >
        <Typography
          variant="h4"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 4, fontWeight: 600 }}
        >
          How It Works
        </Typography>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid sx={{ xs: 12, md: 3, textAlign: "center" }}>
            <AudioFile sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              1. Upload Audio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your audio file to our secure platform
            </Typography>{" "}
          </Grid>

          <Grid sx={{ xs: 12, md: 3, textAlign: "center" }}>
            <RecordVoiceOver
              sx={{ fontSize: 50, color: "secondary.main", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              2. Analyze Content
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI analyzes speech and identifies words to replace
            </Typography>{" "}
          </Grid>

          <Grid sx={{ xs: 12, md: 3, textAlign: "center" }}>
            <EditNote sx={{ fontSize: 50, color: "warning.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              3. Select Replacements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose family-friendly alternatives for flagged words
            </Typography>{" "}
          </Grid>

          <Grid sx={{ xs: 12, md: 3, textAlign: "center" }}>
            <VolumeUp sx={{ fontSize: 50, color: "error.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              4. Download Result
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get your clean, family-friendly audio file
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;
