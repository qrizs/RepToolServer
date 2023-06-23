//hard-coded
const measuresList = [
    {id: "Periodic", desc: 'Periodic', default: true},
    {id: "YTD", desc: 'Year to Date'},
    {id: "QTD", desc: 'Quarter to Date'}
];


//hard-coded for now, supposed to be retrieved from model list stored somewhere in the future
const dimListTemp = {
    'Account': {fieldName: 'account', desc: 'Chart of Accounts', type: 'Account', table: {name: 'tabaccount2', id: 'name', desc: 'account_name', parent: {parent_account: 'Parent Account', old_parent: 'Old Parent'}}},
    'Company': {fieldName: 'company', desc: 'Company', type: 'Entity', table: {name: 'tabcompany', id: 'name', desc: 'company_name', parent: {}}},
    'Employee': {fieldName: 'employee', desc: 'Employee name', type: 'Person', table: {name: 'tabemployee', id: 'name', desc: 'employee_name' , parent: {}}},
    'Department': {fieldName: 'department', desc: 'Department', type: 'Other', table: {name: 'tabdepartment', id: 'name', desc: 'department_name', parent: {}}},
    'Customer': {fieldName: 'customer', desc: 'Customer name', type: 'Person', table: {name: 'tabcustomer', id: 'name', desc: 'customer_name', parent: {}}},
    'Patient': {fieldName: 'patient', desc: 'Patient name', type: 'Person', table: {name: 'tabpatient', id: 'name', desc: 'patient_name', parent: {}}},
    'Supplier': {fieldName: 'supplier', desc: 'Supplier', type: 'Other', table: {name: 'tabsupplier', id: 'name', desc: 'supplier_name', parent: {}}},
    'Movement': {fieldName: '', desc: 'Movement', type: 'Movement', table: {name: 'zmovement', id: 'name', desc: 'description', parent: {parenth1: 'Hier1'}}},
    'Time': { fieldName: 'posting_date', desc: 'Time', type: 'Time', table: {name: 'ztime', id: 'name', desc: 'description', parent: {parenth1: 'Hier1'}} },
    'Balance': { fieldName: '', desc: 'Balance', type: 'Other', table: {name: 'zbalance', id: 'name', desc: 'description', parent: {parenth1: 'Hier1'}}},
    'Measures': { fieldName: '', desc: 'Measures', type: 'Measures', members: measuresList }
};


const dimListTemp_Bck = {
    'Account': {fieldName: 'account', desc: 'Chart of Accounts', type: 'Account', table: {name: 'tabaccount2', id: 'name', desc: 'account_name', parent: {H1: 'parent_account', H2: 'old_parent'}}},
    'Company': {fieldName: 'company', desc: 'Company', type: 'Entity', table: {name: 'tabcompany', id: 'name', desc: 'company_name', parent: {}}},
    'Employee': {fieldName: 'employee', desc: 'Employee name', type: 'Person', table: {name: 'tabemployee', id: 'name', desc: 'employee_name' , parent: {}}},
    'Department': {fieldName: 'department', desc: 'Department', type: 'Other', table: {name: 'tabdepartment', id: 'name', desc: 'department_name', parent: {}}},
    'Customer': {fieldName: 'customer', desc: 'Customer name', type: 'Person', table: {name: 'tabcustomer', id: 'name', desc: 'customer_name', parent: {}}},
    'Patient': {fieldName: 'patient', desc: 'Patient name', type: 'Person', table: {name: 'tabpatient', id: 'name', desc: 'patient_name', parent: {}}},
    'Supplier': {fieldName: 'supplier', desc: 'Supplier', type: 'Other', table: {name: 'tabsupplier', id: 'name', desc: 'supplier_name', parent: {}}},
    'Movement': {fieldName: '', desc: 'Movement', type: 'Movement', table: {name: 'zmovement', id: 'name', desc: 'description', parent: {H1: 'parenth1'}}},
    'Time': { fieldName: 'posting_date', desc: 'Time', type: 'Time', table: {name: 'ztime', id: 'name', desc: 'description', parent: {H1: 'parenth1'}} },
    'Balance': { fieldName: '', desc: 'Balance', type: 'Other', table: {name: 'zbalance', id: 'name', desc: 'description', parent: {H1: 'parenth1'}}},
    'Measures': { fieldName: '', desc: 'Measures', type: 'Measures', members: measuresList }
};


module.exports = {
    dimListTemp, measuresList
}