const sql = require('mssql');

const config = {
    user: 'sa',
    password: '09072002',
    // password:'MyStrongPass123',
    server: 'SH1KAKU\\SQLEXPRESS', // You can use 'localhost\\instance' if your SQL Server runs on the same server
    // server: 'localhost',
    database: 'QuanLyTruyenTranh',
    // database: 'comics',
    port: 1433,
    options: {
        encrypt: false, // Use this if you're on Windows Azure
        enableArithAbort: true,
        trustServerCertificate: true // This option allows self-signed certificates
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

// Hàm bắt đầu giao dịch
async function beginTransaction() {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    console.log('Transaction started');
    return transaction;
}

// Hàm commit giao dịch
async function commitTransaction(transaction) {
    await transaction.commit();
    console.log('Transaction committed');
}

// Hàm rollback giao dịch
async function rollbackTransaction(transaction) {
    await transaction.rollback();
    console.log('Transaction rolled back');
}

module.exports = {
    connectToSQLServer,
    closeSQLServerConnection,
    getDbCollection,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
};
