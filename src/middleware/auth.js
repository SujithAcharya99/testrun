const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async (req, res, next) => {

    const token = req.headers.cookie.replace('jwt=', '');
    const va = token
    const value = va.split(' ');
    if (value.length === 2) {
        try {
            const size = value[0].length;
            if (size !== 150) {
                const size_2 = value[1].length;
                const newToken = value[1].slice(0, size_2)
                const decoded = jwt.verify(newToken, 'thisismynewcourse')
                const user = await User.findOne({ _id: decoded._id, 'tokens.token': newToken });
                if (!user) {
                    throw new Error();
                }
                req.user = user;
                req.token = newToken
                next();
            } else {
                const newToken = value[0].slice(0, size - 1)
                const decoded = jwt.verify(newToken, 'thisismynewcourse')
                const user = await User.findOne({ _id: decoded._id, 'tokens.token': newToken });
                if (!user) {
                    throw new Error();
                }
                req.user = user;
                req.token = newToken
                next();
            }
        } catch (e) {
            res.status(401).send({ error: 'Please Authenticate...!' });
        }
    } else {
        try {
            const decoded = jwt.verify(token, 'thisismynewcourse')
            const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
            if (!user) {
                throw new Error();
            }
            req.user = user;
            req.token = token
            next();
        } catch (e) {
            res.status(401).send({ error: 'Please Authenticate...!' });
        }
    }
}

module.exports = auth;
