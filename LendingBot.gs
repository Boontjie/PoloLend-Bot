function runLendingBot(){
  
  //Try to run the bot, if any error terminates execution, set bot state to idle
  try{
    var lendbot = new LendingBot();
    lendbot.runBot();
  }
  catch(e){
    PropertiesService.getScriptProperties().setProperty('LendingBotRunstate', 'idle');
  }
}

function runCounterPolo(){
  var RunCounter = PropertiesService.getScriptProperties().getProperty('RunCounter');
  var TotalRuntime = PropertiesService.getScriptProperties().getProperty('TotalRuntime');
  var t = Date.now();
  pingPolo();
  PropertiesService.getScriptProperties().setProperty('TotalRuntime', Date.now() - t + +TotalRuntime);
  PropertiesService.getScriptProperties().setProperty('RunCounter', +RunCounter+1);
  
  
}

function pingPolo(){
/**
* Pings the poloniex API to check whether the loanbot should run before the refresh timer hits 0
*
* The bot will run if it detects available balance in the lending account above prescribed Poloniex 
* minimums and reset the refresh timer.
*/ 
  
  //Start the countdowntimer for the ping
  var startDateTime = new Date();
    
  var botRunstate = PropertiesService.getScriptProperties().getProperty('LendingBotRunstate')
  var refreshTimeRemaining = PropertiesService.getScriptProperties().getProperty("refreshTimeRemaining");
  
  
  var exchInst = new poloniexApi(gSheet.APIKEY, gSheet.SECRETKEY);
  
  //Check if the next loan refresh needs to occur - timer exists & timer has hit 0 & bot is not currently running
  if (botRunstate != 'running' & refreshTimeRemaining != null & refreshTimeRemaining <= 0) {
    runLendingBot();
    return;
  }
  
  
  var loanRefreshPossible = false;
  var parcedData = exchInst.returnAvailableAccountBalances();

  //As long as any currency is lendable, the bot should be run
  for(var curr in parcedData['lending']){ //Will only loop through currencies that have available account balances
    for(var key in gSheet.currToLend){
      if(  gSheet.currToLend[key]==curr & parcedData['lending'][curr] >= gSheet.currMinLendAmt[key] & gSheet.currToLendAllowed[key] == 'YES' ){
        loanRefreshPossible = true;
       }
    }
  }
  
  //There is enough balance active in the account to loan
  if(loanRefreshPossible & botRunstate != 'running'){
    runLendingBot();
    return;}
  
  //Check if there are open loans, if so, reduce the timer by the timerlag and runtime lag
  if(exchInst.returnOpenLoanOffers().length > 0){
    var stopDateTime = new Date();
    //Calculate the time elapsed and allow at the timer to be reduced by 1 second at minimum.
    refreshTimeRemaining = +refreshTimeRemaining - Math.floor( (+stopDateTime.getTime() - +startDateTime.getTime()) / 1000 ) - 30
    PropertiesService.getScriptProperties().setProperty("refreshTimeRemaining", refreshTimeRemaining); // cache for 1.5 minutes
  }
}

var LendingBot = function(){
  
  /*************************************************************************
  * LendingBot Globals
  *********/
  var USE_BETTERLOG = true;
  var CLEAR_ERR_LOG = false;
  var CLEAR_LEND_LOG = false;
  var CLEAR_LENDBOOK_LOG = false;
  
  /*************************************************************************
  * LendingBot Constant and Object Initialization
  * The spreadsheet allows many parameters to be easily customised and set by the user
  *********/
  
  //Global constants for bot
  this.apiKey = gSheet.APIKEY;
  this.secretKey = gSheet.SECRETKEY;
  this.timeToLoanOfferRefresh = parameterWs.getRange(21, 4, 1, 1).getValue();
  
  //List spreadsheet constants 
  this.lendCurrWhitelist = gSheet.lendCurrWhitelist;
  this.currToLend = gSheet.currToLend;
  this.currToLendAllowed = gSheet.currToLendAllowed;
  this.currMinLendAmt = gSheet.currMinLendAmt;
    
  //Create an API instance for use throughout the bot
  this.exchInst = new poloniexApi(this.apiKey,this.secretKey);
  
  //Custom errorlogging and output - copied from BetterLog and adapted to class approach
  //Clear logs
  clearLog(errLogWs, CLEAR_ERR_LOG, 1);
  clearLog(poloniexLendLogWs, CLEAR_LEND_LOG, 2);
  clearLog(poloniexLendBookLogWs, CLEAR_LENDBOOK_LOG, 5);
  
  if(USE_BETTERLOG){
    var logClassInstance = new BetterLog(USE_BETTERLOG);
    logClassInstance.Level_ = logClassInstance.Level().INFO;
  Logger = logClassInstance.useSpreadsheet(SPREADSHEET_ID); 
  }  
  
  /*************************************************************************
  * LendingBot Functions
  *********/

  
  this.runBot = function(){
    PropertiesService.getScriptProperties().setProperty('LendingBotRunstate', 'running');                //Update lendingbot state from idle to running as soon as the bot is run.
    CacheService.getScriptCache().put("refreshTimeRemaining", this.timeToLoanOfferRefresh, 120);         //Update the cached time to next refresh as soon as bot is run
    
    Logger.info('Starting Google Apps Script Lending Bot for Poloniex.')

    /**** Cancel all open loan offers ****/
    Logger.info('Cancelling open loan offers.')
    this.cancelOpenLoanOffers();
    
    /**** Update cryptocurrency balances ****/
    Logger.info('Obtaining current balances.')
    this.getCurrBalances();
     
    /**** Perform strategy created for each cryptocurrency ****/    
    for(var key in this.currToLend){
      
      /**** Update cryptocurrency balances ****/
      //  Validate whether the currency is in the list of currencies we have a strategy for in the placeloan sheet
      if(this.lendCurrWhitelist.indexOf(this.currToLend[key]) == -1) {
        Logger.warning('No lending strategy available for chosen cryptocurrency'); 
        continue;
      }
      //  Validate whether the currency is available to lend
      if(this.currToLendAllowed[key] == 'NO') {
        Logger.info('Cryptocurrency ' + this.currToLend[key] + ' is deactivated for lending.'); 
        continue;
      }
      
      //Obtain the loanbook and push to spreadsheet. The spreadsheet then performs the calculations
      //related to loan strategy and outputs the loans to be offered to 'PlaceLoan' sheet
      poloniexLendBookWs.getRange(1,1,1,1).setValue(this.currToLend[key]);
      
      
      
      
      Logger.info('Filling loanbook and applying calculations.');
      this.fillLoanBook(this.currToLend[key]);
      
      Logger.info('Attempting to place loans for ' + this.currToLend[key]);
      this.placeLoans(key);
      
      //MarketData logging
      this.logLendBook(this.currToLend[key]);
    }
    
    //Update lendingbot state from running to idle as soon as the bot is finished running.
    PropertiesService.getScriptProperties().setProperty('LendingBotRunstate', 'idle');
    
  };
  
  this.cancelOpenLoanOffers = function(){
    var openLoanOffers = this.exchInst.returnOpenLoanOffers();
    for(var curr in openLoanOffers){
      this.exchInst.cancelLoanOffer(openLoanOffers[curr][0]['id'])
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
  
  this.placeLoans = function(index){
    var loanLoc = findRow(placeLoanWs, 'LOAN');
    for(var n in loanLoc){
      var currency = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(1, 0).getValue();
      var amount = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(2, 0).getValue();
      var duration = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(3, 0).getValue();
      var autorenew = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(4, 0).getValue();
      var lendingrate = placeLoanWs.getRange(loanLoc[n][0],loanLoc[n][1],1,1).offset(5, 0).getValue();
      
      if(this.currToLend[index] == currency & amount > 0 & amount < this.currMinLendAmt[index]){  
        Logger.warning('Insufficient balance in loan to satisfy Poloniex minimum loan requirement. Minimum required is ' + this.currMinLendAmt[index] + ' ' + this.currToLend[index] + '. Amount provided is ' + amount + '. Operation aborted.');
        return;
      }
      
      if(this.currToLend[index] == currency & amount >= this.currMinLendAmt[index]){  
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

