require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/AdminModel');

async function checkAdminAccount() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if ADM0001 admin exists
    const admin = await Admin.findOne({ adminID: 'ADM0001' });
    
    if (admin) {
      console.log('Found existing admin account:', admin.adminID);
      
      // Check if actionHistory exists
      let modified = false;
      
      if (!admin.actionHistory) {
        console.log('Adding missing actionHistory array');
        admin.actionHistory = [];
        modified = true;
      }
      
      // Check for other required fields
      if (!admin.loginHistory) {
        console.log('Adding missing loginHistory array');
        admin.loginHistory = [];
        modified = true;
      }
      
      // Save if modifications were made
      if (modified) {
        await admin.save();
        console.log('Admin account updated with missing fields');
      } else {
        console.log('Admin account has all required fields');
      }
      
      console.log('Admin account details:');
      console.log('- ID:', admin._id);
      console.log('- adminID:', admin.adminID);
      console.log('- Name:', admin.name);
      console.log('- Email:', admin.email);
      console.log('- Has Password:', !!admin.password);
      console.log('- Has actionHistory:', Array.isArray(admin.actionHistory));
      console.log('- Has loginHistory:', Array.isArray(admin.loginHistory));
    } else {
      console.log('Admin account ADM0001 not found. Creating default admin account...');
      
      // Create a default admin
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      
      const newAdmin = new Admin({
        name: 'Admin',
        email: 'admin@school.com',
        phone: '1234567890',
        designation: 'System Administrator',
        address: 'School Address',
        dob: new Date('1990-01-01'),
        gender: 'Male',
        department: 'Administration',
        adminID: 'ADM0001',
        password: hashedPassword,
        religion: 'Not Specified',
        category: 'General',
        bloodgroup: 'Not Specified',
        role: 'admin',
        actionHistory: [],
        loginHistory: [],
        registeredBy: {
          adminID: 'System',
          name: 'System'
        }
      });
      
      await newAdmin.save();
      console.log('Default admin account created with adminID: ADM0001');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkAdminAccount(); 