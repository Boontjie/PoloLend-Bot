// This is to use Google Script with the Poloniex API both using public calls (GET) and private calls (POST)
// --> BTC donation: 1KEubFgqysM96CLL3oYWkNSvVMBULRCkbB  ETH donation: 0xc881632b9d123efcfc603d244d07b43cddb42ed0


// Create an exchangeapi class with a secretkey and apikey to make GET and POST calls
  var exchangePoloApi = function(apiKey,secretKey){
    this.apiKey = apiKey
    this.secretKey = secretKey


    //
    //  THIS SECTION HANDLES THE WEBCALLS
    //
    //     
    
    // The main apiCall function to ensure calls
    this.apiCall = function (params){     //params - dict entry of all parameters to send through call
      
      //If the parameters include a nonce, it has to be a private or POST call
      if (params.nonce==undefined){
        var response = UrlFetchApp.fetch('https://poloniex.com/public?' + serialize(params));
        return JSON.parse(response.getContentText())
      }
      else
      {
        // compute the signature
        var signature = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_512,
                                                serialize(params),
                                                this.secretKey);
 
        // Convert the resulting string from an array of byte (which is a standard output) to HEX
        signature = signature.map(function(byte) {
          return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
 
  
        var headers = {
          "Key" : this.apiKey,
          "Sign" : signature
        };
 
        // then we define 'options' as POST method, specifying the headers and the payload
        var options = {
          "method" : "POST",
          "headers": headers,
          "payload": serialize(params),
          "muteHttpExceptions": true
        };
 
 
        // then we fetch the url passing the 'options' which make us call the command and sign it
        var response = UrlFetchApp.fetch("https://poloniex.com/tradingApi", options);
        
        // apply errorhandling via if statements - allows specific error codes to be resolved, e.g. custom exception messages or debug output
        // more flexible than switch
        
        //HTTP success response
        if(response.getResponseCode()==200) {
          return JSON.parse(response.getContentText())};
        
        //HTTP Internal server error - Google script limits exceeded
        if(response.getResponseCode().toString().charAt(0)==5){
          Logger.severe('Internal Server Error - Daily Google Script Limits Exceeded');
            throw 'Internal Server Error - Daily Google Script Limits Exceeded';
        }
        
        //unhandled errors
        var Errstring;           
        Errstring = (
          'HTTP Exception ' + response.getResponseCode().toString() + ' in ' + params['command'] 
           + String.fromCharCode(13) + 'Truncated Server response: ' + JSON.parse(response.getContentText())['error']);
        
        Logger.severe(Errstring);
        
        Errstring = 'Parameters passed - ';
                     for(var key in params){Errstring += ' ' + key + ' : ' + params[key] + '; '};
        Logger.warning(Errstring);
        
        throw 'Truncated Server response: ' + JSON.parse(response.getContentText())['error'];             
      }
    }
    
    //
    //  THIS SECTION CONTAINS THE API FUNCTIONS
    //
    //  
    //  PUBLIC API
    
    this.returnTicker = function(){
      var params = {
          "command" : "returnTicker",
        };
      
        return this.apiCall(params);
    }
 
    this.return24Volume = function(){
      var params = {
          "command" : "return24Volume",
        };
      
        return this.apiCall(params);
    }
    
    this.returnOrderBook = function(currencyPair){
      var params = {
          'command' : 'returnOrderBook',
          'currencyPair': currencyPair
        };
      
        return this.apiCall(params);
    }
    
    this.returnMarketTradeHistory = function(currency_pair){
      // Sample output:  [{"date":"2014-02-10 04:23:23","type":"buy","rate":"0.00007600","amount":"140","total":"0.01064"},{"date":"2014-02-10 01:19:37","type":"bu
      
      var params = {
          'command' : 'returnTradeHistory',
          'currencyPair': currencyPair
        };
      
        return this.apiCall(params);
        
    }
    
    this.returnCurrencies = function(){
      // Sample output:  {"1CR":{"maxDailyWithdrawal":10000,"txFee":0.01,"minConf":3,"disabled":0},"ABY":{"maxDailyWithdr
      // Sample Call:  https://poloniex.com/public?command=returnCurrencies
      
      var params = {
          "command" : "returnCurrencies",
        };
      
        return this.apiCall(params);
    }
    
    this.returnLoanOrders = function(currency){
      // Sample output:  {"offers":[{"rate":"0.00200000","amount":"64.66305732","rangeMin":2,"rangeMax":8}, ... ],"demands":[{"rate":"0.00170000","amount":"26.54848841","rangeMin":2,"rangeMax":2}, ... ]}
      // Sample Call: https://poloniex.com/public?command=returnLoanOrders&currency=BTC
      
      var params = {
          'command' : 'returnLoanOrders',
          'currency': currency
        };
      
        return this.apiCall(params);
        
    }
    
    //  PRIVATE API
    this.transferBalance = function(currency, amount, from_account, to_account){
      
      var params = {
          'command' : 'transferBalance',
          'currency': currency, 
          'amount': amount, 
          'fromAccount': from_account,
          'toAccount': to_account,
          'nonce' : getNonce()
        };  
      
        return this.apiCall(params);
    }
    
    this.returnAvailableAccountBalances = function (){
      // Sample output:  {"exchange":{"BTC":"1.19042859","BTM":"386.52379392","CHA":"0.50000000","DASH":"120.00000000","STR":"3205.32958001", "VNL":"9673.22570147"},"margin":{"BTC":"3.90015637","DASH":"250.00238240","XMR":"497.12028113"},"lending":{"DASH":"0.01174765","LTC":"11.99936230"}}
      
      //  POLONIEX DOCUMENTATION
      //  
      //  Returns your balances sorted by account. You may optionally specify the "account" POST parameter if you wish to fetch only the balances of one 
      //  account. Please note that balances in your margin account may not be accessible if you have any open margin positions or orders.
      
      var params = {
          'command' : 'returnAvailableAccountBalances',
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
     this.returnFeeInfo = function (){
      // Sample output:  {"makerFee": "0.00140000", "takerFee": "0.00240000", "thirtyDayVolume": "612.00248891", "nextTier": "1200.00000000"}
      
      //  POLONIEX DOCUMENTATION
      //  
      //  If you are enrolled in the maker-taker fee schedule, returns your current trading fees and trailing 30-day volume in BTC. This information is updated 
      //  once every 24 hours.
      
      var params = {
          'command' : 'returnFeeInfo',
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.returnBalances = function (){
      // Sample output:  {"BTC":"0.59098578","LTC":"3.31117268", ... }
      
      //  POLONIEX DOCUMENTATION
      //  
      //  Returns all of your available balances.
      
      var params = {
          'command' : 'returnBalances',
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    
    this.returnCompleteBalances = function(){
      // Sample output:  {"LTC":{"available":"5.015","onOrders":"1.0025","btcValue":"0.078"},"NXT:{...} ... }
      
      //  POLONIEX DOCUMENTATION
      //  
      //  Returns all of your balances, including available balance, balance on orders, and the estimated BTC value of your balance. By default, this call is 
      //  limited to your exchange account; set the "account" POST parameter to "all" to include your margin and lending accounts.
      
      var params = {
          'command' : 'returnCompleteBalances',
          'account' : 'all',
          'nonce' : getNonce()
        };
      
        return this.apiCall(params);
    }
    
    this.returnDepositAddresses = function (){
      // Sample output: {"BTC":"19YqztHmspv2egyD6jQM3yn81x5t5krVdJ","LTC":"LPgf9kjv9H1Vuh4XSaKhzBe8JHdou1WgUB", ... "ITC":"Press Generate.." ... }
      
      var params = {
        'command' : 'returnDepositAddresses',
        'nonce' : getNonce()
      };
      
      return this.apiCall(params);
    }
    
    this.generateNewAddress = function(currency){
      var date = new Date();
       
      var params = {
          'command' : 'generateNewAddress',
          'currency': currency,
          'nonce' : getNonce()
        };
      
        return this.apiCall(params);
     }
    
    this.returnDepositsWithdrawals = function (){
      // Sample output: {"deposits": [{"currency":"BTC","address":"...","amount":"0.01006132","confirmations":10,"txid":"17f819a91369a9ff6c4a34216d434597cfc1b4a3d0489b46bd6f924137a47701","timestamp":1399305798,"status":"COMPLETE"},{"currency":"BTC"
      
      var params = {
          'command' : 'returnDepositsWithdrawals',
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.returnOpenOrders = function (currencyPair){
      // Sample output: {"BTC_1CR":[],"BTC_AC":[{"orderNumber":"120466","type":"sell","rate":"0.025","amount":"100","total":"2.5"},{"orderNumber":"120467","type":"sell","rate":"0.04","amount":"100","total":"4"}], ... }
      
      //Default values
      currencyPair = defaultFor(currencyPair, 'all');
      
      var params = {
          'command' : 'returnOpenOrders',
          'currencyPair' : currencyPair,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.returnTradeHistory = function (currencyPair, start, end){
      // Sample output: [{ "globalTradeID": 25129732, "tradeID": "6325758", "date": "2016-04-05 08:08:40", "rate": "0.02565498", "amount": "0.10000000", "total": "0.00256549", "fee": "0.00200000", "orderNumber": "34225313575", "type": "sell", "category": "exchange" }, { "globalTradeID": 25129628,
      var date = new Date();
      
      //Default values
      start = defaultFor(start, (Math.floor((date.getTime() / 1000)) - 315360000).toString());
      end   = defaultFor(end, Math.floor((date.getTime() / 1000)).toString());
      
      var params = {
          'command' : 'returnTradeHistory',
          'currencyPair' : currencyPair,
          'start' : start,
          'end' : end,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
     this.returnOrderTrades = function (orderNumber){
      // Sample output: [{"globalTradeID": 20825863, "tradeID": 147142, "currencyPair": "BTC_XVC", "type": "buy", "rate": "0.00018500", "amount": "455.34206390", "total": "0.08423828", "fee": "0.00200000", "date": "2016-03-14 01:04:36"}, ...]
      
      var params = {
          'command' : 'returnOrderTrades',
          'orderNumber' : orderNumber,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
     
     this.cancelOrder = function (orderNumber){
      // Sample output: {"success":1}
      
      var params = {
          'command' : 'cancelOrder',
          'orderNumber' : orderNumber,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
     
     this.moveOrder = function (orderNumber, rate, amount){
      // Sample output: {"success":1,"orderNumber":"239574176","resultingTrades":{"BTC_BTS":[]}}
       
       // POLONIEX DOCUMENTATION 
       //Cancels an order and places a new one of the same type in a single atomic transaction, meaning either both operations will succeed or both will 
       //fail. Required POST parameters are "orderNumber" and "rate"; you may optionally specify "amount" if you wish to change the amount of the new 
       //order. "postOnly" or "immediateOrCancel" may be specified for exchange orders, but will have no effect on margin orders.
      
      var params = {
          'command' : 'moveOrder',
          'orderNumber' : orderNumber,
          'rate' : rate,
          'amount' : amount,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
     
     
     this.buy = function (currencyPair, rate, amount){
      // Sample output: {"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}
      
      var params = {
          'command' : 'buy',
          'currencyPair' : currencyPair,
          'rate' : rate,
          'amount' : amount,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
       
     this.sell = function (currencyPair, rate, amount){
      // Sample output: {"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}
      
      var params = {
          'command' : 'sell',
          'currencyPair' : currencyPair,
          'rate' : rate,
          'amount' : amount,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    } 
     
     this.withdraw = function (currency, amount, address){
      // Sample output: {"response":"Withdrew 2398 NXT."}
      
      var params = {
          'command' : 'withdraw',
          'currency' : currency,
          'amount' : amount,
          'address' : address,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
     
     this.baseApiCreateLoanOffer = function (currency, amount, duration, autoRenew, lendingRate){
      // Sample output: {"success":1,"message":"Loan order placed.","orderID":10590}
      
      var params = {
          'command' : 'createLoanOffer',
          'currency' : currency,
          'amount' : amount,
          'duration' : duration,
          'autoRenew' : autoRenew,
          'lendingRate' : lendingRate,
          'nonce' : getNonce()
        };
        return this.apiCall(params);
    }
     
    this.cancelLoanOffer = function (orderNumber){
      // Sample output: {"success":1,"message":"Loan offer canceled."}
      
      var params = {
          'command' : 'cancelLoanOffer',
          'orderNumber' : orderNumber,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.returnOpenLoanOffers = function (){
      // Sample output: {"BTC":[{"id":10595,"rate":"0.00020000","amount":"3.00000000","duration":2,"autoRenew":1,"date":"2015-05-10 23:33:50"}],"LTC":[{"id":10598,"rate":"0.00002100","amount":"10.00000000","duration":2,"autoRenew":1,"date":"2015-05-10 23:34:35"}]}      
      //    
      //  POLONIEX DOCUMENTATION
      //  
      //  Returns your open loan offers for each currency.
      //
      
          var params = {
            'command' : 'returnOpenLoanOffers',
            'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.returnActiveLoans = function (){
      // Sample output: {"provided":[{"id":75073,"currency":"LTC","rate":"0.00020000","amount":"0.72234880","range":2,"autoRenew":0,"date":"2015-05-10 23:45:05","fees":"0.00006000"},{"id":74961,"currency":"LTC","rate":"0.00002000","amount":"4.43860711","range":2,"autoRenew":0,"date":"2015-05-10 23:45:05","fees":"0.00006000"}],"used":[{"id":75238,"currency":"BTC","rate":"0.00020000","amount":"0.04843834","range":2,"date":"2015-05-10 23:51:12","fees":"-0.00000001"}]}
      //    
      //  POLONIEX DOCUMENTATION
      //  
      //  Returns your active loans for each currency.
      //
      
          var params = {
            'command' : 'returnActiveLoans',
            'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.returnLendingHistory = function (start, end, limit){
      // Sample output: [{ "id": 175589553, "currency": "BTC", "rate": "0.00057400", "amount": "0.04374404", "duration": "0.47610000", "interest": "0.00001196", "fee": "-0.00000179", "earned": "0.00001017", "open": "2016-09-28 06:47:26", "close": "2016-09-28 18:13:03" }]
      //    
      //  POLONIEX DOCUMENTATION
      //  
      //  Returns your lending history within a time range specified by the "start" and "end" POST parameters as UNIX timestamps. "limit" may also be specified to limit the number of rows returned.
      //
      
          var params = {
            'command' : 'returnLendingHistory',
            'start' : start,
            'end' : end,
            'limit' : limit,
            'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    this.toggleAutoRenew = function (orderNumber){
      // Sample output: {"success":1,"message":0}
      //    
      //  POLONIEX DOCUMENTATION
      //  
      //  Toggles the autoRenew setting on an active loan, specified by the "orderNumber" POST parameter. If successful, "message" will indicate the new autoRenew setting.
      //
      
      var params = {
          'command' : 'toggleAutoRenew',
          'orderNumber' : orderNumber,
          'nonce' : getNonce()
        };
        
        return this.apiCall(params);
    }
    
    //
    //  THIS SECTION CONTAINS WEBHELPER FUNCTIONS
    //
    // 
    
    
    //urllib.urlencode in python, but adapted to js
    function serialize(obj) {
      var str = [];
      for(var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    }
    
    //calculate the nonce, instantiating a new date object each time
    function getNonce(){
      var date = new Date();
      return Math.floor(date.getTime()).toString()  //Nonce : Current unixtime accurate to milliseconds - Math.floor((date.getTime()/1000)).toString() for seconds
    }
    
    function defaultFor(arg, val) { return typeof arg !== 'undefined' ? arg : val; }
  }



