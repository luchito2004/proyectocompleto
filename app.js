const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mssql = require('mssql');

// Configuración de la base de datos en Azure SQL
const dbConfig = {
    user: 'adminlu',
    password: 'Lucho12345',
    server: 'luchodb.database.windows.net',
    database: 'luchodb',
    options: {
        encrypt: true, // Azure requiere encriptación
        trustServerCertificate: false,
    },
};

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos desde la carpeta 'public'

// Conectar a la base de datos
mssql.connect(dbConfig).then(pool => {
    if (pool.connected) {
        console.log('Conectado a la base de datos SQL en Azure');
    }

    // Ruta para el login
    app.post('/login', (req, res) => {
        const { email, password } = req.body;
        pool.request()
            .input('email', mssql.VarChar, email)
            .input('password', mssql.VarChar, password)
            .query('SELECT * FROM Usuarios WHERE email = @email AND password = @password')
            .then(result => {
                if (result.recordset.length > 0) {
                    res.json({ success: true });
                } else {
                    res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
                }
            })
            .catch(err => res.status(500).send('Error en el servidor: ' + err.message));
    });

    // Ruta para el registro
    app.post('/register', (req, res) => {
        const { email, password } = req.body;
        pool.request()
            .input('email', mssql.VarChar, email)
            .input('password', mssql.VarChar, password)
            .query('INSERT INTO Usuarios (email, password) VALUES (@email, @password)')
            .then(() => res.json({ success: true }))
            .catch(err => res.status(500).send('Error en el servidor: ' + err.message));
    });

    // Ruta para agregar productos al carrito
    app.post('/cart', (req, res) => {
        const { productName, productPrice } = req.body;
        pool.request()
            .input('productName', mssql.VarChar, productName)
            .input('productPrice', mssql.Float, productPrice)
            .query('INSERT INTO Carrito (productName, productPrice) VALUES (@productName, @productPrice)')
            .then(() => res.json({ success: true }))
            .catch(err => res.status(500).send('Error en el servidor: ' + err.message));
    });

    // Ruta para ver los productos en el carrito
    app.get('/cart', (req, res) => {
        pool.request()
            .query('SELECT * FROM Carrito')
            .then(result => res.json(result.recordset))
            .catch(err => res.status(500).send('Error en el servidor: ' + err.message));
    });

    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
}).catch(err => console.error('Error al conectar a la base de datos:', err.message));
