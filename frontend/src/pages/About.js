import React from "react";
import { Container, Grid, Box, Typography } from "@mui/material";
import "./About.css"; // Import About-specific CSS

const About = () => {
  return (
    <Container className="about-container">
      {/* Section: About Zager Management System */}
      <Box className="about-header">
        <Typography variant="h2" className="about-title">
          About Zager Management System
        </Typography>
        <Typography variant="body1" className="about-description">
          The **Zager Management System** is an all-in-one solution designed to
          streamline school operations, improve communication, and simplify
          administrative tasks. Our platform offers advanced features to enhance
          efficiency for administrators, teachers, students, and parents.
        </Typography>
      </Box>

      {/* Section: Key Features */}
      <Grid container spacing={4} className="about-features">
        <Grid item xs={12} md={6} className="feature-card">
          <Typography variant="h5" className="feature-title">
            📚 Manage Classes & Teachers
          </Typography>
          <Typography variant="body1" className="feature-description">
            Assign classes, manage faculty, and optimize timetables with ease.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} className="feature-card">
          <Typography variant="h5" className="feature-title">
            📝 Attendance & Assignments
          </Typography>
          <Typography variant="body1" className="feature-description">
            Automated tracking ensures efficient attendance and assignment
            management.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} className="feature-card">
          <Typography variant="h5" className="feature-title">
            📊 Performance Analytics
          </Typography>
          <Typography variant="body1" className="feature-description">
            Gain insights into student performance to drive better academic
            outcomes.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} className="feature-card">
          <Typography variant="h5" className="feature-title">
            💬 Parent-Teacher Communication
          </Typography>
          <Typography variant="body1" className="feature-description">
            Real-time messaging keeps parents and teachers connected.
          </Typography>
        </Grid>
      </Grid>

      {/* Section: Our Mission */}
      <Box className="about-mission">
        <Typography variant="h4" className="mission-title">
          🎯 Our Mission
        </Typography>
        <Typography variant="body1" className="mission-description">
          With ZMS, our goal is to ""empower educational institutions""" with a
          powerful, user-friendly, and efficient system that bridges the gap
          between administration, faculty, students, and parents.
        </Typography>
      </Box>
    </Container>
  );
};

export default About;
