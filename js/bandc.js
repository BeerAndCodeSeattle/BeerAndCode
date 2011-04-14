$(function() {    
  var syncCookiePrefs = function () {
    var ca, i, x, y;
    ca = document.cookie.split(';');
    for(i = 0; i < ca.length; i++) {
      x = ca[i].substr(0, ca[i].indexOf('='));
      y = ca[i].substr(ca[i].indexOf('=') + 1);
      x = x.replace(/^\s+|\s+$/g, '');
      if (x === 'carbonate') {
        if(unescape(y) === 'true') {
          $('#toggle').attr('checked', 'checked');
        } else {
          $('#toggle').removeAttr('checked');
        }
        return;
      }
    }          
  };
  
  if(document.cookie && document.cookie.indexOf('carbonate') !== -1){
    syncCookiePrefs();  
  }
  
  $(function () {
    var t = function (f) { $('#toggle').change(function (events) { f(); })};
    carbonate(t);
  });  
});
