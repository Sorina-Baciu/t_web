const { DataTypes, Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './dizertatie.db',
    define: {
        timestamps: false
    }
});

async function startApp() {
    try {
        await sequelize.sync({ force: false, alter: false });
        console.log('Conexiunea la baza de date a fost realizata cu succes!');
    } catch (error) {
        console.error('Eroare la conectarea la baza de date:', error);
    }
}

startApp();

const Utilizator = sequelize.define('Utilizator', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nume: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    prenume: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    parola: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rol: {
        type: DataTypes.STRING,
        allowNull: false,
        isIn: ['student', 'profesor']
    }
}, {
    name: {
        singular: 'Utilizator',
        plural: 'Utilizatori',
    },
});

const SesiuneInscriere = sequelize.define('SesiuneInscriere', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    dataInceput: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    dataSfarsit: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    }
}, {
    name: {
        singular: 'SesiuneInscriere',
        plural: 'SesiuniInscriere',
    },
});

const SesiuneProfesori = sequelize.define('SesiuneProfesori', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    capacitateStudenti: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    name: {
        singular: 'SesiuneProfesori',
        plural: 'SesiuniProfesori',
    },
});

const Colaborare = sequelize.define('Colaborare', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    profesorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1,
    },
    fisier: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    motivRefuz: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    name: {
        singular: 'Colaborare',
        plural: 'Colaborari',
    },
});

// Relatiile de colaborare dintre profesori si studenti
Utilizator.belongsToMany(Utilizator, { through: Colaborare, as: 'profesor', foreignKey: 'studentId' });
Utilizator.belongsToMany(Utilizator, { through: Colaborare, as: 'student', foreignKey: 'profesorId' });

Colaborare.belongsTo(Utilizator , { foreignKey: 'studentId' , as: 'student'});
Utilizator.hasMany(Colaborare, { foreignKey: 'studentId' });
Colaborare.belongsTo(Utilizator , { foreignKey: 'profesorId' , as: 'profesor'});
Utilizator.hasMany(Colaborare, { foreignKey: 'profesorId' });

// Un profesor are o serie de sesiuni de inscriere, cu un nr de studenti maxim
Utilizator.belongsToMany(SesiuneInscriere, {
    through: SesiuneProfesori,
    as: 'Sesiuni',
    foreignKey: 'profesorId', // Cheia externa pentru Utilizator
    otherKey: 'sesiuneInscriereId' // Cheia externa pentru SesiuneInscriere
});
SesiuneInscriere.belongsToMany(Utilizator, {
    through: SesiuneProfesori,
    as: 'Profesori',
    foreignKey: 'sesiuneInscriereId', // Cheia externa pentru SesiuneInscriere
    otherKey: 'profesorId' // Cheia externa pentru Utilizator
});

module.exports = { Utilizator, SesiuneInscriere, Colaborare, SesiuneProfesori };