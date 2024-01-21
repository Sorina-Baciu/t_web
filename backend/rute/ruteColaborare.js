const express = require('express');
const { Utilizator, Colaborare} = require('../clase');
const { autorizare } = require('./utileAutentificare');
const { Op } = require('sequelize');

const app = express.Router();

// Ruta pentru crearea unei colaborari 
app.post('/', autorizare, async (req, res) => {
    const { profesorId } = req.body;
    const studentId = req.id;
    try {
        // Doar studentul poate lansa solicitare, asa ca verific daca el este cel autentificat:
        if (req.rol !== 'student' || req.id !== studentId) {
            return res.status(403).json({ message: 'Utilizatorul nu este student sau nu este cel autentificat.' });
        }
        // Verificare daca utilizatorii exista si au rolurile corespunzatoare
        const student = await Utilizator.findOne({ where: { id: studentId, rol: 'student' } });
        const profesor = await Utilizator.findOne({ where: { id: profesorId, rol: 'profesor' } });
        if (!student || !profesor) {
            return res.status(404).json({ message: 'Utilizatorul student sau profesor nu a fost gasit sau nu are rolul corect.' });
        }
        // Verificare daca studentul are deja o colaborare acceptata
        const colaborareAcceptata = await Colaborare.findOne({
            where: { studentId }
        });

        if (colaborareAcceptata && colaborareAcceptata.status >= 1) { //-1 asteapta raspuns 
            // 0 - respins, 1 = acceptata, 2 = cerere semnata/retrimisa, 3 - cerere trimisa si refuzata de prof
            return res.status(400).json({ message: 'Studentul are deja o colaborare acceptata.' });
        }

        const colaborareTrimisa = await Colaborare.findOne({
            where: { studentId, profesorId }, 
        });

        if (colaborareTrimisa) {
            return res.status(400).json({ message: 'Studentul are deja o colaborare trimisa acestui profesor.' });
        }
        // Verific locurile libere si daca exista o sesiune curenta a profesorului in desfasurare
        const sesiuneCurentaProfesor = await profesor.getSesiuni({where: {
            dataInceput: { [Op.lte]: new Date() }, 
            dataSfarsit: { [Op.gte]: new Date() }, 
        }});
        if (!sesiuneCurentaProfesor.length > 0) {
            return res.status(400).json({ message: 'Profesorul nu are o sesiune in desfasurare.' });
        }
        const colaborariStudent = await Colaborare.findAll({ where: { studentId, profesorId, status: 1 } });
        const numarColaborariStudent = colaborariStudent.length;

        if (numarColaborariStudent >= sesiuneCurentaProfesor.capacitateStudenti) {
            return res.status(400).json({ message: 'Profesorul nu mai are locuri libere disponibile.' });
        }
        // Creare colaborare
        const colaborare = await Colaborare.create({ studentId, profesorId, status: -1 });
        return res.status(200).json(colaborare);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});

// Ruta pentru actualizarea unei colaborari
app.put('/:id', autorizare, async (req, res) => {
    const { id } = req.params;
    try {
        const colaborare = await Colaborare.findByPk(id);
        if (!colaborare) {
            return res.status(404).json({ message: 'Colaborarea nu a fost gasita.' });
        }
        // Profesorul poate actualiza orice, 
        if (req.rol === 'profesor') {
            if(req.body.status != undefined){
                const profesor = await Utilizator.findByPk(req.id);
                const sesiuneCurentaProfesor = await profesor.getSesiuni({where: {
                    dataInceput: { [Op.lte]: new Date() }, 
                    dataSfarsit: { [Op.gte]: new Date() }, 
                }});
                if (!sesiuneCurentaProfesor.length > 0) {
                    return res.status(400).json({ message: 'Profesorul nu are o sesiune in desfasurare.' });
                }
                const colaborariStudent = await Colaborare.findAll({ where: { profesorId: id, status: 1 } });
                const numarColaborariStudent = colaborariStudent.length;
        
                if (numarColaborariStudent >= sesiuneCurentaProfesor.capacitateStudenti) {
                    return res.status(400).json({ message: 'Profesorul nu mai are locuri libere disponibile.' });
                }
            }
            await colaborare.update(req.body);
            return res.status(200).json(colaborare);
        }
        // studentul poate incarca cerere doar daca este acceptat (1) sau i s-a respins cererea (3)
        if (req.rol === 'student') {
            if (colaborare.studentId != req.id) return res.status(401).json({ message: 'Nu exista colaborarea pentru acest student!' });
            if (colaborare.status === -1) return res.status(400).json({ message: 'Colaborarea nu este acceptata inca!' });
            if (colaborare.status === 0) return res.status(403).json({ message: 'Colaborarea este refuzata: ' + colaborare.motivRefuz });
            if (colaborare.status === 2) return res.status(403).json({ message: 'Cererea a fost deja acceptata. '  });
            if (!req.body.fisier) return res.status(405).json({ message: 'Nu s-a incarcat fisierul.' });
            await colaborare.update({ fisier: req.body.fisier , status: 1});
            return res.status(200).json(colaborare);
        }
        return res.status(403).json({ message: 'Utilizatorul nu este autentificat.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});

module.exports = app;