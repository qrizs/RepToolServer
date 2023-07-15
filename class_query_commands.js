const { dimListTemp, measuresList } = require('./test_dataset'); //temp

class QueryCommand {

    _conn;
    _dbAppName;

    constructor(p_connector, p_dbAppName) {
        this._conn = p_connector;
        this._dbAppName = p_dbAppName;
    }

    get connector() {
        return this._conn;
    }

    get dbAppName() {
        return this._dbAppName;
    }

    /**
    * @description reads values from FactTable and set format to json
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *          dimFilters: {dim1: mem1, dim2: mem2, ...}}
    * @param callback (function) process the data after read and formatting
    */
    readFactData(content, callback) {
        switch (this._dbAppName) {
            case "mariadb":
                return this.readFactDataMariaDB(content, callback);
                break;
            case "ms-ssas":
                break;
        }
    }

    /**
    * @description sends dimension list from selected model
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>}
    * @param callback (function) process the data after read and formatting
    */
    readDimensionList(content, callback) {
        switch (this._dbAppName) {
            case "mariadb":
                return this.readDimensionListMariaDB(content, callback);
                break;
            case "ms-ssas":
                break;
        }        
    }

    /**
    * @description sends dimension members and properties from table
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback (function) process the data after read and formatting
    */
    readDimension(content, callback) {
        switch (this._dbAppName) {
            case "mariadb":
                return this.readDimensionMariaDB(content, callback);
                break;
            case "ms-ssas":
                break;
        }         
    }


    /**
    * @description sends dimension field information
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback: (function) process the data after read and formatting
    */
    readDimensionFieldInfo(content, callback) {
        switch (this._dbAppName) {
            case "mariadb":
                return this.readDimensionFieldInfoMariaDB(content, callback);
                break;
            case "ms-ssas":
                break;
        }         
    }

    /**
    * @description sends dimension field information
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback (function) process the data after read and formatting
    */
    readFactTableFieldInfo(content, callback) {
        switch (this._dbAppName) {
            case "mariadb":
                return this.readFactTableFieldInfoMariaDB(content, callback);
                break;
            case "ms-ssas":
                break;
        }         
    }

    /**
    * @description sends all dimension members and properties from table
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback (function) process the data after read and formatting
    */
    readDimensionAll(content, callback) {
        switch (this._dbAppName) {
            case "mariadb":
                return this.readDimensionAllMariaDB(content, callback);
                break;
            case "ms-ssas":
                break;
        }         
    }



    /**
    * @description sends dimension list from selected model
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>}
    * @param callback (function) process the data after read and formatting
    */
    readFactDataMariaDB(content, callback) {
        let conn = this._conn;
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
        conn.fetchTableValue(queryString, d0 => {
            data = {
                ...d0
            };
            data.data = d0.data[0];
            data.length = JSON.stringify(data.data).length;
            var dataString = JSON.stringify(data)
            callback(dataString);        
        });     

    };

    /**
    * @description sends dimension list from selected model
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>}
    * @param callback (function) process the data after read and formatting
    */    
    readDimensionListMariaDB(content, callback) {   
        let conn = this._conn;
        let dimList;
        if (content.hasOwnProperty('model')) {
            console.log(`Sending dimension list from ${content['model']}`);
            switch(content['model']) { //hardcoded for now
                case 'GL Accounts':
                    dimList = {
                        data:dimListTemp,
                        status: "Success",
                        length: JSON.stringify(dimListTemp).length
                    };
                    callback(JSON.stringify(dimList));
                    break;
            }
        }
        else {
            callback({
                data: {},
                status: "Error",
                error: "Incorrect request",
                length: 0
            });
        }
    }

    /**
    * @description sends dimension members and properties from table
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback (function) process the data after read and formatting
    */

    readDimensionMariaDB(content, callback) {   
        //let dimList;
        let conn = this._conn;
        if (content.hasOwnProperty('model')) {
            console.log(`Sending ${content['dimension']} dimension info from model ${content['model']}`);
            switch(content['model']) { //hardcoded for now
                case 'GL Accounts':
                    const queryString = `select * from ${content['dimension']};`;
                    console.log(queryString);
                    conn.fetchTableValue(queryString, d0 => {
                        let data = {
                            ...d0
                        };
                        data.data = d0.data[0];
                        if (data.data) {
                            data.length = JSON.stringify(data.data).length;
                        }
                        else {
                            data.length = 0;
                        }
                        var dataString = JSON.stringify(data)
                        callback(dataString);
                    });   
                    break;
            }
        }
        else {
            callback('{error: "Incorrect request"');
        }
    }


    /**
    * @description sends dimension field information
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback: (function) process the data after read and formatting
    */

    readDimensionFieldInfoMariaDB(content, callback) {   
        //let dimList;
        let conn = this._conn;
        if (content.hasOwnProperty('model')) {
            console.log(`Sending ${content['dimension']} dimension field info from model ${content['model']}`);
            switch(content['model']) { //hardcoded for now
                case 'GL Accounts':
                    const queryString = `show columns from ${content['dimension']};`;
                    console.log(queryString);
                    conn.fetchTableValue(queryString, d0 => {
                        let data = {
                            ...d0
                        };
                        data.data = d0.data[0];
                        data.length = JSON.stringify(data.data).length;
                        var dataString = JSON.stringify(data)
                        callback(dataString);
                    });   
                    break;
            }
        }
        else {
            callback('{error: "Incorrect request"');
        }
    }

    /**
    * @description sends dimension field information
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback (function) process the data after read and formatting
    */

    readFactTableFieldInfoMariaDB(content, callback) {   
        //let dimList;
        let conn = this._conn;
        let tableName = "";
        if (content.hasOwnProperty('model')) {
            console.log(`Sending ${content['dimension']} dimension field info from model ${content['model']}`);
            switch(content['model']) { //hardcoded for now
                case 'GL Accounts':
                    const queryString = "show columns from `tabgl entry`;";
                    console.log(queryString);
                    conn.fetchTableValue(queryString, d0 => {
                        let data = {
                            ...d0
                        };
                        data.data = d0.data[0];
                        data.length = JSON.stringify(data.data).length;
                        var dataString = JSON.stringify(data)
                        callback(dataString);

                    });   
                    break;
            }
        }
        else {
            callback('{error: "Incorrect request"');
        }
    }



    /**
    * @description sends all dimension members and properties from table
    * @param content (Object) payload from the browser request, format in json
    *          {model: <model>,
    *           dimension: <dimension>}
    * @param callback (function) process the data after read and formatting
    */

    readDimensionAllMariaDB(content, callback) {   
    
        let dataAll = {};
        let conn = this._conn;
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
                    //let conn2 = new MariaDBConn(conn.parameters);
                    let conn2 = conn.clone();
                    conn2.openConnection();
                    for (var key in dimInfos) {
                        const dimInfo = dimInfos[key];
                        if (dimInfo.table) {
                            const tableName = dimInfo.table.name;
                            const queryString = `select * from ${tableName};`;
                            let keyLocal = key;
                            let data = {};
                            //let dataLength = 0;
                            console.log(queryString);
                            conn2.fetchTableValue(queryString, d0 => {
                                if (d0.data) {
                                    dataAll[keyLocal] = d0.data[0];
                                    //dataLength += JSON.stringify(d0.data[0]).length;
                                }

                                readCount++;
                                if (readCount >= readCountMax) {
                                    data.data = dataAll;
                                    data.status = "Success";
                                    //data.length = dataLength;
                                    data.length = JSON.stringify(dataAll).length;
                                    var dataString = JSON.stringify(data);
                                    console.log("dataAll done");
                                    callback(dataString);
                                    conn2.closeConnection();
                                };                            
                            }, false);  
                        };
                    };
                    
                    break;
            }
        }
        else {
            callback('{error: "Incorrect request"');
        };

    }

}


module.exports = {
    QueryCommand
}
