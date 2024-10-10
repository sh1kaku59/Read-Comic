const sql = require('mssql');

const config = {
    user: 'sa',
    password: '09072002',
    server: 'SH1KAKU\\SQLEXPRESS', // You can use 'localhost\\instance' if your SQL Server runs on the same server
    database: 'QuanLyTruyenTranh',
    port: 1433,
    options: {
        encrypt: false, // Use this if you're on Windows Azure
        enableArithAbort: true
    }
};

let pool;

async function connectToSQLServer() {
    try {
        pool = await sql.connect(config);
        console.log('Connected to SQL Server');
    } catch (err) {
        console.error('Failed to connect to SQL Server', err);
        throw err;
    }
}

async function closeSQLServerConnection() {
    try {
        await pool.close(); // Close the pool connection
        console.log('Disconnected from SQL Server');
    } catch (error) {
        console.error('Failed to disconnect from SQL Server', error);
    }
}

async function getDbCollection() {
    return pool.request(); // This returns a request object that you can use to execute queries
}

module.exports = {
    connectToSQLServer,
    closeSQLServerConnection,
    getDbCollection
};
