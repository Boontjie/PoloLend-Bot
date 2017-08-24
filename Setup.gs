function testBot(){
  runLendingBot();
}

function InitialSetup(){
  //clearCache and scriptproperties
  clearCache()
  clearScriptProperties()
  
  //Initialise the lendingbot object
  var lendbot = new LendingBot();
  
  //Initialise persistent property service
  PropertiesService.getScriptProperties().setProperty('LendingBotRunstate', 'idle');
  //PropertiesService.getScriptProperties().setProperty('lendingBotObject', lendbot);
  
  for (var i = 0; i < 1; i++) {
    ScriptApp.newTrigger('pingPolo')
    .timeBased()
    .everyMinutes(1)
    .create();
    
    Utilities.sleep(60 * 1000);
  }
  
}



