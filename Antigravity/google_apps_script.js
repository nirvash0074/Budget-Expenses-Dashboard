/**
 * ===================================================================
 * Personal Budget & Expense Dashboard - Google Sheets Database Backend
 * ===================================================================
 * 
 * Includes support for:
 * - Transactions (Income & Expenses)
 * - Custom Categories (Alphabetical)
 * - Category Budgets
 * - Semi-Monthly Salary Allocation (15th & 30th Cutoff Income)
 * 
 * HOW TO SET UP IN 2 MINUTES:
 * 1. Open Google Sheets (https://sheets.new) to create a new spreadsheet.
 * 2. In the top menu, click: Extensions > Apps Script.
 * 3. Delete any code in the editor, paste this entire file, and click the Save icon.
 * 4. Click: Deploy > New deployment.
 * 5. Click the gear icon next to "Select type" and choose "Web app".
 * 6. Set Description: "Budget Dashboard API"
 *    Set "Execute as": "Me"
 *    Set "Who has access": "Anyone"  <-- IMPORTANT so your dashboard can connect!
 * 7. Click "Deploy", authorize permissions when prompted, and COPY the "Web app URL".
 * 8. Paste that Web app URL into your Budget Dashboard in the "Google Sheets DB" settings!
 * ===================================================================
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheets(ss);

    var action = (e && e.parameter && e.parameter.action) || 'read';
    var postData = null;

    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        if (postData.action) action = postData.action;
      } catch (err) {}
    }

    var result = { status: 'success' };

    if (action === 'ping') {
      result = {
        status: 'success',
        sheetName: ss.getName(),
        sheetUrl: ss.getUrl(),
        message: 'Google Sheets Database is connected and active!'
      };
    } else if (action === 'read' || action === 'get_data') {
      var userId = (e && e.parameter && e.parameter.userId) || (postData && postData.userId) || '';
      result = readUserData(ss, userId);
    } else if (action === 'add_transaction' || action === 'save_transaction') {
      result = saveTransaction(ss, postData.transaction, postData.userId);
    } else if (action === 'delete_transaction') {
      result = deleteTransaction(ss, postData.transactionId, postData.userId);
    } else if (action === 'save_salary') {
      result = saveSalaryData(ss, postData.salaryData, postData.userId);
    } else if (action === 'sync_all' || action === 'push_all') {
      result = syncAllData(ss, postData);
    } else {
      result = { status: 'success', message: 'API ready. Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Automatically creates and formats the database sheets with headers
 */
function initSheets(ss) {
  // 1. Transactions Sheet
  var txSheet = ss.getSheetByName('Transactions');
  if (!txSheet) {
    txSheet = ss.insertSheet('Transactions');
    txSheet.appendRow([
      'ID', 'User ID', 'Date', 'Type', 'Category', 
      'Description', 'Amount', 'Payment Method', 'Notes', 'Created At'
    ]);
    txSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
    txSheet.setFrozenRows(1);
  }

  // 2. Categories Sheet
  var catSheet = ss.getSheetByName('Categories');
  if (!catSheet) {
    catSheet = ss.insertSheet('Categories');
    catSheet.appendRow(['Category Name', 'Type', 'Monthly Budget Target', 'User ID']);
    catSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#6366f1').setFontColor('#ffffff');
    catSheet.setFrozenRows(1);
  }

  // 3. Budgets Sheet
  var budgetSheet = ss.getSheetByName('Budgets');
  if (!budgetSheet) {
    budgetSheet = ss.insertSheet('Budgets');
    budgetSheet.appendRow(['User ID', 'Category', 'Monthly Target', 'Updated At']);
    budgetSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f59e0b').setFontColor('#ffffff');
    budgetSheet.setFrozenRows(1);
  }

  // 4. Salary Cutoffs Sheet (15th and 30th)
  var salSheet = ss.getSheetByName('Salary');
  if (!salSheet) {
    salSheet = ss.insertSheet('Salary');
    salSheet.appendRow([
      'Month Key', 'Month Label', 'Income 15th', 'Income 30th', 'Total Budget', 'User ID', 'Updated At'
    ]);
    salSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('#ffffff');
    salSheet.setFrozenRows(1);
  }
}

/**
 * Reads all data for a specific user (or all if empty)
 */
function readUserData(ss, userId) {
  var txSheet = ss.getSheetByName('Transactions');
  var catSheet = ss.getSheetByName('Categories');
  var budgetSheet = ss.getSheetByName('Budgets');
  var salSheet = ss.getSheetByName('Salary');

  var transactions = [];
  var expenseCategories = [];
  var incomeCategories = [];
  var budgets = {};
  var salaryMonths = {};

  // Read transactions
  var txData = txSheet.getDataRange().getValues();
  for (var i = 1; i < txData.length; i++) {
    var row = txData[i];
    if (!row[0]) continue;
    var rowUser = String(row[1] || '');
    if (!userId || rowUser === userId || !rowUser) {
      transactions.push({
        id: String(row[0]),
        userId: rowUser,
        date: formatDate(row[2]),
        type: String(row[3] || 'expense').toLowerCase(),
        category: String(row[4] || 'Other'),
        desc: String(row[5] || ''),
        amount: Number(row[6] || 0),
        method: String(row[7] || 'Card'),
        notes: String(row[8] || '')
      });
    }
  }

  // Read categories
  var catData = catSheet.getDataRange().getValues();
  for (var j = 1; j < catData.length; j++) {
    var cRow = catData[j];
    var cName = String(cRow[0] || '').trim();
    var cType = String(cRow[1] || 'expense').toLowerCase();
    var cBudget = Number(cRow[2] || 0);
    var cUser = String(cRow[3] || '');

    if (cName && (!userId || !cUser || cUser === userId)) {
      if (cType === 'income') {
        if (incomeCategories.indexOf(cName) === -1) incomeCategories.push(cName);
      } else {
        if (expenseCategories.indexOf(cName) === -1) expenseCategories.push(cName);
        if (cBudget > 0) budgets[cName] = cBudget;
      }
    }
  }

  // Read budgets
  var bData = budgetSheet.getDataRange().getValues();
  for (var k = 1; k < bData.length; k++) {
    var bRow = bData[k];
    var bUser = String(bRow[0] || '');
    var bCat = String(bRow[1] || '').trim();
    var bTarget = Number(bRow[2] || 0);
    if (bCat && (!userId || !bUser || bUser === userId)) {
      budgets[bCat] = bTarget;
    }
  }

  // Read salary cutoffs
  if (salSheet) {
    var sData = salSheet.getDataRange().getValues();
    for (var m = 1; m < sData.length; m++) {
      var sRow = sData[m];
      var sMonth = (sRow[0] instanceof Date) ? Utilities.formatDate(sRow[0], Session.getScriptTimeZone() || 'GMT', 'yyyy-MM') : String(sRow[0] || '').trim();
      var sLabel = (sRow[1] instanceof Date) ? Utilities.formatDate(sRow[1], Session.getScriptTimeZone() || 'GMT', 'MMMM yyyy') : String(sRow[1] || sMonth);
      var sUser = String(sRow[5] || '');
      if (sMonth && (!userId || !sUser || sUser === userId)) {
        salaryMonths[sMonth] = {
          monthKey: sMonth,
          monthLabel: sLabel,
          income15th: Number(sRow[2] || 0),
          income30th: Number(sRow[3] || 0),
          totalBudget: Number(sRow[4] || 0)
        };
      }
    }
  }

  return {
    status: 'success',
    sheetName: ss.getName(),
    sheetUrl: ss.getUrl(),
    transactions: transactions,
    expenseCategories: expenseCategories,
    incomeCategories: incomeCategories,
    budgets: budgets,
    salaryMonths: salaryMonths
  };
}

/**
 * Appends or updates a transaction in the Google Sheet
 */
function saveTransaction(ss, tx, userId) {
  var txSheet = ss.getSheetByName('Transactions');
  var data = txSheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(tx.id)) {
      foundRow = i + 1;
      break;
    }
  }

  var rowValues = [
    String(tx.id),
    userId || '',
    tx.date,
    tx.type,
    tx.category,
    tx.desc,
    Number(tx.amount),
    tx.method || 'Card',
    tx.notes || '',
    new Date()
  ];

  if (foundRow > 0) {
    txSheet.getRange(foundRow, 1, 1, 10).setValues([rowValues]);
  } else {
    txSheet.appendRow(rowValues);
  }

  return { status: 'success', message: 'Transaction saved to Google Sheet', txId: tx.id };
}

/**
 * Deletes a transaction from the Google Sheet
 */
function deleteTransaction(ss, txId, userId) {
  var txSheet = ss.getSheetByName('Transactions');
  var data = txSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(txId)) {
      txSheet.deleteRow(i + 1);
      return { status: 'success', message: 'Row deleted from Google Sheet' };
    }
  }

  return { status: 'not_found', message: 'Transaction ID not found in Sheet' };
}

/**
 * Saves or updates salary cutoff allocation
 */
function saveSalaryData(ss, salaryData, userId) {
  var salSheet = ss.getSheetByName('Salary');
  if (!salSheet) return { status: 'error', message: 'Salary sheet missing' };

  var rows = [['Month Key', 'Month Label', 'Income 15th', 'Income 30th', 'Total Budget', 'User ID', 'Updated At']];
  Object.keys(salaryData || {}).forEach(function(mKey) {
    var item = salaryData[mKey];
    rows.push([
      mKey,
      item.monthLabel || mKey,
      Number(item.income15th || 0),
      Number(item.income30th || 0),
      Number(item.totalBudget || 0),
      userId || '',
      new Date()
    ]);
  });

  salSheet.clearContents();
  salSheet.getRange(1, 1, rows.length, 7).setValues(rows);
  return { status: 'success', message: 'Salary cutoffs saved to Google Sheet' };
}

/**
 * Pushes complete personal dashboard dataset to Google Sheets
 */
function syncAllData(ss, payload) {
  var userId = payload.userId || '';
  var transactions = payload.transactions || [];
  var expenseCategories = payload.expenseCategories || [];
  var budgets = payload.budgets || {};
  var salaryMonths = payload.salaryMonths || {};

  var txSheet = ss.getSheetByName('Transactions');
  var catSheet = ss.getSheetByName('Categories');
  var budgetSheet = ss.getSheetByName('Budgets');
  var salSheet = ss.getSheetByName('Salary');

  // Push Transactions
  if (transactions.length > 0) {
    var rowsToKeep = [txSheet.getDataRange().getValues()[0]];
    transactions.forEach(function(tx) {
      rowsToKeep.push([
        String(tx.id),
        userId,
        tx.date,
        tx.type,
        tx.category,
        tx.desc,
        Number(tx.amount),
        tx.method || 'Card',
        tx.notes || '',
        new Date()
      ]);
    });
    txSheet.clearContents();
    txSheet.getRange(1, 1, rowsToKeep.length, 10).setValues(rowsToKeep);
  }

  // Push Categories & Budgets
  if (expenseCategories.length > 0) {
    var catRows = [['Category Name', 'Type', 'Monthly Budget Target', 'User ID']];
    expenseCategories.forEach(function(c) {
      catRows.push([c, 'expense', Number(budgets[c] || 0), userId]);
    });
    catSheet.clearContents();
    catSheet.getRange(1, 1, catRows.length, 4).setValues(catRows);
  }

  // Push Salary data
  if (salSheet && Object.keys(salaryMonths).length > 0) {
    saveSalaryData(ss, salaryMonths, userId);
  }

  return {
    status: 'success',
    message: 'All dashboard data and salary allocations pushed to Google Sheets!',
    sheetUrl: ss.getUrl()
  };
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd');
  }
  return String(val);
}
