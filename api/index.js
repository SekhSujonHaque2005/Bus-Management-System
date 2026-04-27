try {
    const app = require('./server.js');
    module.exports = app;
} catch (error) {
    module.exports = (req, res) => {
        res.status(500).json({
            error: "Initialization Error",
            message: error.message,
            stack: error.stack
        });
    };
}
