import mongoose from 'mongoose';
// REMOVE bcrypt import, you don't need it here anymore
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import { connectDatabase } from '../config/database.js';

dotenv.config();

const seedMasterAdmin = async () => {
  try {
    await connectDatabase();

    const email = 'master@khuza.com';
    const password = 'SecurePassword123!'; 
    const name = 'Master Admin';

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists. Deleting and re-seeding to fix hash...');
      await Admin.deleteOne({ email }); // Delete old broken hash
    }

    // PASS THE PLAIN PASSWORD. 
    // The Admin.ts pre-save hook will hash it correctly ONCE.
    await Admin.create({
      name,
      email,
      password, // <--- Plain text goes here
      role: 'super_admin',
      isActive: true,
    });

    console.log(`
    ✅ Master Admin created successfully!
    📧 Email: ${email}
    🔑 Password: ${password}
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedMasterAdmin();