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
  var gate = $('form.person_details').length > 0 && $('#new_project_template').length > 0;
  if (gate) {    
    (function () {      
      /*
      * TODO: Let the server determine the person to which the project will be added
      * Once logins are implemented, the currently logged in user will
      * be a safer way to do this. Right now, I could just doctor some
      * data and do unauthorized changes.
      */
      // URL pattern is /[object]/[verb]/[id]. Lift the id from the URL
      var user_id = document.location.pathname.split('/').splice(-1);

      var add_project_btn = $('<button />').attr({
        id: 'add_project'
      });

      var hide_form = function (form) {
        $(form).remove();
        $('#add_project').show();
      };
      
      var save_form = function (event) {
        var f = event.srcElement.parentElement.parentElement,
            data = $(f).serialize(),
            projectDataArray = $(f).serializeArray(),
            projectJSON = {};              

        // Do some AJAX stuff here
        $.post('/people/addProjectToPerson/' + user_id, data, function (result) {
          var i = 0, length = projectDataArray.length;
          if (result === 'OK') {
            var emptyProjects = $('p').filter(function (i,p) { return $(p).text().indexOf('No projects added!') >= 0; });
            if (emptyProjects.length > 0) {
              $(emptyProjects[0]).remove();
            }

            for (i; i < length; i += 1) {
              projectJSON[projectDataArray[i].name] = projectDataArray[i].value;
            }
            
            // Add it to the project listing
            $('#project_template').tmpl({
              name: projectJSON.project_name,
              description: projectJSON.project_description,
              project_url: projectJSON.project_url
            }).prependTo('.projects_list');

          } else if (result.indexOf('ERROR') >= 0) {
            alert('ERROR');
          }
        });
        hide_form(f);

        event.preventDefault();
        return false;
      };

      var cancel_form = function (event) {
        var f = event.srcElement.parentElement.parentElement;
        hide_form(f);        
        event.preventDefault();
        return false;
      }

      add_project_btn.text('Add Project');
      $('.projects_list').append(add_project_btn);

      $(add_project_btn).click(function (event) {        
        $('#add_project').hide();            
        $('#new_project_template').tmpl({}).appendTo('.projects_list');

        $('.project_save_button').click(save_form);
        $('.project_cancel_button').click(cancel_form);

        return false;
      });

      // Github automated import
      var github_val = $('form.person_details').serializeArray().filter(function (obj) { return obj.name === 'person[github]'; })[0].value;
      if (github_val) {
        var github_btn = $('<button />').attr({
          id: 'add_project'          
        }).text('Import from Github');
        $('.projects_list').append(github_btn);
        $(github_btn).click(function (event) {
          // Do some AJAX fun here
          $.get('/people/getGithubProjects/' + github_val, function (data) {
            var update_form_data = function (form, field_name, value) {
              form.find(field_name).val(value);
            };

            $.each(data, function (i, project) {
              var project_template = $('#new_project_template').tmpl({}),
                  jProject_template,
                  doUpdate = function (name, val) {
                    update_form_data(jProject_template, name, val);
                  };

              jProject_template = $(project_template);
              doUpdate('input[name="project_name"]', project.name);
              doUpdate('input[name="project_description"]', project.description);
              doUpdate('input[name="project_url"]', project.project_url);
                            
              // set up button click handlers for each form
              jProject_template.find('.project_save_button').click(save_form);
              jProject_template.find('.project_cancel_button').click(cancel_form);

              // Add to list
              jProject_template.appendTo('.projects_list');
            });
            return false;
          });

          event.preventDefault();
          return false;
        });
      }            
    }());    
  }
});
