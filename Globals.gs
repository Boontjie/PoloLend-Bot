/*************************************************************************
* Global ScriptWide Constants
*********/

//Spreadsheet constant names
var SPREADSHEET_ID = 'ENTER YOUR SPREADSHEET ID HERE';

var placeLoanWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PlaceLoan');
var parameterWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Parameters');
var poloniexBalanceWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PoloniexBalances');
var poloniexLendBookWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PoloniexLendingBook');
var poloniexLendLogWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LendLog');
var poloniexLendBookLogWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LendBookLog');
var errLogWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log');

//Poloniex constants
MIN_NUM_LOAN_DAYS = 2
MAX_NUM_LOAN_DAYS = 60