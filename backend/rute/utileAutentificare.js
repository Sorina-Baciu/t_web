const jwt = require('jsonwebtoken');

const secret = 'secret_key';

const generareToken = user => {
    return jwt.sign({ id: user.id, email: user.email, rol: user.rol }, secret, {
        expiresIn: '3h',
    });
}

const autorizare = (req, res, next) => {
    const token = req.header('Authorization');
    if (token == null)
        return res.status(401).json({ message: 'Utilizator neautentificat.' });
    try {
        const decriptat = jwt.verify(token, secret);
        req.id = decriptat.id;
        req.rol = decriptat.rol;
        next();
    } catch (e) {
        return res.status(403).json({ message: 'Eroare: ' + e.message });
    }
};

module.exports = {
    generareToken, autorizare
}