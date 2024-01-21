const express = require('express');
const cors = require('cors');
const app = express();

const ruteLogin = require('./rute/ruteLogin');
const ruteColaborare = require('./rute/ruteColaborare');
const ruteSesiuni = require('./rute/ruteSesiuni');

app.use(express.json({ limit: '20mb' }));
app.use(cors({ origin: 'http://localhost:3000' }));
const port = 3001;

app.use('/', ruteLogin);
app.use('/colaborari', ruteColaborare);
app.use('/sesiuni', ruteSesiuni);

app.listen(port, () => console.log(`Server pornit pe portul ${port}...`));