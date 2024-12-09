import React from "react";
import { Link } from "react-router-dom";
import { Container, Grid, Box, Button } from "@mui/material";
import Typography from "@mui/material/Typography";
import Carousel from "react-material-ui-carousel";
import "./Home.css"; // Import custom CSS for styling

const Home = () => {
  // Carousel items with title, description, and image for each slide
  const carouselItems = [
    {
      title: "📚 Manage Classes and Teachers",
      description:
        "Easily assign classes, manage teachers, and optimize schedules.",
      image:
        "https://www.iitms.co.in/blog/img/education-management-systems-benefits-features-and-implementation-info-l.webp", // Replace with actual image URL or path
    },
    {
      title: "📝 Track Attendance and Assignments",
      description: "Automate attendance tracking and assignment submissions.",
      image: "attendance.jpg", // Replace with actual image URL or path
    },
    {
      title: "📊 Performance Analytics",
      description:
        "Get insightful performance metrics and improve student outcomes.",
      image: "analytics.jpg", // Replace with actual image URL or path
    },
    {
      title: "💬 Parent-Teacher Communication",
      description:
        "Bridge the gap between parents and teachers with instant communication.",
      image: "communication.jpg", // Replace with actual image URL or path
    },
  ];

  return (
    <Container fluid className="styled-container">
      {/* Carousel for displaying key features with images */}
      <Carousel
        className="carousel"
        indicators={false} // Disables carousel indicators
        autoPlay={true} // Enables automatic sliding
        animation="slide" // Sliding animation for carousel
      >
        {carouselItems.map((item, index) => (
          <Box key={index} className="carousel-item">
            {/* Carousel image */}
            <img src={item.image} alt={item.title} className="carousel-image" />

            {/* Carousel title */}
            <Typography variant="h4" gutterBottom className="carousel-title">
              {item.title}
            </Typography>

            {/* Carousel description */}
            <Typography variant="body1" className="carousel-description">
              {item.description}
            </Typography>
          </Box>
        ))}
      </Carousel>

      {/* Grid container for Welcome Section and Feature List */}
      <Grid container spacing={4} alignItems="center" justifyContent="center">
        {/* Left Section: Welcome Message and Description */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Main heading */}
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              className="heading"
            >
              Welcome to <br />
              Zager Management System
            </Typography>

            {/* Brief system description */}
            <Typography variant="body1" paragraph className="description">
              Streamline school operations, enhance communication, and simplify
              learning. From managing schedules to tracking performance, our
              system has everything your school needs.
            </Typography>

            {/* Login button */}
            <div className="button-container">
              <Button
                component={Link} // Links button to sign-in page
                to="/signin"
                variant="contained"
                color="secondary"
                className="action-button"
              >
                Login
              </Button>
            </div>
          </Box>
        </Grid>

        {/* Right Section: Feature List */}
        <Grid item xs={12} md={6}>
          <ul className="feature-list">
            {/* List of system features */}
            <li className="feature-item">📚 Manage Classes and Teachers</li>
            <li className="feature-item">
              📝 Track Attendance and Assignments
            </li>
            <li className="feature-item">📊 Performance Analytics</li>
            <li className="feature-item">💬 Parent-Teacher Communication</li>
            <li className="feature-item">🔔 Instant Notifications</li>
            <li className="feature-item">
              💼 Admin Dashboard for Full Control
            </li>
          </ul>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
