// A simple stub for the rate limiter
const limiter = (req, res, next) => {
    next();
};

module.exports = { limiter };