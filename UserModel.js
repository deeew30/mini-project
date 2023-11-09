
const [db, SelectAllFrom, rawQuery, Exists, Delete] = require('../helpers/SQLHelper');
const mysql = require('mysql2');

class UserModel {
    // Each database table along with its schema is stored here temporarily in a JSON object format.
    static USER_TABLE = {
        NAME: 'users',
        USER_ID: 'userid',
        USERNAME: 'name',
        PASSWORD: 'password',
        BGROUP: 'BG',
        DOB: 'DOB',
        TYPE: 'type',
        EMAIL: 'email',
        CONTACT: 'contact',
        GENDER: 'gender',
    };

    static REPORTS_TABLE = {
        NAME: "reports",
        ID: "r_id",
        DATE: "date",
        PATIENT_ID: "P_ID",
        DOCTOR_ID: "D_ID",
        PRESCRIPTION: "prescriptions",
        DIAGNOSIS: "diagnosis"
    }

    static async fetchByEmail(Email){
        console.log(`Attempting to find ${Email} in database`);
        const CHECK_QUERY = `SELECT * FROM ${UserModel.REPORTS_TABLE.NAME} WHERE ${UserModel.REPORTS_TABLE.PATIENT_ID} IN (SELECT ${UserModel.USER_TABLE.USER_ID} FROM ${UserModel.USER_TABLE.NAME} WHERE ${UserModel.USER_TABLE.EMAIL}= ?);`;
        const SQL_CHECK_QUERY = mysql.format(CHECK_QUERY, [Email]);
        const [result, _] = await rawQuery(SQL_CHECK_QUERY);
        console.log(result);

        // SELECT * FROM REPORTS WHERE P_ID IN (SELECT user_id FROM users WHERE email = emailInput); 
        
        return result;

    }

    static async addUser(Name, BGroup, DOB, Email, Password, type, contact, gender) {
        console.log(`Attempting to add ${Email} to database`);

        //Checking if the user ALREADY exists in the database
        const CHECK_QUERY = `SELECT * FROM ${UserModel.USER_TABLE.NAME} where ${UserModel.USER_TABLE.EMAIL} = ?`;
        const SQL_CHECK_QUERY = mysql.format(CHECK_QUERY, [Email]);

        const [result, _] = await rawQuery(SQL_CHECK_QUERY);
        if (result.length != 0) {
            console.log("User Already Exists!")
            return result;

        } else {
            //if user doesnt exist, then we can excute the following code
            const QUERY = `INSERT INTO ${UserModel.USER_TABLE.NAME} VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const SQL_QUERY = mysql.format(QUERY, [Name, BGroup, DOB, Email, Password, type, contact, gender]);
            const [output, _] = await rawQuery(SQL_QUERY);
            return output;
        }
    }

    static async removeUser(email) {
        console.log(`Attempting to remove user id : ${email}`);
        return await Delete(UserModel.USER_TABLE.NAME, UserModel.USER_TABLE.EMAIL, email);
    }

    //Returns a particular user id if it exists, otherwise returns "Incorrect Password";
    static async attemptLogin(Email, Password) {
        //check if the user exists or not 
        console.log(`Task : Attempting login for user : ${Email}`);
        const result = await Exists(UserModel.USER_TABLE.NAME, UserModel.USER_TABLE.EMAIL, Email);

        if (result == false) {
            console.log(`No user with Email : ${Email}`);
            return `No user with email : ${Email}`;
        } else {
            console.log(result);
            //Accessing result[0] because the result of the query comes as an array, and we need to access the first (and should be only) element
            const STORED_PASSWORD = result[0].password;
            if (STORED_PASSWORD == Password) {
                return result[0];
            } else {
                return "Incorrect Password";
            }
        }
    }

    static async getPIDbyEmail(email) {
        const exists = await Exists(UserModel.USER_TABLE.NAME, UserModel.USER_TABLE.EMAIL, email);
        if (!exists) return "";
        const [P_ID, _] = await rawQuery(`SELECT ${UserModel.USER_TABLE.USER_ID} FROM ${UserModel.USER_TABLE.NAME} WHERE ${UserModel.USER_TABLE.EMAIL}='${email}'`)
        console.log(P_ID[0]);
        return P_ID[0];
    }

    static async generateReport(email, doctor_id, prescription, diagnosis) {
        console.log("Attempting to write a report");


        const date = new Date()
        const current_date = date.toISOString().slice(0, 10);
        let P_ID = {}

        try{
            P_ID = await UserModel.getPIDbyEmail(email);
            console.log(P_ID.userid);
            const ADD_REPORT = `INSERT INTO ${UserModel.REPORTS_TABLE.NAME} VALUES(null, ?, ?, ?, ?, ?)`;
            const SQL_ADD_REPORT = mysql.format(ADD_REPORT, [current_date, P_ID.userid, doctor_id, prescription, diagnosis])

            const result = await rawQuery(SQL_ADD_REPORT);
        return result;
        }finally{
        
        }

    }

    static async fetchAllReports(user_id){
        const FETCH_QUERY = `SELECT * FROM ${UserModel.REPORTS_TABLE.NAME} WHERE ${UserModel.REPORTS_TABLE.PATIENT_ID}=?;`
        const SQL_FETCH_QUERY = mysql.format(FETCH_QUERY, [user_id]);

        const [result, _] = await rawQuery(SQL_FETCH_QUERY);
        console.log("fetching");
        console.log(user_id);
        console.log(result);
        if(result) return result;
        return "No such patient exists!";
    }

    // // Returns a range of Expenses of past X days
    // static async getExpenseRange(range, user_id) {
    //     console.log(`Attempting to retrieve past ${range} days of expenses`);
    //     const month_ago = new Date();
    //     month_ago.setDate(month_ago.getDate() - range);
    //     const date_month_ago = month_ago.toISOString().slice(0, 19).replace("T", " ");

    //     const result = await Exists(UserModel.EXPENSE_TABLE.NAME, UserModel.EXPENSE_TABLE.USER_ID, user_id);

    //     //only proceed if there are expenses for UserModel user
    //     if (result != false) {
    //         const RECENT_EXPENSES_QUERY =
    //             `SELECT * FROM ${UserModel.EXPENSE_TABLE.NAME} where ${UserModel.EXPENSE_TABLE.USER_ID}= ? and ${UserModel.EXPENSE_TABLE.DATE} >= ? ORDER BY ${UserModel.EXPENSE_TABLE.DATE} DESC`;
    //         const SQL_RECENT_EXPENSES_QUERY = mysql.format(RECENT_EXPENSES_QUERY, [user_id, date_month_ago])
    //         const [output, _] = await rawQuery(SQL_RECENT_EXPENSES_QUERY);

    //         if (output.length == 0) {
    //             return ["No Expenses in the specified time range"];
    //         }
    //         return output;

    //     } else {
    //         return ["No expenses for UserModel user, ever."];
    //     }
    // }

    // //Returns the sum of expenses made by a user, per day, for X number of past days.
    // static async getExpensesByDay(range, user_id){
    //     console.log(`Attempting to get past ${range} days, grouped by each day`);
    //     const exists = await Exists(UserModel.EXPENSE_TABLE.NAME, UserModel.EXPENSE_TABLE.USER_ID, user_id);

    //     const month_ago = new Date();
    //     month_ago.setDate(month_ago.getDate() - range);
    //     const date_month_ago = month_ago.toISOString().slice(0, 19).replace("T", " ");

    //     // We are converting DATETIME to DATE here, for sake of simplicity when representing data over a graph
    //     const RECENT_EXPENSES_QUERY =
    //             `SELECT SUM(${UserModel.EXPENSE_TABLE.AMOUNT}) AS amount, DATE(${UserModel.EXPENSE_TABLE.DATE}) AS date FROM ${UserModel.EXPENSE_TABLE.NAME} WHERE ${UserModel.EXPENSE_TABLE.USER_ID}= ? AND ${UserModel.EXPENSE_TABLE.DATE} >= ? GROUP BY DATE(${UserModel.EXPENSE_TABLE.DATE}) ORDER BY DATE(${UserModel.EXPENSE_TABLE.DATE})`;
    //     const SQL_RECENT_EXPENSES_QUERY = mysql.format(RECENT_EXPENSES_QUERY, [user_id, date_month_ago]);

    //     if(exists){
    //         const [result, _] = await rawQuery(SQL_RECENT_EXPENSES_QUERY);
    //         return result;
    //     }else{
    //         return `User ID = ${user_id} doesn't exist`;
    //     }
    // }

    // //Groups part X days of expenses by BOTH date and category
    // static async getExpensesByDayGroupedByCategory(range, user_id){
    //     console.log(`Attempting to get past ${range} days, grouped by each day`);
    //     const exists = await Exists(UserModel.EXPENSE_TABLE.NAME, UserModel.EXPENSE_TABLE.USER_ID, user_id);

    //     const month_ago = new Date();
    //     month_ago.setDate(month_ago.getDate() - range);
    //     const date_month_ago = month_ago.toISOString().slice(0, 19).replace("T", " ");

    //     // We are converting DATETIME to DATE here, for sake of simplicity when representing data over a graph
    //     const RECENT_EXPENSES_QUERY =
    //             `SELECT SUM(${UserModel.EXPENSE_TABLE.AMOUNT}) AS amount, DATE(${UserModel.EXPENSE_TABLE.DATE}) AS date, ${UserModel.EXPENSE_TABLE.CATEGORY} AS category FROM ${UserModel.EXPENSE_TABLE.NAME} WHERE ${UserModel.EXPENSE_TABLE.USER_ID}= ? AND ${UserModel.EXPENSE_TABLE.DATE} >= ? GROUP BY ${UserModel.EXPENSE_TABLE.CATEGORY}, DATE(${UserModel.EXPENSE_TABLE.DATE})  ORDER BY DATE(${UserModel.EXPENSE_TABLE.DATE})`;
    //     const SQL_RECENT_EXPENSES_QUERY = mysql.format(RECENT_EXPENSES_QUERY, [user_id, date_month_ago]);

    //     if(exists){
    //         const [result, _] = await rawQuery(SQL_RECENT_EXPENSES_QUERY);
    //         console.log(result);
    //         return result;
    //     }else{
    //         return `User ID = ${user_id} doesn't exist`;
    //     }
    // }

    // //Returns total amount of expenses in a particular range of past X days
    // static async getTotalExpensesInRange(user_id, range){
    //     console.log(`Attempting to get sum of expenses of past ${range} days`);
    //     const exists = await Exists(UserModel.EXPENSE_TABLE.NAME, UserModel.EXPENSE_TABLE.USER_ID, user_id);

    //     const month_ago = new Date();
    //     month_ago.setDate(month_ago.getDate() - range);
    //     const date_month_ago = month_ago.toISOString().slice(0, 19).replace("T", " ");

    //     // We are converting DATETIME to DATE here, for sake of simplicity when representing data over a graph
    //     const RECENT_EXPENSES_QUERY =
    //             `SELECT SUM(${UserModel.EXPENSE_TABLE.AMOUNT}) AS amount FROM ${UserModel.EXPENSE_TABLE.NAME} WHERE ${UserModel.EXPENSE_TABLE.USER_ID}= ? AND ${UserModel.EXPENSE_TABLE.DATE} >= ? `;
    //     const SQL_RECENT_EXPENSES_QUERY = mysql.format(RECENT_EXPENSES_QUERY, [user_id, date_month_ago]);

    //     if(exists){
    //         const [result, _] = await rawQuery(SQL_RECENT_EXPENSES_QUERY);
    //         console.log(result);
    //         return result;
    //     }else{
    //         return `User ID = ${user_id} doesn't exist`;
    //     }
    // }

    // static async getTotalExpensesByCategory(user_id, range){
    //     console.log(`Attempting to get sum of expenses of past ${range} days by category`);
    //     const exists = await Exists(UserModel.EXPENSE_TABLE.NAME, UserModel.EXPENSE_TABLE.USER_ID, user_id);

    //     const month_ago = new Date();
    //     month_ago.setDate(month_ago.getDate() - range);
    //     const date_month_ago = month_ago.toISOString().slice(0, 19).replace("T", " ");

    //     const RECENT_EXPENSES_CATEGORIZED = `SELECT SUM(${UserModel.EXPENSE_TABLE.AMOUNT}) AS amount, ${UserModel.EXPENSE_TABLE.CATEGORY} FROM ${UserModel.EXPENSE_TABLE.NAME} WHERE ${UserModel.EXPENSE_TABLE.USER_ID}= ? AND ${UserModel.EXPENSE_TABLE.DATE} >= ? GROUP BY ${UserModel.EXPENSE_TABLE.CATEGORY}`;
    //     const SQL_RECENT_EXPENSES_CATEGORIZED = mysql.format(RECENT_EXPENSES_CATEGORIZED, [user_id, date_month_ago]);

    //     if(exists){
    //         const [result, _] = await rawQuery(SQL_RECENT_EXPENSES_CATEGORIZED);
    //         console.log(result);
    //         return result;
    //     }else{
    //         return `User ID = ${user_id} doesn't exist`;
    //     }
    // }

    // //Returns all expenses made by a particular used id, all of them.
    // static async getAllExpenses(UserId) {
    //     console.log(`Fetching list of all expenses made by user id : ${UserId}`);

    //     const result = await Exists(UserModel.EXPENSE_TABLE.NAME, UserModel.EXPENSE_TABLE.USER_ID, UserId);

    //     if (result) {
    //         return result;
    //     } else {
    //         console.log(`No expenses made by user id : ${UserId}`);
    //         return "no expenses made";
    //     }
    // }



    // //Adds an expense to the expenses table
    // static async addExpense(amount, category, desc, user_id) {
    //     console.log(`Attempting to add an expense for user id : ${user_id} of amount ${amount} desc: ${desc} category: ${category}`)
    //     const exists = await Exists(UserModel.USER_TABLE.NAME, UserModel.USER_TABLE.USER_ID, user_id);
    //     const date = new Date()
    //     const current_date = date.toISOString().slice(0, 19).replace("T", " ");
    //     const data_to_insert = {
    //         [UserModel.EXPENSE_TABLE.USER_ID]: user_id,
    //         [UserModel.EXPENSE_TABLE.AMOUNT]: amount,
    //         [UserModel.EXPENSE_TABLE.DESCRIPTION]: desc,
    //         [UserModel.EXPENSE_TABLE.DATE]: current_date,
    //         [UserModel.EXPENSE_TABLE.CATEGORY]: category
    //     }

    //     if (exists) {
    //         const INSERT_QUERY = `INSERT INTO ${UserModel.EXPENSE_TABLE.NAME} SET ?`
    //         const SQL_INSERT_QUERY = mysql.format(INSERT_QUERY, [data_to_insert]);

    //         const [result, _] = await rawQuery(SQL_INSERT_QUERY);
    //         if (result.affectedRows > 0) {
    //             console.log("Inserted Successfully.");
    //         }
    //         return result;
    //     } else {
    //         return "No such user exists";
    //     }

    // }

    // //Returns a mysql result object (IN JSON FORMAT), after deleting a row from the expenses table
    // static async removeExpense(expense_id) {
    //     console.log(`Attempting to delete ${expense_id} from ${UserModel.EXPENSE_TABLE.NAME}`);
    //     const DELETE_QUERY = `DELETE FROM ${UserModel.EXPENSE_TABLE.NAME} WHERE ${UserModel.EXPENSE_TABLE.EXPENSE_ID}=?`;
    //     const SQL_DELETE_QUERY = mysql.format(DELETE_QUERY, [expense_id]);

    //     const [result, _] = await rawQuery(SQL_DELETE_QUERY);
    //     if (result.affectedRows > 0) {
    //         console.log(`Deleted ${result.affectedRows} rows.`);
    //         return result;
    //     } else {
    //         console.log(`Expense ID : ${expense_id} didnt exist`);
    //         return result;
    //     }
    // }

    // //Updates the budget of a given user_id if it exists in the database
    // static async updateBudget(user_id, newBudget) {
    //     console.log(`Attempting to update budget of user : ${user_id}`);

    //     const UPDATE_QUERY = `UPDATE ${UserModel.USER_TABLE.NAME} SET ${UserModel.USER_TABLE.BUDGET} = ? WHERE ${UserModel.USER_TABLE.USER_ID} = ?`;
    //     const SQL_UPDATE_QUERY = mysql.format(UPDATE_QUERY, [newBudget, user_id]);
    //     const exists = await Exists(UserModel.USER_TABLE.NAME, UserModel.USER_TABLE.USER_ID, user_id);

    //     if (exists) {
    //         const [result, _] = await rawQuery(SQL_UPDATE_QUERY);
    //         console.log("Updated value")
    //         return result;
    //     } else {
    //         console.log("No such user exists");
    //         return "error"
    //     }
    // }


}

module.exports = UserModel;
