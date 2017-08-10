/*************************************************************************
* Global ScriptWide Constants
*********/

//Spreadsheet constant names
var SPREADSHEET_ID = '1ztRn2hwAhLnW16LLCouZ_cYrH3L8rT2SAeoJr3uFnro';

var placeLoanWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PlaceLoan');
var parameterWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Parameters');
var poloniexBalanceWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PoloniexBalances');
var poloniexLendBookWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PoloniexLendingBook');
var poloniexLendLogWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LendLog');
var poloniexLendBookLogWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LendBookLog');
var errLogWs = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log');


//Logging enums
var Level = Object.freeze({
  OFF:    Number.MAX_VALUE,
  SEVERE: 1000,
  WARNING:900,
  INFO:   800,
  CONFIG: 700,
  FINE:   500,
  FINER:  400,
  FINEST: 300,
  ALL: Number.MIN_VALUE});