function clearLog(ws, CLEAR_LOG, headingrows){
  if (ws == null || CLEAR_LOG == false) {return};
  ws.getDataRange().offset(headingrows,0).clearContent();
}

function getAllNonEmptyCells(Array){
  var tempArray = []
  for(var key in Array){
    if(Array[key] != null && Array[key].length != 0){
      tempArray.push(Array[key])};
    }
  return tempArray
}

function getFirstEmptyRow(spreadsheetObj, rangeToCheck) {
  var column = spreadsheetObj.getRange(rangeToCheck);
  var values = column.getValues(); // get all data in one call
  var ct = 0;
  while ( values[ct][0] != "" ) {
    ct++;
  }
  return (ct);
}

function clearScriptProperties(){
  //Clear all script properties
  PropertiesService.getScriptProperties().deleteAllProperties()};


function clearCache(){
  //Clear all cached objects
  for(var cacheEntry in CacheService.getScriptCache()){
    CacheService.getScriptCache().remove(cacheEntry);
  };
}

function clearBotTriggers(){
  ScriptApp.deleteTrigger('pingPolo')
}



//  https://stackoverflow.com/questions/11095888/search-whole-spreadsheet-to-find-text-within-a-cell-in-a-google-spreadsheet-and

// the actual search function
function findRow(sheet, item) { 
  var resultArray=new Array();
  var tempArray=new Array();
  var values = sheet.getDataRange().getValues();
  //Logger.log(values[6].toString().indexOf(item))
  for(cc =0; cc < values.length; ++cc) {
    
    if(values[cc].toString().trim().indexOf(item)>=0){// here you can eventually use string modifiers like toLowerCase() to allow for wider search criteria
      // or like this to search only in column D
      for(var n in values[cc]){
        if(values[cc][n].toString().trim().indexOf(item)>=0){
          resultArray.push([+cc+1,+n+1]);
        }
        
      }  
    };
  }
  return resultArray ;// the returned value is a 2 dimensions array to use with setValues()
}
     