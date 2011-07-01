$(function() {    
  (function ($) {
    $.fn.konami = function (callback, code) {
      if (code == undefined) code = "38,38,40,40,37,39,37,39,66,65,13";
      return this.each(function () {
        var kkeys = [];
        $(this).keydown(function (e) {
          kkeys.push(e.keyCode);
          if (kkeys.toString().indexOf(code) >= 0) {
            $(this).unbind('keydown', arguments.callee);
            callback(e);
          }
        }, true);
      });
    }
  }(jQuery));
  
  $(window).konami(function () {
    var carbonate = new Carbonate();
    carbonate.start(); 
  });  

  // Project form stuff
  if ('form.person_details') {
    var add_project_btn = $('<button />').attr({
      id: 'add_project'
    });
    add_project_btn.text('Add Project');
    $('.projects_list').append(add_project_btn);

    $(add_project_btn).click(function (event) {
      $('#add_project').hide();      
      
      $('#new_project_template').tmpl({}).appendTo('.projects_list');      
    });
  }
});
