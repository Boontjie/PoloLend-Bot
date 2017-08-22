/*************************************************************************
* Performance Functions
*********/

/**
*
* Calculation of relative performance of GAS features as well as performance of portions of the bot
*
* External call -> lendbot.exchInst.returnAvailableAccountBalances(); -> 1.4029 seconds
* External call -> lendbot.exchInst.returnOpenLoanOffers(); -> 1.2872999999999999 seconds
*
*/

/**
**** avePingTime ***
*
* Pings the poloniex API to check whether the loanbot should run before the refresh timer hits 0
*
* The ping is repeated a set number of time to determine the average runtime of a ping.  Useful in
* calculation of daily use - to optimise google limit restrictions
*
* The minimum pingtime is largely dependent on external API calls
* 21/8/2017 - Minimum Theoretical Ping Time -> 2.7 seconds -> lendbot.exchInst.returnAvailableAccountBalances() & lendbot.exchInst.returnOpenLoanOffers()
*           - A ping every minute equates to 1.1 hours of runtime, leaving 20 minutes for the bot to set up offers
*/ 


function tst(){
  perfFunction(
    function() {var exchInst = new poloniexApi(gSheet.apiKey,gSheet.secretKey)}, 50)
  
  //lendbot.exchInst.returnAvailableAccountBalances();
  //lendbot.exchInst.returnOpenLoanOffers()
}

perfFunction = function(functionname, sleeptimer){
  var totalPingTime = 0;
  var i =0
  while (i<10) {
  var tempDate = Date.now();
  functionname();
  totalPingTime = totalPingTime + (+Date.now() - +tempDate) / 1000;
    Utilities.sleep(sleeptimer)
    i++
  }
  Logger.log(totalPingTime/10)
}

function avePerfTime(){
  var totalPingTime = 0;
  var i =0
  var lendbot = new LendingBot();
  while (i<10) {
  var tempDate = Date.now();
  lendbot.exchInst.returnOpenLoanOffers();
  totalPingTime = totalPingTime + (+Date.now() - +tempDate) / 1000;
    Utilities.sleep(100)
    i++
  }
  Logger.log(totalPingTime/10)
}

function avePingTime(){
  var totalPingTime = 0;
  var i =0
  while (i<10) {
  var tempDate = new Date();
  pingPolo();
  var tempDate2 = new Date();
  totalPingTime = totalPingTime + (+tempDate2.getTime() - +tempDate.getTime()) / 1000;
    Utilities.sleep(1000)
    i++
  }
  Logger.log(totalPingTime/10)
}

function testPropertiesUser() { // 1504.0 , 1458.0, 1577.0
  var value = { a: 'a', b: 'b' }
  var key = 'ab';
  PropertiesService.getUserProperties().setProperty(key, value);
  var i = 0;
  var t = Date.now();
  while (i<100) {
    Logger.log( PropertiesService.getUserProperties().getProperty(key))
    i++
  }
  Logger.log( Date.now()-t);
}

function testPropertiesScript() { // 1597.0, 1584.0, 1532.0
  var value = { a: 'a', b: 'b' }
  var key = 'ab';
  PropertiesService.getScriptProperties().setProperty(key, value);
  var i = 0;
  var t = Date.now();
  while (i<100) {
    Logger.log( PropertiesService.getScriptProperties().getProperty(key))
    i++
  }
  Logger.log( Date.now()-t);
}

function testCache() { // 4050.0, 3813.0
  var value = { a: 'a', b: 'b' }
  var key = 'ab';
  CacheService.getUserCache().put(key, JSON.stringify(value))
  var i = 0;
  var t = Date.now();
  while (i<100) {
    Logger.log( CacheService.getUserCache().get(key) )
    i++
  }
  Logger.log( Date.now()-t);
}