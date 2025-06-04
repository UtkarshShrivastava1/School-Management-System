require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/AdminModel');

console.log('Starting admin account creation...');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagementSystem')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if admin already exists
      const adminExists = await Admin.findOne({ adminID: 'ADM1234' });
      
      if (adminExists) {
        console.log('Admin already exists:', adminExists.adminID);
        mongoose.connection.close();
        return;
      }
      
      // Create admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin@123', salt);
      
      const newAdmin = new Admin({
        name: 'Admin User',
        email: 'admin@school.com',
        phone: '9876543210',
        designation: 'System Administrator',
        address: '123 School Street, City',
        dob: new Date('1990-01-01'),
        gender: 'Male',
        religion: 'Hindu',
        category: 'General',
        bloodgroup: 'O+',
        department: 'Administration',
        role: 'admin',
        adminID: 'ADM1234',
        password: hashedPassword,
        emergencyContact: {
          name: 'Emergency Contact',
          relation: 'Relative',
          phone: '9876543211'
        },
        experience: 5,
        highestQualification: 'M.Tech',
        AADHARnumber: '123456789012',
        actionHistory: ['Account created'],
        registeredBy: {
          adminID: 'SYSTEM',
          name: 'System'
        }
      });
      
      const savedAdmin = await newAdmin.save();
      console.log('Admin created successfully:', savedAdmin.adminID);
      console.log('Admin ID:', savedAdmin._id);
      console.log('Login credentials:');
      console.log('ID: ADM1234');
      console.log('Password: admin@123');
    } catch (error) {
      console.error('Error creating admin:', error);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 