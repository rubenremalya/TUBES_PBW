import path from 'path';
import express from 'express';

const PORT = 8080;
const app = express();


app.set('view engine', 'ejs');
app.set('views', './views/Page');

app.use('/public', express.static(path.resolve('public')));

app.get('/', (req, res) => {
    res.render('loginpage');
});

app.get('/menu', (req, res) => {
    res.render('menu');
});

app.get('/periode', (req, res) => {
    res.render('periode');
});

app.get('/dataMurid', (req, res) => {
    res.render('dataMurid');
});

app.get('/dataGuru', (req, res) => {
    res.render('dataGuru');
});

app.get('/daftarHadir', (req, res) => {
    res.render('daftarHadir');
});

app.listen(PORT, () => {
    console.log('Server is ready, listening on port ${PORT}');
});



