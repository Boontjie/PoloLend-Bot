/*************************************************************************
The point of wrapper functions is many fold:
    * to extend the baseAPI functionality
    * keep the cluttering away from the basic API functions
    * to validate the parameters of baseAPI calls before sending them
    * trapping errors
*********/



var poloniexApi = function(apiKey,secretKey) {
  
  //Inherit all functions from the exchange API
  exchangePoloApi.call(this,apiKey,secretKey);
  
  /*************************************************************************
  * Wrapper functions in addition to default API functions - extends API
  *********/
  
  
  
    /*************************************************************************
    * Wrapper functions : Base API
  *********/
  
  this.createLoanOffer = function(currency, amount, duration, autorenew, lendingrate){
    /******
    * Perform basic validation on parameters before wasting API call
    */
    if (currency == undefined) {  // argument not passed or undefined
        Logger.warning('Function createLoanOffer in PoloAPIWrapper has no currency parameter. Operation aborted.');
        return;
    }
    
    if (amount == undefined) {  // argument not passed or undefined
        Logger.warning('Function createLoanOffer in PoloAPIWrapper has no amount parameter. Operation aborted.');
        return;
    } else {
      if(amount < 0){
        Logger.warning('Function createLoanOffer in PoloAPIWrapper has negative loan amount. Operation aborted.');
        return;
      }
    }
    
    if (duration == undefined) {  // argument not passed or undefined
        Logger.warning('Function createLoanOffer in PoloAPIWrapper has no duration parameter. Operation aborted.');
        return;
    } else {
      if(duration < MIN_NUM_LOAN_DAYS){
        Logger.warning('Function createLoanOffer in PoloAPIWrapper duration parameter is too low. Minimum number of days is ' + MIN_NUM_LOAN_DAYS +'. Operation aborted.');
        return;
      }
      
      if(duration > MAX_NUM_LOAN_DAYS){
        Logger.warning('Function createLoanOffer in PoloAPIWrapper duration parameter is too high. Maximum number of days is ' + MAX_NUM_LOAN_DAYS +'. Operation aborted.');
        return;
      }
    }
    
    if (autorenew == undefined) {  // argument not passed or undefined
      Logger.warning('Function createLoanOffer in PoloAPIWrapper has no autorenew parameter. Operation aborted.');
      return;
    } else {
      if(!(autorenew == 0 || autorenew == 1)){
        Logger.warning('Function createLoanOffer in PoloAPIWrapper has an unsupported value for autorenew parameter.  Only values 0 or 1 is allowed. Operation aborted.');
        return;
      }
    }
    
    if (lendingrate == undefined) {  // argument not passed or undefined
      Logger.warning('Function createLoanOffer in PoloAPIWrapper has no lendingrate parameter. Operation aborted.');
      return;
    } else {
      if(lendingrate <= 0){
        Logger.warning('Function createLoanOffer in PoloAPIWrapper has negative or zero lendingrate amount. Operation aborted.');
        return;
      }
    }   
    
    var parcedData = this.baseApiCreateLoanOffer(currency, amount, duration, autorenew, lendingrate)
    return parcedData['orderID']
  }
  
  this.returnAvailableAccountBalances = function(){
    var t = Date.now();
    var value = this.baseApiReturnAvailableAccountBalances();
    Logger.fine('"returnAvailableAccountBalances" runtime: ' + (Date.now() - t)/1000 + ' seconds.');
    return value;
  }
  
  this.returnOpenLoanOffers = function(){
    var t = Date.now();
    var value = this.baseApiReturnOpenLoanOffers()
    Logger.fine('"returnOpenLoanOffers" runtime: ' + (Date.now() - t)/1000 + ' seconds.')
    return value;
  }
  
  
  
  
    /*************************************************************************
  * Wrapper functions : Extend Base API
  *********/
  
  //Illustration of renaming an existing function
  this.returnAllOpenOrders = function (){
    return this.returnOpenOrders();
  }
  
  //return a parced list of all deposit addresses
  this.returnAllDepositAddresses = function(){
    var tempArray = []
    var parcedData = this.returnDepositAddresses();
    for(var key in parcedData){
      tempArray.push([key, parcedData[key]])}
    return tempArray;
  };
  
  //generate a new deposit address for all currencies
  this.generateNewAddressAllCurrencies = function(){
    var parcedData = this.exchInstance.returnBalances();
    for(var key in parcedData){
      this.exchInstance.generateNewAddress(key);
      Utilities.sleep(1000); //Need to sleep to avoid nonce errors - generation of addresses extremely fast
    }
  }
  
  //return the available balance by wallet and currency - this is an API parser
  this.returnAvailableBalance = function(balances, wallet, currency){
    try {
      if (balances[wallet][currency.toString()] == null) throw 0;
      return balances[wallet][currency.toString()];
    }
    
    catch(err){return 0}    
  }
}