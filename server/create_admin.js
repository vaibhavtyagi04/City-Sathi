const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const email = process.argv[2];

if (!email) {
    console.log('Please provide an email address. Usage: node create_admin.js <email>');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/csapp')
    .then(async () => {
        console.log('MongoDB connected');
        try {
            const user = await User.findOne({ email });
            if (!user) {
                console.log(`User with email ${email} not found.`);
                process.exit(1);
            }

            user.role = 'admin';
            await user.save();
            console.log(`User ${user.fullName} (${email}) is now an ADMIN.`);
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
