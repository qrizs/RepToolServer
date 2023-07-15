var http = require('https');
//var http = require('http');
var zlib = require('zlib');
var fs = require('fs');

process.stdin.on('data', data => {
    if (data.toString().toLowerCase().replace(/[\n\r]/g, '') === "exit"){
        process.exit(); //alternative exit
    }
})


const { MariaDBConn } = require('./class_mariadb_conn');
const { SSASConn } = require('./class_mssql_olap_conn');
const { QueryCommand } = require('./class_query_command');

const param_MariaDB = {
    host: 'localhost',
    user: 'root',
    password: 'sa',
    //database: 'frappe',
    port: 3306,
    compress: true,
    waitForConnections: true,
    multipleStatements: true,
    connectTimeout: 1000,
    acquireTimeout: 11000,
    connectionLimit: 10,
    minimumIdle: 10,
    rowAsArray: true
};

const param_SSAS = {
    datasource: 'QRIZS-COMPUTER'
}

//used by createServer to set-up the requirements for https
const httpOptions = {
    pfx: fs.readFileSync('ssl/localhost1.pfx'),
    passphrase: 'nightpass'
};

const port = 3000;
let body = {};
//const gzip = zlib.createGzip();
/*
// createServer - create a web service for retrieving data from datasource
*/
const server = http.createServer(httpOptions,(req, res) => {
//const server = http.createServer((req, res) => {    
    try {
        const date = new Date();
        console.log("-------------------------------------------------------------------------------------------------------------");
        console.log(`Someone connecting at port ${port} at ${date}!`);
        let payload = [];
        
        if (req.method === 'GET') {
            console.log("GET request not available.");
            res.setHeader('Content-Type', 'application/json');
            res.setHeader("Content-Encoding", "gzip");     
            const gzip = zlib.createGzip(); 
            gzip.pipe(res);
            gzip.write("GET request not available.");
            gzip.end();            
        }
        else if (req.method === 'POST') {
            if (req.url === '/api/data') {
                console.log("POST method connect success!");
    
                res.setHeader('Content-Type', 'application/json');
                res.setHeader("Content-Encoding", "gzip");
                //load the payload
                req.on('data' , chunk => {
                    payload.push(chunk);
                }).on('end', () => {
                    payload = Buffer.concat(payload).toString();
                    body = JSON.parse(payload);
                    //console.log('payload', body);
                    if (body.hasOwnProperty('ws')) { //retrieve data from factTables
    
                        if (body.hasOwnProperty('contents')) {
                            let wsContent = body['contents'];
                            
                            let dbConn;
                            switch (wsContent.app){
                                case 'mariadb':
                                    dbConn = new MariaDBConn(param_MariaDB);
                                    break;
                                case 'ms-ssas':
                                    dbConn = new SSASConn(param_SSAS);
                                    break;
                            }
                            console.log("ws",body.['ws']);
                            console.log("contents",wsContent);
                            dbConn.setParameter("database",wsContent.database);
                            //console.log("param",dbConn.parameters);
                            let dbCommand = new QueryCommand(dbConn,wsContent.app);

                            //let func; //must contains function with two parameters: (string), (callback function)
                            let cb = d => {
                                const gzip = zlib.createGzip();
                                console.log("Sending data to client data: " + JSON.stringify(d).length);
                                gzip.pipe(res);
                                gzip.write(d);
                                gzip.end();
                                console.log("Done sending data");  
                            };
                            switch(body['ws']) {
                                case 'factData':
                                    //func = dbCommand.readFactData;
                                    dbCommand.readFactData(wsContent, cb);
                                    break;
                                case 'dimensionList':
                                    //func = dbCommand.readDimensionList; 
                                    dbCommand.readDimensionList(wsContent, cb);
                                    break;
                                case 'dimension':
                                    //func = dbCommand.readDimension;
                                    dbCommand.readDimension(wsContent, cb);
                                    break;
                                case 'dimensionFieldInfo':
                                    //func = dbCommand.readDimensionFieldInfo;
                                    dbCommand.readDimensionFieldInfo(wsContent, cb);
                                    break;
                                case 'factDataFieldInfo':
                                    //func = dbCommand.readFactTableFieldInfo;
                                    dbCommand.readFactTableFieldInfo(wsContent, cb);
                                    break;
                                case 'dimensionAll':
                                    //func = dbCommand.readDimensionAll;
                                    dbCommand.readDimensionAll(wsContent, cb);
                                    break;
                            }
                            /*
                            if (func) {
                                func(wsContent, d => {
                                    const gzip = zlib.createGzip();
                                    console.log("Sending data to client data: " + JSON.stringify(d).length);
                                    gzip.pipe(res);
                                    gzip.write(d);
                                    gzip.end();
                                    
                                    console.log("Done sending data");                                   
                                });
                            }*/
                        }
                        else {
                            //invalid web service request content
                            sendErrorMessage('Invalid web request, it must contains content key', d => {
                                    res.write(d);
                                    res.end();
                                });
                        }
                    }
                    else {
                        //invalid web service request content
                        sendErrorMessage('Invalid web service request content', d => {
                            res.write(d);
                            res.end();
                        });
                    }
                    console.log("Done executing web service.");
                });
    
            }
            else{
                res.statusCode = 404;
                res.end("Error");
            }        
        }
        else {
            console.log("Error sending request");
            res.setHeader("Content-Type","text/html");
            res.write("<h1>Error retrieving data, please ask technical support to fix the issue.</h1>");
            res.end();
        }
    }
    catch (error) {
        console.log("Error: " + error);
    }

});

server.listen(port, () => {
    console.log(`The server is now running at port ${port}`);
});

/**
* @description build message to json format to be send to requester
* @param message (string) payload from the browser request, format in json
*          {model: <model>,
*          dimFilters: {dim1: mem1, dim2: mem2, ...}}
* @param callback (function) process the error message
* 
*/
function sendErrorMessage(message, callback) {
    console.log(`Sending error message: ${message}`)
    let dataError = JSON.stringify(
        {
            error: message
        });
    callback(error);
}
