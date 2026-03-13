const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).send({ message: 'Not authorized now' });
    }

    try {
        const decoded = jwt.verify(token, 'secretKey');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).send({ message: 'Not authorized' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, admin };
