const bcrypt = require('bcrypt');
const { Utilizator } = require('../clase');
const express = require('express');
const { generareToken } = require('./utileAutentificare');
const app = express.Router();

app.post('/signup', async (req, res, next) => {
    try {
        const { nume, prenume, email, parola, rol } = req.body;
        const existingUser = await Utilizator.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Utilizatorul exista deja!" });
        }
        // criptarea parolei
        const hashedPassword = await bcrypt.hash(parola, 10);
        const newUser = await Utilizator.create({ nume, prenume, email, rol, parola: hashedPassword });
        return res.status(200).json({ message: "Inregistrat!", newUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

app.post('/login', async (req, res, next) => {
    try {
        const {  email, parola } = req.body;
        const user = await Utilizator.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Adresa de e-mail nu exista." });
        }
        const passwordMatch = await bcrypt.compare(parola, user.parola);
        if (!passwordMatch) {
            return res.status(403).json({ message: "Parola incorecta." });
        }
        const token = generareToken(user);
        return res.status(200).json({ message: "Autentificat!", token });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = app;