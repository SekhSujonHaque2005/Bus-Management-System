const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-campus-bus');

// Import Models
const User = require('./models/User');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Booking = require('./models/Booking');
const Location = require('./models/Location');
const Schedule = require('./models/Schedule');

const seedDB = async () => {
    try {
        // Clear all existing data
        console.log('Clearing old data...');
        await User.deleteMany();
        await Bus.deleteMany();
        await Route.deleteMany();
        await Booking.deleteMany();
        await Location.deleteMany();
        await Schedule.deleteMany();

        console.log('Inserting seed data...');

        // 1. Create Users (required demo credentials + extras)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const users = await User.insertMany([
            // Required demo users (match frontend demo buttons)
            { name: 'Demo Student', email: 'student@lpu.in', password: hashedPassword, role: 'student' },
            { name: 'Rahul Kumar', email: 'student1@lpu.in', password: hashedPassword, role: 'student' },
            { name: 'Priya Singh', email: 'student2@lpu.in', password: hashedPassword, role: 'student' },
            { name: 'Amit Sharma', email: 'student3@lpu.in', password: hashedPassword, role: 'student' },
            { name: 'Neha Patel', email: 'student4@lpu.in', password: hashedPassword, role: 'student' },
            { name: 'Akhil Verma', email: 'student5@lpu.in', password: hashedPassword, role: 'student' },
            { name: 'Admin User', email: 'admin@lpu.in', password: hashedPassword, role: 'admin' },
            { name: 'Demo Driver', email: 'driver@lpu.in', password: hashedPassword, role: 'driver' },
            { name: 'Driver Harpreet', email: 'driver1@lpu.in', password: hashedPassword, role: 'driver' },
            { name: 'Driver Gurjeet', email: 'driver2@lpu.in', password: hashedPassword, role: 'driver' }
        ]);

        const demoStudent = users.find(u => u.email === 'student@lpu.in');
        const studentIds = users.filter(u => u.role === 'student').slice(0, 5).map(u => u._id);
        const driverIds = users.filter(u => u.role === 'driver').slice(0, 2).map(u => u._id);

        // 2. Create Buses (3 active, with real seat tracking)
        const buses = await Bus.insertMany([
            { busNumber: 'PB08-1234', capacity: 50, seatsAvailable: 35, status: 'active', driver: driverIds[0] },
            { busNumber: 'PB08-5678', capacity: 40, seatsAvailable: 28, status: 'active', driver: driverIds[1] },
            { busNumber: 'PB08-7777', capacity: 60, seatsAvailable: 42, status: 'inactive' }
        ]);

        // 3. Create Routes
        const routes = await Route.insertMany([
            { source: 'Hostel Block A', destination: 'Academic Block', stops: ['Main Gate', 'Library', 'Block 32'] },
            { source: 'Hostel Block B', destination: 'Main Gate', stops: ['Canteen', 'Sports Complex'] },
            { source: 'Mall Road', destination: 'Campus Center', stops: ['Law Gate', 'Block 15'] },
            { source: 'Library', destination: 'Hostel Block A', stops: ['Block 32', 'Canteen'] }
        ]);

        // 4. Create Schedules
        const now = new Date();
        const schedules = await Schedule.insertMany([
            // Morning trips
            { 
                routeId: routes[0]._id, 
                busId: buses[0]._id, 
                departureTime: new Date(now.getTime() + 30 * 60000) // 30 mins from now
            },
            { 
                routeId: routes[1]._id, 
                busId: buses[1]._id, 
                departureTime: new Date(now.getTime() + 45 * 60000) // 45 mins from now
            },
            // Afternoon trips
            { 
                routeId: routes[2]._id, 
                busId: buses[0]._id, 
                departureTime: new Date(now.getTime() + 2 * 60 * 60000) // 2 hours from now
            },
            { 
                routeId: routes[3]._id, 
                busId: buses[1]._id, 
                departureTime: new Date(now.getTime() + 2.5 * 60 * 60000) // 2.5 hours from now
            },
            // Evening trips
            { 
                routeId: routes[0]._id, 
                busId: buses[2]._id, 
                departureTime: new Date(now.getTime() + 4 * 60 * 60000) // 4 hours from now
            }
        ]);

        // 5. Create Bookings (multiple bookings for different students)
        const bookings = await Booking.insertMany([
            // Bus 1 bookings
            { userId: studentIds[0], busId: buses[0]._id, routeId: routes[0]._id, seatNumber: 5, status: 'confirmed' },
            { userId: studentIds[1], busId: buses[0]._id, routeId: routes[0]._id, seatNumber: 8, status: 'confirmed' },
            { userId: studentIds[2], busId: buses[0]._id, routeId: routes[0]._id, seatNumber: 12, status: 'confirmed' },
            { userId: studentIds[3], busId: buses[0]._id, routeId: routes[0]._id, seatNumber: 15, status: 'confirmed' },
            { userId: studentIds[4], busId: buses[0]._id, routeId: routes[1]._id, seatNumber: 3, status: 'confirmed' },
            
            // Bus 2 bookings
            { userId: studentIds[0], busId: buses[1]._id, routeId: routes[1]._id, seatNumber: 7, status: 'confirmed' },
            { userId: studentIds[1], busId: buses[1]._id, routeId: routes[1]._id, seatNumber: 10, status: 'confirmed' },
            { userId: studentIds[2], busId: buses[1]._id, routeId: routes[2]._id, seatNumber: 14, status: 'confirmed' },
            
            // Bus 3 bookings
            { userId: studentIds[3], busId: buses[2]._id, routeId: routes[2]._id, seatNumber: 6, status: 'confirmed' },
            { userId: studentIds[4], busId: buses[2]._id, routeId: routes[3]._id, seatNumber: 20, status: 'confirmed' }
        ]);

        // 6. Create Initial Location Data
        const locations = await Location.insertMany([
            { busId: buses[0]._id, latitude: 31.2560, longitude: 75.7051 },
            { busId: buses[1]._id, latitude: 31.2565, longitude: 75.7055 },
            { busId: buses[2]._id, latitude: 31.2570, longitude: 75.7048 }
        ]);

        console.log('✅ Database successfully seeded!');
        console.log('📊 Data Summary:');
        console.log(`   - ${users.length} Users created (5 students, 1 admin, 2 drivers)`);
        console.log(`   - ${buses.length} Buses created`);
        console.log(`   - ${routes.length} Routes created`);
        console.log(`   - ${schedules.length} Schedules created`);
        console.log(`   - ${bookings.length} Bookings created`);
        console.log(`   - ${locations.length} Initial locations tracked`);
        console.log('\n🔐 Login Credentials:');
        console.log('   Student: student@lpu.in / password123');
        console.log('   Admin: admin@lpu.in / password123');
        console.log('   Driver: driver@lpu.in / password123');
        
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
