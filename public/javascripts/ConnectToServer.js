const sql = require('mssql');

const config = {
    user: 'sa',
    password: '09072002',
    server: 'SH1KAKU\\SQLEXPRESS',
    database: 'QuanLyTruyenTranh',
    port: 1433,
    options: {
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true
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
