import path from 'path';
import express from 'express';

const PORT = 8080;
const app = express();

app.use(express.static(path.resolve('public')));
app.set('view engine', 'ejs');
app.set('views', './views');

let current = '';

app.get('/', (req, res) => {
    if(req.query.color !== undefined){
        current = req.query.color;
    }
    res.render('loginpage',{
        color: current
    });
});

app.listen(PORT, () => {
    console.log(`Server is ready, listening on port ${PORT}`);
});



