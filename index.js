const url = require ('url');

    const express = require('express')
    const app = express()
    const bodyparser = require('body-parser')
    const fs = require('fs');
    const readXlsxFile = require('read-excel-file/node');
    const mysql = require('mysql')
    const multer = require('multer')
    const path = require('path')
    const session = require('express-session')
const pdf = require ('html-pdf');
const ejs = require ('ejs');

const PORT = 8080;

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), 
path.join(__dirname, 'views/Page'),
path.join(__dirname, 'views/Admin'),
path.join(__dirname, 'views/Siswa'),
path.join(__dirname, 'views/Guru'),
path.join(__dirname, 'views/Kepsek'),
path.join(__dirname, 'views/Satpam')]);


app.use('/public', express.static(path.resolve('public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

const connection = mysql.createPool({
    user: 'root',
    password: '',
    database: 'dtbs_ptmt',
    host: 'localhost',
    connectionLimit: 10
});

const dbConnect = () => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if(err) {
                reject(err);
            } else{
                resolve(conn);
            }
        })
    })
}


//--------- LOGIN -------

app.get('/', function (req, res) {
	res.render('loginpage');
});

app.get('/', async (req, res) => {
    const conn = await dbConnect();
    const users = await getUsers(conn);
    conn.release();
    if (req.session.loggedin) {
		res.send('Welcome back, ' + req.session.username + '!');
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
    res.render('loginpage', {
        users
    });
});

app.post('/auth', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;

	if (username && password) {
		connection.query('SELECT * FROM admin WHERE username_admin = ? AND pass_admin = ?', 
        [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/menu');
			} 
            
            else if(username && password){
                connection.query('SELECT * FROM siswa WHERE username_siswa = ? AND pass_siswa = ?', 
                [username, password], function(error, results, fields) {
                    if (error) throw error;
                    if (results.length > 0) {
                        req.session.loggedin = true;
                        req.session.username = username;
                        res.redirect('/menusiswa');
                    } 
                    
                    else if(username && password){
                        connection.query('SELECT * FROM guru WHERE username_guru = ? AND pass_guru = ?', 
                        [username, password], function(error, results, fields) {
                            if (error) throw error;
                            if (results.length > 0) {
                                req.session.loggedin = true;
                                req.session.username = username;
                                res.redirect('/menuguru');
                            } 

                            else if(username && password){
                                connection.query('SELECT * FROM kepalasekolah WHERE username_kepsek = ? AND pass_kepsek = ?', 
                                [username, password], function(error, results, fields) {
                                    if (error) throw error;
                                    if (results.length > 0) {
                                        req.session.loggedin = true;
                                        req.session.username = username;
                                        res.redirect('/menukepsek');
                                    }

                                    else if(username && password){
                                        connection.query('SELECT * FROM satpam WHERE username_satpam = ? AND pass_satpam = ?', 
                                        [username, password], function(error, results, fields) {
                                            if (error) throw error;
                                            if (results.length > 0) {
                                                req.session.loggedin = true;
                                                req.session.username = username;
                                                res.redirect('/cekstatusptmt');
                                    }
                                        else {
                                            res.redirect('/incorrect');
                                        }			
                                        res.end();
                            
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
            
	});
}
	
    else{res.redirect('/');
		res.end();
    }

});

app.get('/ChangePass', (req, res) => {
    res.render('ChangePass');
});

app.get('/incorrect', (req, res) => {
    res.render('incorrect');
})

//--------- ADMIN -------
app.get('/menu', (req, res) => {
    res.render('menu');
});

app.get('/periode', async (req, res) => {
    res.render('periode')
});

app.post('/periode', function(req, res) {
    let comm = "INSERT INTO periode SET ?";
    let comm2 = "INSERT INTO ruang SET ?";
    let isi2 = {kapasitas_ruang: req.body.jumlah};
    let isi = {kapasitas: req.body.jumlah, nama_perioda: req.body.Fname, tanggal_mulai: req.body.mulai,
    tanggal_akhir: req.body.akhir, nama_perioda2: req.body.Fname2, tgl_mulaidaftar: req.body.Mdaftar, tgl_akhirdaftar: req.body.Adaftar};
	connection.query(comm2, isi2, function(error, results, fields) {
		if (error) throw error;
		});
    connection.query(comm, isi, function(error, results, fields) {
		if (error) throw error;
		res.redirect('/periode');
		res.end();
		});
});

const getDataMurid = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, NIS, username_siswa, pass_siswa FROM siswa', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/datamurid', async (req, res) => {
    const conn = await dbConnect();
    var resdata = await getDataMurid(conn);
    conn.release();
    res.render('datamurid', {
        resdata
    });
});

app.get('/dataGuru', (req, res) => {
    res.render('dataGuru');
});

app.post('/guru', function(req, res) {
    let comm = "INSERT INTO guru SET ?";
    let comm2 = "INSERT INTO kepalasekolah SET ?";
    let comm3 = "INSERT INTO satpam SET ?";
    let isi = {NIP: req.body.Fname, nama_guru: req.body.Lname, username_guru: req.body.email, 
        pass_guru: req.body.Fname, kelas: req.body.kelas};
    let isik = {nama_kepsek: req.body.Fname2, username_kepsek: req.body.Lname2, pass_kepsek: req.body.email2};    
    let isis = {nama_satpam: req.body.Fname3, username_satpam: req.body.Lname3, pass_satpam: req.body.email3}; 
    connection.query(comm, isi, function(error, results, fields) {
        if (error) throw error;
    });
    connection.query(comm2, isik, function(error, results, fields) {
        if (error) throw error;
    });
    connection.query(comm3, isis, function(error, results, fields) {
        if (error) throw error;
        res.redirect('/dataguru');
        res.end();
    });    
    });

const getHadir = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, status_PTMT FROM siswa WHERE id_satpam = 1', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
    })
}

app.get('/daftarhadir', async function(req, res) {
    const conn = await dbConnect();
    var daftar = await getHadir(conn);
    conn.release();
    connection.query('SELECT NIS FROM siswa ORDER BY id_satpam', function(err, rows) {
    res.render('daftarhadir', {
    data: rows, daftar
    });
    });

    connection.query('SELECT nama_perioda FROM periode ORDER BY id_periode desc',
    function(err, rows) {
        res.render('daftarhadir', {
            data: rows
            });
            });
        });
    


//--------- SISWA -------
app.get('/menusiswa', (req, res) => {
    res.render('menusiswa');
})

app.get('/datasiswa', (req, res) => {
    res.render('datasiswa');
})

app.post('/siswa', function(req, res) {
    let comm = "UPDATE siswa SET id_satpam=(SELECT id_satpam FROM siswa WHERE vaksin_ke LIKE '2')";
    let isi = {vaksin_ke: req.body.vaksin};
		connection.query(comm, isi, function(error, results, fields) {
			if (error) throw error;
			res.redirect('/dataguru');
			res.end();
		});
});

app.get('/dataperiode', (req, res) => {
    res.render('dataperiode');
})

const getStatusptmt = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_perioda, tanggal_mulai, tanggal_akhir FROM periode', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
    })
}

app.get('/statusptmt', async function(req, res) {
    const conn = await dbConnect();
    var rest = await getStatusptmt(conn);
    conn.release();
    
    connection.query('SELECT nama_perioda FROM periode ORDER BY id_periode desc', function(err, rows) {
        res.render('statusptmt', {
            rest,
            data: rows
    });
    });
    });


//--------- GURU -------
app.get('/menuguru', (req, res) => {
    res.render('menuguru');
})

const getInfoguru = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT NIP, nama_guru, kelas FROM guru', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/infoguru', async (req, res) => {
    const conn = await dbConnect();
    var resinfo = await getInfoguru(conn);
    conn.release();
    res.render('infoguru', {
        resinfo
    });
});

const getDaftarsiswa = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, NIS, status_PTMT FROM siswa', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/daftarsiswa', async (req, res) => {
    const conn = await dbConnect();
    var resdaft = await getDaftarsiswa(conn);
    conn.release();
    res.render('daftarsiswa', {
        resdaft
    });
});



//--------- KEPSEK -------
app.get('/menukepsek', (req, res) => {
    res.render('menukepsek');
})

app.get('/grafiktrendptmt', (req, res) => {
    res.render('grafiktrendptmt');
})

app.get('/grafiktrendptmt2', (req, res) => {
    res.render('grafiktrendptmt2');
})
app.get('/grafiktrendptmt3', (req, res) => {
    res.render('grafiktrendptmt3');
})

const getLaporan = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_guru FROM guru', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/laporan', async (req, res) => {
    const conn = await dbConnect();
    var reslap = await getLaporan(conn);
    conn.release();
    res.render('laporan', {
        reslap
    });
});

app.post("/generateReport", (req, res) => {
    ejs.renderFile(path.join(__dirname, '/views/Kepsek/laporan.ejs/'), (err, data) => {
    if (err) {
          res.send(err);
    } else {
        let options = {
            "height": "11.25in",
            "width": "8.5in",
            "header": {
                "height": "20mm"
            },
            "footer": {
                "height": "20mm",
            },
        };
        pdf.create(data, options).toFile("report.pdf", function (err, data) {
            if (err) {
                res.send(err);
            } else {
                res.send("File created successfully");
            }
        });
    }
});
})


//--------- SATPAM -------//
const getSatpam = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, status_PTMT FROM siswa WHERE id_satpam = 1', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/cekstatusptmt', async (req, res) => {
    const conn = await dbConnect();
    var satpam = await getSatpam(conn);
    conn.release();
    connection.query('SELECT NIS FROM siswa ORDER BY id_satpam desc', function(err, rows) {
        res.render('cekstatusptmt', {
        data: rows, satpam
        });
        });     
});


//---------- EXCEL ----------//
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    cb(null, __dirname + '/public/uploads/')
    },
    filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
    });
    const upload = multer({storage: storage});
    app.get('/', (req, res) => {
    res.sendFile(__dirname + '/datamurid.ejs');
    });
    app.post('/uploadfile', upload.single("uploadfile"), (req, res) =>{
    importExcelData2MySQL(__dirname + '/public/uploads/' + req.file.filename);
    console.log(res);
    res.redirect('datamurid');
    });
    
    function importExcelData2MySQL(filePath){
    readXlsxFile(filePath).then((rows) => {
    console.log(rows);
    rows.shift();
    
    let query = 'INSERT INTO siswa (NIS, pass_siswa, username_siswa, id_satpam, id_ruang, nama_siswa, status_PTMT, bukti_vaksin, tanggal_vaksin, vaksin_ke, email_ortu, nama_ortu) VALUES ?';
    connection.query(query, [rows], (error, response) => {
    console.log(error || response);
    });
    });
    }

    var obj = {};
    


    



app.listen(PORT, () => {
    console.log(`Server is ready, listening on port ${PORT}`);
});