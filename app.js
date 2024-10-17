const express = require('express');
const sql = require('mssql');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const config = {
    user: 'adminlu',
    password: 'Lucho12345',
    server: 'luchodb.database.windows.net',
    database: 'luchodb',
    options: { trustServerCertificate: true }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

// Inicializar carrito en la sesión
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});

// Ruta para servir el archivo HTML principal (login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para la pantalla principal
app.get('/main', (req, res) => {
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, 'index.html')); // La misma página con productos
    } else {
        res.redirect('/');
    }
});

// Ruta para ver el carrito
app.get('/cart', (req, res) => {
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, 'cart.html')); // Cargar la página del carrito
    } else {
        res.redirect('/');
    }
});

// Ruta para agregar productos al carrito
app.post('/add-to-cart', (req, res) => {
    const { item, price } = req.body;
    req.session.cart.push({ item, price, quantity: 1 }); // Inicializamos la cantidad en 1
    res.json({ message: 'Producto agregado al carrito' });
});

// Ruta para obtener los items del carrito
app.get('/cart-items', (req, res) => {
    res.json({ items: req.session.cart });
});

// Ruta para actualizar la cantidad de un producto en el carrito
app.post('/update-cart', (req, res) => {
    const { index, quantity } = req.body;
    if (req.session.cart[index]) {
        req.session.cart[index].quantity = quantity; // Actualiza la cantidad
        res.json({ message: 'Cantidad actualizada' });
    } else {
        res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }
});

// Ruta para eliminar un producto del carrito
app.post('/remove-from-cart', (req, res) => {
    const { index } = req.body;
    if (index >= 0 && index < req.session.cart.length) {
        req.session.cart.splice(index, 1); // Eliminar el producto
        res.json({ message: 'Producto eliminado del carrito' });
    } else {
        res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }
});

// Ruta para finalizar la compra
app.post('/finalize-purchase', async (req, res) => {
    const cart = req.session.cart;
    try {
        const pool = await sql.connect(config);
        for (const item of cart) {
            await pool.request()
                .input('item', sql.VarChar, item.item)
                .input('price', sql.Int, item.price)
                .input('quantity', sql.Int, item.quantity) // Guardar cantidad en la base de datos
                .query('INSERT INTO ventas (item, price, quantity) VALUES (@item, @price, @quantity)');
        }
        req.session.cart = []; // Vaciar el carrito después de la compra
        res.json({ message: 'Compra exitosa' });
    } catch (err) {
        console.error('Error en la compra:', err);
        res.status(500).json({ message: 'Error al realizar la compra' });
    }
});

// Registro de usuario
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        await sql.connect(config);
        await sql.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query('INSERT INTO usuarios (email, password) VALUES (@email, @password)');
        res.status(201).send('Usuario registrado exitosamente');
    } catch (err) {
        console.error('Error al registrar:', err);
        res.status(500).send('Error al registrar usuario');
    }
});

// Login de usuario
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query('SELECT * FROM usuarios WHERE email = @email AND password = @password');
        if (result.recordset.length > 0) {
            req.session.loggedIn = true; // Establece la sesión como iniciada
            res.send('Login exitoso');
        } else {
            res.send('Correo o contraseña incorrectos');
        }
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).send('Error al iniciar sesión');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
