require("edge-js");
const oledb = require('oledb');


const appId = "PrimaryUser";
const entryKey = "sa";

//const connectionString = `Provider=SQLNCLIRDA11;Data Source=QRIZS-COMPUTER;Persist Security Info=True;Password=${entryKey};User ID=${appId};Initial Catalog=AdventureWorksDW2022`;
const connectionString = `Provider=MSOLAP;Data Source=QRIZS-COMPUTER;Initial Catalog=AdventureWorksDW2022`;

const conn = oledb.oledbConnection(connectionString);
//let query = `SELECT NON EMPTY { [Measures].[Unit Cost], [Measures].[Units Balance], [Measures].[Units Out], [Measures].[Units In] } ON COLUMNS, NON EMPTY { ([Dim Date].[Full Date Alternate Key].[Full Date Alternate Key].ALLMEMBERS ) } DIMENSION PROPERTIES MEMBER_CAPTION, MEMBER_UNIQUE_NAME ON ROWS FROM [Adventure Works DW Cube]`;
query = ` SELECT { [Measures].[Unit Cost] } ON COLUMNS, NON EMPTY { [Dim Date].[Date Key].[Date Key].[20101228] } ON ROWS FROM [Adventure Works DW Cube] WHERE ( [Dim Product].[Color].[Blue] ) `;
//query = 'select top (10) * from [AdventureWorksDW2022].[dbo].[FactFinance]';


conn.query(query)
    .then(result =>{
        result.result[0].forEach(e => {
            console.log(e);
        })
        //console.log(result.result);
    })
    .catch(err => {
        console.log(err);
    });
