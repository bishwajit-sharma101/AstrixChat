// This is a stub file. The actual logic will be implemented next.
const debug = require('debug')('app:auth:service');
// Placeholders for User model and JWT functions
// The path to your User model (corrected path if needed)
const User = require('../user-management/models/user.model'); 
// Assuming token generation logic is here for now
const generateToken = (userId) => {
    // In the real implementation, this will use JWT to sign a token
    debug(`Generating token for user ID: ${userId}`);
    // NOTE: This should be replaced with actual JWT signing logic (e.g., using 'jsonwebtoken' package)
    return 'STUB_JWT_TOKEN_' + userId + '_ExpiresIn_7d'; 
};

/**
 * IMPLEMENTED: Handles user registration logic.
 */
const register = async ({ name, email, password }) => {
    debug(`Attempting to register user: ${email}`);

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        debug(`Registration failed: User with email ${email} already exists.`);
        const error = new Error('User already exists with this email address.');
        error.status = 400; // Bad Request
        throw error;
    }

    // 2. Create the user
    // The pre('save') hook in the User model will automatically hash the password here.
    const user = await User.create({
        name,
        email,
        password,
        // Default values for role and isPublic will be applied by Mongoose
    });

    if (user) {
        debug(`User ${email} created successfully with ID: ${user._id}`);
        
        // 3. Generate token
        const token = generateToken(user._id);
        
        return { user, token };
    } else {
        debug('Registration failed: User creation failed.');
        const error = new Error('Invalid user data provided.');
        error.status = 500; // Internal Server Error
        throw error;
    }
};

/**
 * STUB: Handles user login logic.
 */
/**
 * Handles user login logic.
 */
const login = async (email, password) => {
    // 1. Find user by email AND explicitly select the hidden password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Check if user exists and if password matches
    if (user && (await user.matchPassword(password))) {
        debug(`Login successful for user ${email}`);
        const token = generateToken(user._id);
        
        // Remove password from the user object before returning so it's not sent to frontend
        user.password = undefined; 
        
        return { user, token };
    } else {
        debug(`Login failed: Invalid credentials for ${email}`);
        const error = new Error('Invalid credentials.');
        error.status = 401; // Unauthorized
        throw error;
    }
};

const googleLogin = async (googleData) => {
    const { email, name, picture } = googleData;

    // 1. Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
        // 2. If not, create them (with a random password since they use Google)
        debug(`Creating new Google user: ${email}`);
        user = await User.create({
            name,
            email,
            password: Math.random().toString(36).slice(-16), // Dummy password
            avatar: picture,
            role: 'user'
        });
    }

    // 3. Generate your system token
    const token = generateToken(user._id);
    return { user, token };
};

module.exports = {
    register,
    login,
    googleLogin,
    generateToken,
};