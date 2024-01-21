const express = require('express');
const { Op } = require('sequelize');
const { autorizare } = require('./utileAutentificare');
const { Utilizator, SesiuneInscriere, SesiuneProfesori, Colaborare } = require('../clase');
const app = express.Router();

// Ruta pentru obtinerea sesiunilor de inscriere 
app.get('/', autorizare, async (req, res) => {
    try {
        const id = req.id;
        // Verificare daca Utilizatorul exista
        const utilizator = await Utilizator.findByPk(id);
        if (!utilizator) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost gasit.' });
        }
        if (utilizator.rol !== 'profesor') {
            return res.status(403).json({ message: 'Trebuie sa fii profesor!' });
        }
        const sesiuniUtilizator = await utilizator.getSesiuni();
        return res.status(200).json(sesiuniUtilizator);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});

app.get('/all', async (req, res) => {
    try {
        const sesiuni = await SesiuneInscriere.findAll(
            {where: { dataSfarsit: { [Op.gte]: new Date() } }, 
            order:['dataInceput'], include: {model: Utilizator, as: 'Profesori'}});
        return res.status(200).json(sesiuni);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});
// salvarea unei sesiuni de inscriere
app.post('/', autorizare, async (req, res) => {
    try {
        const id = req.id;
        const utilizator = await Utilizator.findByPk(id);
        if (!utilizator) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost gasit.' });
        }
        if (utilizator.rol !== 'profesor') {
            return res.status(403).json({ message: 'Trebuie sa fii profesor!' });
        }
        const { dataInceput, dataSfarsit, capacitateStudenti } = req.body;
        // Verific daca exista deja o sesiune care se suprapune
        const sesiuniExistente = await utilizator.getSesiuni({
            where: {
                [Op.or]: [
                    {
                        [Op.and]: [
                            { dataInceput: { [Op.lte]: dataInceput } },
                            { dataSfarsit: { [Op.gte]: dataInceput } },
                        ],
                    },
                    {
                        [Op.and]: [
                            { dataInceput: { [Op.lte]: dataSfarsit } },
                            { dataSfarsit: { [Op.gte]: dataSfarsit } },
                        ],
                    },
                    {
                        [Op.and]: [
                            { dataInceput: { [Op.gte]: dataInceput } },
                            { dataSfarsit: { [Op.lte]: dataSfarsit } },
                        ],
                    },
                ],
            },
        });
        if (sesiuniExistente.length > 0) {
            return res.status(400).json({ message: 'Exista o sesiune care se suprapune cu intervalul dat.' });
        }
        const sesiuneInscriere = await SesiuneInscriere.create({ dataInceput, dataSfarsit });
        // Asocierea sesiunii cu profesorul si adaugarea capacitatii maxime
        await utilizator.addSesiuni(sesiuneInscriere, { through: { capacitateStudenti } });
        return res.status(201).json(sesiuneInscriere);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});
// asocierea unei sesiuni de inscriere
app.post('/asociere/:id', autorizare, async (req, res) => {
    try {
        const id = req.id;
        const utilizator = await Utilizator.findByPk(id);
        if (!utilizator) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost gasit.' });
        }
        if (utilizator.rol !== 'profesor') {
            return res.status(403).json({ message: 'Trebuie sa fii profesor!' });
        }
        const sesi = await SesiuneInscriere.findByPk(req.params.id);
        if(!sesi) return res.status(404).json({ message: 'Sesiunea nu a fost gasita.' });
        
        // Asocierea sesiunii cu profesorul si adaugarea capacitatii maxime
        await utilizator.addSesiuni(sesi, { through: { capacitateStudenti: req.body.capacitateStudenti } });
        return res.status(200).json({message: "Asociat!"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});
// verific daca nu are colaborare acceptata
app.get('/student-eligibil', autorizare, async (req, res) => {
    try {
        if (req.id && req.rol === 'student') {
            const utilizator = await Utilizator.findByPk(req.id);
            if (!utilizator) {
                return res.status(404).json({ message: 'Utilizatorul nu a fost gasit.' });
            }
            // Verificare daca studentul are deja o colaborare acceptata
            const colaborareAcceptata = await Colaborare.findOne({
                where: { studentId: req.id, status: { [Op.gte]: 1 } }
            });
            if (colaborareAcceptata && colaborareAcceptata.status >= 1) { // acceptata sau semnata
                const prof = await Utilizator.findByPk(colaborareAcceptata.profesorId);
                return res.status(400).json({ message: 'Studentul are deja o colaborare acceptata.', prof, colab: colaborareAcceptata });
            }
        } else return res.status(403).json({ message: "Doar un student poate prelua profesorii cu sesiuni active." });
        return res.status(200).json({ message: 'Studentul poate lansa cereri.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});

// preluarea profesilor care au o sesiune activa si care au locuri libere
app.get('/profesori', async (req, res) => {
    try {
        const currentDate = new Date();
        const profesoriCuSesiuniActive = await Utilizator.findAll({
            include: [{
                model: SesiuneInscriere,
                as: 'Sesiuni',
                through: {
                    model: SesiuneProfesori,
                    attributes: ['capacitateStudenti'],
                },
                where: {
                    dataInceput: { [Op.lte]: currentDate },
                    dataSfarsit: { [Op.gte]: currentDate },
                },
                required: true
            }, {
                model: Utilizator,
                as: 'student', through: { Colaborare }
            }],
        });
        return res.json(profesoriCuSesiuniActive);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});

// preluarea studentilor cu colaborari de catre un profesor
app.get('/studenti', autorizare, async (req, res) => {
    try {
        const id = req.id;
        if (req.rol !== 'profesor') {
            return res.status(403).json({ message: 'Trebuie sa fii profesor!' });
        }
        const utilizator = await Utilizator.findByPk(id);
        if (!utilizator) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost gasit.' });
        }

        // Obtinerea tuturor colaborarilor pentru profesorul cerut
        const colaborariProfesor = await Colaborare.findAll({where: { profesorId: req.id}});
        // Obtinerea studentilor
        const idStudenti = colaborariProfesor.map(colaborare => colaborare.studentId);      
        // vad ce studenti sunt acceptati de alti profi
        let studentiBuni = [];
        for (let idStudent of idStudenti) {
            const stud = await Utilizator.findByPk(idStudent,{where: { rol: 'student' }});
            // iau colaborarile
            const colaborareAcceptata = await Colaborare.findOne({
                where: { studentId: idStudent, status: { [Op.gte]: 1 }, profesorId: { [Op.ne]: req.id } }
            });
            if (stud && !colaborareAcceptata) {
                const colab = await Colaborare.findOne({where: {studentId: idStudent, profesorId: req.id}})
                studentiBuni.push({...stud.dataValues, Colaborare: colab});
            }
        }
        return res.status(200).json(studentiBuni);
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Eroare: ' + error.message });
    }
});
module.exports = app;