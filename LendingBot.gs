function run(){
  var lendbot = new LendingBot();
  lendbot.runBot();
}


var LendingBot = function(){
  /*************************************************************************
  * LendingBot Globals
  *********/
  var USE_BETTERLOG = true;
  var CLEAR_ERR_LOG = true;
  var CLEAR_LEND_LOG = false;
  var CLEAR_LENDBOOK_LOG = false;
  
  /*************************************************************************
  * LendingBot Constant and Object Initialization
  *********/
  
  //Object constants
  this.linkedWb = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  //Global constants for bot
  this.apiKey = parameterWs.getRange('APIKEY').getValue();
  this.secretKey = parameterWs.getRange('SECRETKEY').getValue();
  
  //List constants
  this.lendCurrWhitelist = getAllNonEmptyCells(     placeLoanWs.getRange(3, 3, 1,placeLoanWs.getLastColumn()).getValues()[0]     );
  this.currToLend = getAllNonEmptyCells(    parameterWs.getRange(11, 3, 1,parameterWs.getLastColumn()).getValues()[0]    );
  
  //Create an API instance for use throughout the bot
  this.exchInst = new poloniexApi(this.apiKey,this.secretKey);
  
  //Custom errorlogging and output - copied from BetterLog and adapted to class approach
  //Clear logs
  clearLog(errLogWs, CLEAR_ERR_LOG, 1);
  clearLog(poloniexLendLogWs, CLEAR_LEND_LOG, 2);
  clearLog(poloniexLendBookLogWs, CLEAR_LENDBOOK_LOG, 5);
  
  var logClassInstance = new BetterLog(USE_BETTERLOG);
  logClassInstance.Level_ = Level.INFO;
  Logger = logClassInstance.useSpreadsheet(SPREADSHEET_ID);   
  
  /*************************************************************************
  * LendingBot Functions
  *********/
  
  this.runBot = function(){
    Logger.info('Starting Google Apps Script Lending Bot for Poloniex.')

    Logger.info('Cancelling open loan offers.')
    this.cancelOpenLoanOffers();
    
    Logger.info('Obtaining current balances.')
    this.getCurrBalances();
    
    for(var key in this.currToLend){
      //  Validate whether the currency has any available balance to loan before obtaining loan book
      if(this.lendCurrWhitelist.indexOf(this.currToLend[key]) == -1) {continue}
      
      //Obtain the loanbook and push to spreadsheet. The spreadsheet then performs the calculations
      //related to loan strategy and outputs the loans to be offered to 'PlaceLoan' sheet
      poloniexLendBookWs.getRange(1,1,1,1).setValue(this.currToLend[key]);
      
      Logger.info('Filling loanbook and applying calculations.');
      this.fillLoanBook(this.currToLend[key]);
      
      Logger.info('Attempting to place loans for ' + this.currToLend[key]);
      this.placeLoans(this.currToLend[key]);
      
      //MarketData logging
      this.logLendBook(this.currToLend[key]);
    }
  };
  
  this.cancelOpenLoanOffers = function(){
    var openLoanOffers = this.exchInst.returnOpenLoanOffers();
    for(var curr in this.lendCurrWhitelist){
      var openLoanOffersbyCurr = openLoanOffers[curr];
      for(var openLoanOffer in openLoanOffersbyCurr){
        this.exchInst.cancelLoanOffer(openLoanOffer['id'])
      };
    };
  };
  
  this.getCurrBalances = function(){
    //Get a list of all currencies and balances - balances not used.
    var parcedData = this.exchInst.returnBalances();
    var totalBalances = []
    
    for(var key in parcedData)
    {
      totalBalances.push([key, parcedData[key]]);
    }

    poloniexBalanceWs.getRange(6, 4, totalBalances.length, 4).setValue(0);  //Zeroise all balances before populating new values
    
    
    var parcedData = this.exchInst.returnAvailableAccountBalances();
    var walletBalances = []
    
    for(var key in totalBalances) {
      
      key = totalBalances[key][0]  //Convert the key which is an index to a currencyname
      
      //Does the currency have a balance? If so, add its balance, else all currency balances are 0
            
      if(JSON.stringify(parcedData).indexOf(key) >= 0){
        walletBalances.push([key,
                             
                             (+this.exchInst.returnAvailableBalance(parcedData,'exchange',key)
                              +this.exchInst.returnAvailableBalance(parcedData,'margin',key)
                             +this.exchInst.returnAvailableBalance(parcedData,'lending',key)),
                             
                             this.exchInst.returnAvailableBalance(parcedData,'exchange',key),
                             
                             this.exchInst.returnAvailableBalance(parcedData,'margin',key),
                             
                             this.exchInst.returnAvailableBalance(parcedData,'lending',key)]);
      }
      else
      {
        walletBalances.push([key,0,0,0,0]);
      }
    }
    
    poloniexBalanceWs.getRange(6, 3, walletBalances.length, walletBalances[0].length).setValues(walletBalances);
  };
  
  
  
  
  this.fillLoanBook = function(currency){
    //  
    //  Obtain the current loanbook for the chosen currency and push to variables in memory 
    //
    var parcedData = this.exchInst.returnLoanOrders(currency)
    
    var offers = [];
    var cumAmount = 0;
    offers.push(['amount', 'cumulative amount', 'rate', 'rangeMax', 'rangeMin']);
    
    for(var key in parcedData.offers)
    {
      cumAmount = cumAmount + +parcedData.offers[key].amount
      offers.push([parcedData.offers[key].amount, cumAmount, parcedData.offers[key].rate,parcedData.offers[key].rangeMax,parcedData.offers[key].rangeMin]);
    }
    
    var demands = [];
    var cumAmount = 0;
    demands.push(['amount', 'cumulative amount', 'rate', 'rangeMax', 'rangeMin']);
    
    for(var key in parcedData.demands)
    {
      cumAmount = cumAmount + +parcedData.demands[key].amount
      demands.push([parcedData.demands[key].amount, cumAmount, parcedData.demands[key].rate,parcedData.demands[key].rangeMax,parcedData.demands[key].rangeMin]);
    }
    
    
    //
    //  Link to a pre-setup google sheet, drop the lending book information from the variables into this sheet for processing
    //
    
    poloniexLendBookWs.getRange(3 , 2, getFirstEmptyRow(poloniexLendBookWs, 'B3:B65000') + 1, 10).clearContent();
    
    poloniexLendBookWs.getRange(3, 2, offers.length, offers[0].length).setValues(offers); 
    poloniexLendBookWs.getRange(3, 7, demands.length, demands[0].length).setValues(demands); 
  };
  
  this.placeLoans = function(currCrypto){
    var loanLoc = findRow(placeLoanWs, 'LOAN');
    for(var n in loanLoc){
      var currency = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(1, 0).getValue();
      var amount = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(2, 0).getValue();
      var duration = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(3, 0).getValue();
      var autorenew = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(4, 0).getValue();
      var lendingrate = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(5, 0).getValue();
      
      if(currCrypto == currency & amount > 0){  
        var orderID = this.exchInst.createLoanOffer(currency, amount, duration, autorenew, lendingrate);
        this.logLoans(orderID, currency, amount, duration, autorenew, lendingrate, 'N');
      }      
    }      
  }
  
  this.logLoans = function(orderID, currency, amount, duration, autorenew, lendingrate, persistence){
    
    //If no loan was placed due to api error, do not log
    if(orderID == null){return};
    var date = new Date().toLocaleString();
    poloniexLendLogWs.getRange(getFirstEmptyRow(poloniexLendLogWs, 'A:A') + 1,1,1,8).setValues([[orderID,currency, amount, duration, autorenew, lendingrate, persistence, date]]);      
  };
  
  this.logLendBook = function(currency){
    
    //If no loan was placed due to api error, do not log
    poloniexLendBookLogWs.getRange(3,2).setValue(currency);
    poloniexLendBookLogWs.getRange(getFirstEmptyRow(poloniexLendBookLogWs, 'A:A') + 1,1,1,poloniexLendBookLogWs.getLastColumn()).setValues(
    poloniexLendBookLogWs.getRange(3,1,1,poloniexLendBookLogWs.getLastColumn()).getValues());      
  };
  
  /*************************************************************************
  * Spreadsheet Specific Functions
  *********/
  
  function pushWalletAdresses(wb, addresses){
    var ws = wb.getSheetByName(POLONIEX_BALANCE);
    return ws.getRange(5, 8, 119, 2).setValues(addresses);    
  }
  
}

