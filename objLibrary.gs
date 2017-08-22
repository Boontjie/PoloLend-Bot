/**
* 
*
* Library to create objects to extends GAS functionality
* 
*/ 

/**
* Spreadsheet object
*
* Spreadsheet values should be available globally as needed.
*/

var gSheet = Object.create(Object.prototype,
                           {
                             APIKEY: {
                               writable: false,
                               configurable: false,
                               value: parameterWs.getRange('APIKEY').getValue()
                             },
                             SECRETKEY: {
                               writable: false,
                               configurable: false,
                               value: parameterWs.getRange('SECRETKEY').getValue()
                             },
                             lendCurrWhitelist: {
                               writable: false,
                               configurable: false,
                               value: getAllNonEmptyCells(placeLoanWs.getRange(3, 3, 1,placeLoanWs.getLastColumn()).getValues()[0])
                             },
                             currToLend: {
                               writable: false,
                               configurable: false,
                               value: getAllNonEmptyCells(parameterWs.getRange(11, 3, 1,parameterWs.getLastColumn()).getValues()[0])
                             },
                             
                             currToLendAllowed: {
                               writable: false,
                               configurable: false,
                               value: getAllNonEmptyCells(parameterWs.getRange(14, 3, 1,parameterWs.getLastColumn()).getValues()[0])
                             },
                             currMinLendAmt: {
                               writable: false,
                               configurable: false,
                               value: getAllNonEmptyCells(parameterWs.getRange(15, 3, 1,parameterWs.getLastColumn()).getValues()[0])
                             }
                             
                           }
                          )

/**
* Cache object
*/
var cache = Object.create(Object.prototype,
                          {
                            // maxCacheTime is a regular 'value property'
                            maxCacheTime: {
                              writable: true,
                              configurable: true,
                              value: 21600
                            },
                            
                            cachedKeys: {
                              configurable: true,
                              get: function() { return PropertiesService.getScriptProperties().getProperty('cacheObjects')},
                              set: function(value) {
                                PropertiesService.getScriptProperties().setProperty('cacheObjects', value);
                              }
                            },
                            cachedEntries: {
                              configurable: true,
                              get: function() { 
                                if(this.cachedKeys!==null){
                                  var cKeys = this.cachedKeys.split('|')
                                  for(var key in cKeys)
                                  {
                                    Logger.log(cKeys[key])
                                  }
                                }
                                return;
                              }
                            }
                          }
                         )

cache.getOrDefault = function(cacheKey, valueForDefault, timeToKeepDefault){
  if(timeToKeepDefault==='undefined' || timeToKeepDefault===undefined || timeToKeepDefault===null){timeToKeepDefault=this.maxCacheTime}
  
  if(CacheService.getScriptCache().get(cacheKey) === 'undefined' || CacheService.getScriptCache().get(cacheKey) === null){
    CacheService.getScriptCache().put(cacheKey, valueForDefault, timeToKeepDefault)
    //this.addRecord(cacheKey);
    return valueForDefault;
  }
  return CacheService.getScriptCache().get(cacheKey)
}

cache.clearCache = function(){
  //Clear all cached objects
   CacheService.getScriptCache().removeAll(this.cachedKeys.split('|'))
   PropertiesService.getScriptProperties().deleteProperty('cacheObjects')

}

cache.addRecord = function(cacheKeyRecord){
  //Clear all cached objects
  if(this.cachedKeys==='undefined' || this.cachedKeys===null){
    this.cachedKeys = '|' + cacheKeyRecord + '|';
    return;
  };
  if (this.cachedKeys.indexOf('|' + cacheKeyRecord + '|') < 0) {this.cachedKeys = this.cachedKeys + cacheKeyRecord + '|'};
  return;
  }
