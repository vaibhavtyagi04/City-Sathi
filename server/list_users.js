const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const User = require('./models/User');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/csapp';
console.log('Connecting to MongoDB at:', uri);

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected. Fetching users...');
        const users = await User.find({}, 'email fullName role');
        console.log('Existing Users:');
        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            console.log(JSON.stringify(users, null, 2));
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
