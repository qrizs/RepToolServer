var http = require('https');
var zlib = require('zlib');
var fs = require('fs');

const { fetchTableValue } = require('./mariadb_conn');
const { dimListTemp, measuresList } = require('./test_dataset'); //temp

//used by createServer to set-up the requirements for https
const httpOptions = {
    pfx: fs.readFileSync('ssl/localhost1.pfx'),
    passphrase: 'nightpass'
};

const port = 3000;

let body = {};

/*
// createServer - create a web service for retrieving data from datasource
*/
const server = http.createServer(httpOptions,(req, res) => {
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

            fetchTableValue(queryString, data => {
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
                        }
                        if (func) {
                            func(wsContent, d => {
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
//      callback: (function) process the data after read and formatting
*/
function readFactData(content, callback) {
    let tableName = '';
    let tableFilter = '';
    //const gzip = zlib.createGzip();

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
        for (const key in content['dimFilters']) {
            if (tableFilter.length > 0) {
                tableFilter += ' and ';
            }
            else {
                tableFilter = ' where ';
            }
            tableFilter += key + ' = ' + "'" + content.dimFilters[key] + "'";
        }
    };    

    const queryString = `select * from ${tableName} ${tableFilter}`;
    console.log(queryString);
    fetchTableValue(queryString, data => {
        var dataClean = JSON.stringify(data[0])
        callback(dataClean);
    });     

};

/*
// readDimensionList - sends dimension list from selected model
// parameters:
//      content: (Object) payload from the browser request, format in json
//          {model: <model>}
//      callback: (function) process the data after read and formatting
*/

function readDimensionList(content, callback) {   
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
//      callback: (function) process the data after read and formatting
*/

function readDimension(content, callback) {   
    //let dimList;
    if (content.hasOwnProperty('model')) {
        console.log(`Sending ${content['dimension']} dimension info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                const queryString = `select * from ${content['dimension']};`;
                console.log(queryString);
                fetchTableValue(queryString, data => {
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
//      callback: (function) process the data after read and formatting
*/

function readDimensionFieldInfo(content, callback) {   
    //let dimList;
    if (content.hasOwnProperty('model')) {
        console.log(`Sending ${content['dimension']} dimension field info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                const queryString = `show columns from ${content['dimension']};`;
                console.log(queryString);
                fetchTableValue(queryString, data => {
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
//      callback: (function) process the data after read and formatting
*/

function readFactTableFieldInfo(content, callback) {   
    //let dimList;
    let tableName = "";
    if (content.hasOwnProperty('model')) {
        console.log(`Sending ${content['dimension']} dimension field info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                const queryString = "show columns from `tabgl entry`;";
                console.log(queryString);
                fetchTableValue(queryString, data => {
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
//      callback: (function) process the data after read and formatting
*/

/*
function readDimensionAll(content, callback) {   

    const fetchTableValueRept = (dimTableInfos, callback) => {
        let dimName = Object.keys(dimTableInfos)[0];
        if (dimName) {
            let dimTableInfo = dimTableInfos[dimName];
            if (dimTableInfo.type != "Measures") {
                if (dimTableInfo.table.name) {
                    let table = dimTableInfo.table.name;
                    const queryString = `select * from ${table};`;
                    console.log(queryString);
                    fetchTableValue(queryString, data => {
                        var dataClean = JSON.stringify(data[0])
                        let reducedTableInfo = delete dimTableInfos[dimName];
                        callback(dataClean);
                    });        
                }    
            }
            else {
                let reducedTableInfos = delete dimTableInfos[dimName];
                if (Object.keys(reducedTableInfos).length) {
                    fetchTableValueRept(reducedTableInfos,callback);
                }
            }
        }
    };


    if (content.hasOwnProperty('model')) {
        console.log(`Sending ALL dimensions info from model ${content['model']}`);
        switch(content['model']) { //hardcoded for now
            case 'GL Accounts':
                let dimInfos = dimListTemp;
                for (var key in dimInfos) {
                    const dimInfo = dimInfos(key);
                    if (dimInfo.table) {
                        const tableName = dimInfo.table.name;
                        const queryString = `select * from ${tableName};`;
                        console.log(queryString);
                        fetchTableValue(queryString, data => {
                            var dataClean = JSON.stringify(data[0])
                            callback(dataClean);
                        });           
                    }
                };                
                break;
        }
    }
    else {
        callback('{error: "Incorrect request"');
    };

}
*/