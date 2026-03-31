const axios = require('axios');

async function testAuth() {
    const API_URL = 'http://localhost:5005/api/auth';
    const testUser = {
        fullName: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
    };

    console.log("--- Testing Auth System ---");

    try {
        // 1. Register
        console.log("Registering user...");
        const regRes = await axios.post(`${API_URL}/register`, testUser);
        console.log("✅ Registration Successful. Token received:", regRes.data.token ? "Yes" : "No");

        // 2. Login
        console.log("Logging in user...");
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log("✅ Login Successful. Token received:", loginRes.data.token ? "Yes" : "No");
        console.log("User Role:", loginRes.data.user.role);

        // 3. Test Invalid Login
        console.log("Testing invalid password...");
        try {
            await axios.post(`${API_URL}/login`, {
                email: testUser.email,
                password: 'wrongpassword'
            });
        } catch (err) {
            console.log("✅ Invalid login rejected correctly:", err.response?.data?.msg || err.message);
        }

    } catch (err) {
        console.error("❌ Test Failed:", err.response?.data || err.message);
    }
}

testAuth();
