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
    var parcedData = this.baseApiCreateLoanOffer(currency, amount, duration, autorenew, lendingrate)
    return parcedData['orderID']
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
      Utilities.sleep(1000);
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