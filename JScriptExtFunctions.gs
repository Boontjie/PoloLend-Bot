//https://stackoverflow.com/questions/14226803/javascript-wait-5-seconds-before-executing-next-line
function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}