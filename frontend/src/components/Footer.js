import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row>
          {/* About Section */}
          <Col md={4} className="footer-section">
            <h5>About Us</h5>
            <p>
              Our School Management System simplifies the process of managing
              students, teachers, and school operations, making education more
              efficient and accessible.
            </p>
          </Col>

          {/* Quick Links Section */}
          <Col md={4} className="footer-section">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/contact">Contact Us</a>
              </li>
              <li>
                <a href="/privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms">Terms of Service</a>
              </li>
            </ul>
          </Col>

          {/* Contact Section */}
          <Col md={4} className="footer-section">
            <h5>Contact Us</h5>
            <ul className="footer-contact">
              <li>
                <FaMapMarkerAlt /> Startup Enclave, CSIT Campus, Shivaji Nagar,
                Balod Road, Durg, Chhattisgarh 491001
              </li>
              <li>
                <FaPhone />
                +91-9407655717
              </li>
              <li>
                <FaEnvelope />
                contact@zager.in
              </li>
            </ul>
          </Col>
        </Row>

        {/* Social Media Links */}
        <Row className="footer-social">
          <Col className="text-center">
            <a
              href="https://www.facebook.com/zagerdigitalservices"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebookF />
            </a>
            <a href="https://zager.in/" target="_blank" rel="noreferrer">
              <FaTwitter />
            </a>
            <a
              href="https://www.instagram.com/zagerdigitalservices/"
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.linkedin.com/company/zager-digital-service/"
              target="_blank"
              rel="noreferrer"
            >
              <FaLinkedinIn />
            </a>
          </Col>
        </Row>

        {/* Copyright Section */}
        <Row className="text-center mt-4">
          <Col>
            <p>
              &copy; {new Date().getFullYear()} School Management System. All
              rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
