var http = require('https');
var zlib = require('zlib');
var fs = require('fs');

const { MariaDBConn } = require('./class_mariadb_conn');
const { dimListTemp, measuresList } = require('./test_dataset'); //temp

const param = {
    host: 'localhost',
    user: 'root',
    password: 'sa',
    database: 'fraffe',
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

//used by createServer to set-up the requirements for https
const httpOptions = {
    pfx: fs.readFileSync('ssl/localhost1.pfx'),
    passphrase: 'nightpass'
};

const port = 3000;
let body = {};
let dbConn = new MariaDBConn(param);
//const gzip = zlib.createGzip();
/*
// createServer - create a web service for retrieving data from datasource
*/
const server = http.createServer(httpOptions,(req, res) => {
    try {
        const date = new Date();
        console.log("-------------------------------------------------------------------------------------------------------------");
        console.log(`Someone connecting at port ${port} at ${date}!`);
        let payload = [];
        
        if (req.method === 'GET') {
            if (req.url === '/db') {
    
                const queryString = "select * from `tabgl entry` where customer = 'Aaron Fitz Electrical'";
    
                console.log("GET method connect success!");
    
                res.setHeader('Content-Type', 'application/json');
                res.setHeader("Content-Encoding", "gzip");
    
                const gzip = zlib.createGzip();
    
    
                dbConn.fetchTableValue(queryString, data => {
                    var dataClean = JSON.stringify(data[0])
                    gzip.pipe(res);
                    gzip.write(dataClean);
                    gzip.end();
                    console.log("Done sending data");
                });                  
            }
            else{
                res.statusCode = 404;
                res.end("Error");
            }
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
                    console.log('payload', body);
                    if (body.hasOwnProperty('ws')) { //retrieve data from factTables
    
                        if (body.hasOwnProperty('contents')) {
                            let wsContent = body['contents'];
                            let func; //must contains function with two parameters: (string), (callback function)
                            switch(body['ws']) {
                                case 'factData':
                                    func = readFactData;
                                    break;
                                case 'dimensionList':
                                    func = readDimensionList;                                
                                    break;
                                case 'dimension':
                                    func = readDimension;
                                    break;
                                case 'dimensionFieldInfo':
                                    func = readDimensionFieldInfo;
                                    break;
                                case 'factDataFieldInfo':
                                    func = readFactTableFieldInfo;
                                    break;
                                case 'dimensionAll':
                                    func = readDimensionAll;
                                    break;
                            }
                            if (func) {
                                func(wsContent, dbConn, d => {
                                    const gzip = zlib.createGzip();
                                    console.log("Sending data to client data: " + JSON.stringify(d).length);
                                    gzip.pipe(res);
                                    gzip.write(d);
                                    gzip.end();
                                    
                                    console.log("Done sending data");                                   
                                });
                            }
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

/*
// sendErrorMessage - build message to json format to be send to requester
// parameters:
//      message: (string) payload from the browser request, format in json
//          {model: <model>,
//          dimFilters: {dim1: mem1, dim2: mem2, ...}}
//      callback: (function) process the error message
*/
function sendErrorMessage(message, callback) {
    console.log(`Sending error message: ${message}`)
    let dataError = JSON.stringify(
        {
            error: message
        });
    callback(error);
}

/*
// readFactData - reads values from FactTable and set format to json
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>,
//          dimFilters: {dim1: mem1, dim2: mem2, ...}}
//      conn: connection object from Class (e.g. MariaDBConn class)
//      callback: (function) process the data after read and formatting
*/
function readFactData(content, conn, callback) {
    let tableName = '';
    let tableFilter = '';
    //const gzip = zlib.createGzip();
    let dimInfo = dimListTemp; //hard coded for now

    if (content.hasOwnProperty('model')) {
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                tableName = '`tabgl entry`';
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    };

    if (content.hasOwnProperty('dimFilters')) {
        let innerJoinPhrase = ``;
        let wherePhrase = ``;
        let innerJoinNum = 1;
        for (const key in content['dimFilters']) {
            wherePhrase = wherePhrase.length > 0 ? wherePhrase + ` and ` : ` where `;
            let innerWhere = "";
            /*if (tableFilter.length > 0) {
                tableFilter += ' and ';
            }
            else {
                tableFilter = ' where ';
            }*/
            let detItems = content['dimFilters'][key];
            let detKeys = Object.keys(detItems).sort();
            let innerJoin = "";
            console.log("key",key,dimInfo[key]);
            if (key.search(".H.") > -1) {
                let splitKey = key.split(".H.");
                let alias = `d${innerJoinNum}`;
                innerJoin += ` inner join ${dimInfo[splitKey[0]].table.name} ${alias} on ${alias}.${dimInfo[splitKey[0]].table.id} = t.${dimInfo[splitKey[0]].fieldName} `;
                innerJoinNum += 1;
                detKeys.forEach(det0 => {
                    innerWhere += `or ${alias}.${splitKey[1]} = '${detItems[det0]}' `;
                });    
            }
            else {
                detKeys.forEach(det0 => {
                    innerWhere += `or t.${dimInfo[key].fieldName} = '${detItems[det0]}' `;
                });    
            }

            innerJoinPhrase += innerJoin;
            wherePhrase += `(${innerWhere.substring(2)})`;
            

            //tableFilter += key + ' = ' + "'" + content.dimFilters[key] + "'";
        }
        tableFilter += `${innerJoinPhrase} ${wherePhrase}`.trim();
    };    

    const queryString = `select t.* from ${tableName} t ${tableFilter};`;
    console.log(queryString);
    conn.fetchTableValue(queryString, data => {
        var dataClean = JSON.stringify(data[0])
        callback(dataClean);
    });     

};

/*
// readDimensionList - sends dimension list from selected model
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>}
//      conn: connection object from Class (e.g. MariaDBConn class)
//      callback: (function) process the data after read and formatting
*/

function readDimensionList(content, conn, callback) {   
    let dimList;
    if (content.hasOwnProperty('model')) {
        console.log(`Sending dimension list from ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                dimList = dimListTemp;
                callback(JSON.stringify(dimList));
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    }
}

/*
// readDimension - sends dimension members and properties from table
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>,
//           dimension: <dimension>}
//      conn: connection object from Class (e.g. MariaDBConn class)
//      callback: (function) process the data after read and formatting
*/

function readDimension(content, conn, callback) {   
    //let dimList;
    if (content.hasOwnProperty('model')) {
        console.log(`Sending ${content['dimension']} dimension info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                const queryString = `select * from ${content['dimension']};`;
                console.log(queryString);
                conn.fetchTableValue(queryString, data => {
                    var dataClean = JSON.stringify(data[0])
                    callback(dataClean);
                });   
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    }
}


/*
// readDimensionFieldInfo - sends dimension field information
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>,
//           dimension: <dimension>}
//      conn: connection object from Class (e.g. MariaDBConn class)
//      callback: (function) process the data after read and formatting
*/

function readDimensionFieldInfo(content, conn, callback) {   
    //let dimList;
    if (content.hasOwnProperty('model')) {
        console.log(`Sending ${content['dimension']} dimension field info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                const queryString = `show columns from ${content['dimension']};`;
                console.log(queryString);
                conn.fetchTableValue(queryString, data => {
                    var dataClean = JSON.stringify(data[0])
                    callback(dataClean);
                });   
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    }
}

/*
// readFactTableFieldInfo - sends dimension field information
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>,
//           dimension: <dimension>}
//      conn: connection object from Class (e.g. MariaDBConn class)
//      callback: (function) process the data after read and formatting
*/

function readFactTableFieldInfo(content, conn, callback) {   
    //let dimList;
    let tableName = "";
    if (content.hasOwnProperty('model')) {
        console.log(`Sending ${content['dimension']} dimension field info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                const queryString = "show columns from `tabgl entry`;";
                console.log(queryString);
                conn.fetchTableValue(queryString, data => {
                    var dataClean = JSON.stringify(data[0])
                    callback(dataClean);
                });   
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    }
}

/*
// readDimensionAll - sends all dimension members and properties from table
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>,
//           dimension: <dimension>}
//      conn: connection object from Class (e.g. MariaDBConn class)
//      callback: (function) process the data after read and formatting
*/


function readDimensionAll(content, conn, callback) {   
 
    let dataAll = {};

    if (content.hasOwnProperty('model')) {
        console.log(`Sending ALL dimensions info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                let dimInfos = dimListTemp;  //list of dimensions
                let readCount = 0;
                let readCountMax = 0;
                for (var key in dimInfos) { //remove Measure dimension because they have no tables
                    const dimInfo = dimInfos[key];
                    if (dimInfo.table) {
                        readCountMax++;
                    }
                };
                for (var key in dimInfos) {
                    const dimInfo = dimInfos[key];
                    if (dimInfo.table) {
                        const tableName = dimInfo.table.name;
                        const queryString = `select * from ${tableName};`;
                        let keyLocal = key;
                        console.log(queryString);
                        conn.fetchTableValue(queryString, data => {
                            console.log(`dimAll fetch ${keyLocal} done`);
                            dataAll[keyLocal] = data[0];
                            //console.log("Sending data to client data: " + JSON.stringify(data[0]).length);
                            readCount++;
                            if (readCount >= readCountMax) {
                                var dataClean = JSON.stringify(dataAll);
                                console.log("dataAll done");
                                callback(dataClean);
                            };                            
                        });           
                    };
                };
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    };

}
