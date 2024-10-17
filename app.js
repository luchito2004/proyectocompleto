const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mssql = require('mssql');

// Configuración de la base de datos en Azure SQL
const dbConfig = {
    user: 'adminlu',
    password: 'Lucho12345',
    server: 'manidb.database.windows.net',
    database: 'manidb',
    options: {

        trustServerCertificate: false,
    },
};

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos desde la carpeta 'public'

// Middleware para la conexión a la base de datos en cada solicitud
app.use((req, res, next) => {
    mssql.connect(dbConfig).then(pool => {
        req.db = pool;
        next();
    }).catch(err => {
        console.error('Error al conectar a la base de datos:', err.message);
        res.status(500).send('Error al conectar a la base de datos.');
    });
});

// Ruta para el login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    req.db.request()
        .input('email', mssql.VarChar, email)
        .input('password', mssql.VarChar, password)
        .query('SELECT * FROM Usuarios WHERE email = @email AND password = @password')
        .then(result => {
            if (result.recordset.length > 0) {
                res.json({ success: true });
            } else {
                res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
            }
        })
        .catch(err => {
            console.error('Error en la consulta de login:', err.message);
            res.status(500).send('Error en el servidor.');
        });
});

// Ruta para el registro
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    req.db.request()
        .input('email', mssql.VarChar, email)
        .input('password', mssql.VarChar, password)
        .query('INSERT INTO Usuarios (email, password) VALUES (@email, @password)')
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error('Error en la consulta de registro:', err.message);
            res.status(500).send('Error en el servidor.');
        });
});

// Ruta para agregar productos al carrito
app.post('/cart', (req, res) => {
    const { productName, productPrice } = req.body;
    req.db.request()
        .input('productName', mssql.VarChar, productName)
        .input('productPrice', mssql.Float, productPrice)
        .query('INSERT INTO Carrito (productName, productPrice) VALUES (@productName, @productPrice)')
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error('Error al agregar al carrito:', err.message);
            res.status(500).send('Error en el servidor.');
        });
});

// Ruta para ver los productos en el carrito
app.get('/cart', (req, res) => {
    req.db.request()
        .query('SELECT * FROM Carrito')
        .then(result => res.json(result.recordset))
        .catch(err => {
            console.error('Error al obtener el carrito:', err.message);
            res.status(500).send('Error en el servidor.');
        });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
