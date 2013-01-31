/**
 * IOedit
 * html5 inline editing
 *
 */

$(function(){

  $.fn.ioEdit = function ioEdit( options ){

    if( $(this).hasClass('iokit-edit-initialized') )
      return;

    $(this).addClass('iokit-edit-initialized');
    
    var aceEditor;

    var defaultOptions = {
      toolbar: {
        bold: { title: 'save', shortcut: 'b' },
        italic: { title: 'italic', shortcut: 'i' },
        underline: { title: 'underline', shortcut: 'u' },
        strikeThrough: { title: 'strikethrough' },
        justifyLeft: { title: 'alignleft' },
        justifyRight: { title: 'alignright' },
        justifyCenter: { title: 'aligncenter' },
        justifyFull: { title: 'justify' },
        insertUnorderedList: { title: 'bulletList' },
        insertOrderedList: { title: 'orderedList' },
        link: { title: 'link' },
        image: { title: 'image' },
        source: { title: 'source' },
        save: { title: 'save', align: 'right', shortcut: 's' },
        //preferences: { title: 'preferences', align: 'right' },
        //preview: { title: 'preview', align: 'right', shortcut: 'p' }
      },
      height: null,
      maxHeight: 300,
      minHeight: 200,

      setupMethods: {
        link: function( btn ){
          $(btn).on('click', function(e){
            e.preventDefault();
            var link = prompt('Link','');
            document.execCommand('createLink', false, link);
          });
        },
        source: function( btn ){
          $(btn).on('click', function(e){
            e.preventDefault();
            $.getScript('/javascripts/3rdparty/ace.js', function(){
              $.getScript('/javascripts/3rdparty/ace/theme-tomorrow.js', function(){
                $.getScript('/javascripts/3rdparty/ace/mode-html.js', function(){
                  var modalHtml = $('<div class="content-padding"/>');
                  modalHtml.append('<div id="source-editor" class="source-editor"/>');
                  iokit.modal({
                    title: $.i18n.t('web.source.title'),
                    data: modalHtml,
                    windowControls: {
                      save: {
                        icn: 'icn-save',
                        title: $.i18n.t('web.source.save'),
                        callback: function( modal ){
                          $(editor).find('.iokit-editor-content').html( aceEditor.getValue() );
                          iokit.modal('close');
                        }
                      },
                      refresh: {
                        icn: 'icn-refresh',
                        title: $.i18n.t('web.source.refresh'),
                        callback: function( modal ){
                          aceEditor.setValue( $(editor).find('.iokit-editor-content').html() )
                        }
                      }
                    },
                    completed: function( modal ){
                      aceEditor = ace.edit("source-editor");
                      $('#source-editor').css({ top: 10, left: 0, width: '100%', height:'100%'});
                      aceEditor.setValue( $(editor).find('.iokit-editor-content').html() )
                      aceEditor.setTheme("ace/theme/tomorrow");
                      aceEditor.getSession().setMode("ace/mode/html");
                      aceEditor.getSession().setUseWrapMode(true);
                      aceEditor.getSession().setWrapLimitRange(80, 80);
                    }
                  })
                });
              })
            });
          })
        }
      }
    };

    this.definedShortcuts = {};
    this.simpleCommands = /bold|italic|underline|strikeThrough|insertUnorderedList|insertOrderedList|justify*/;

    // i18n support (try to load if present)
    if (typeof( $.i18n ) !== 'undefined' && typeof( $.i18n.t !== 'undefined' ) )
      for( var item in defaultOptions.toolbar )
        if( !defaultOptions.toolbar[item].i18nTitle )
          defaultOptions.toolbar[item].i18nTitle = $.i18n.t('web.editor.'+item)

    options = options || {};

    for( var i in defaultOptions )
      if( options[i] && typeof(options[i]) === 'object')
        for( var j in defaultOptions[i] ){
          if( !options[i][j] )
            options[i][j] = defaultOptions[i][j];
        }
      else if( !options[i] )
        options[i] = defaultOptions[i];

    for( var item in defaultOptions.toolbar )
      if( defaultOptions.toolbar[item].shortcut )
        this.definedShortcuts[defaultOptions.toolbar[item].shortcut] = item;

    if( options.skipToolbarBtns )
      for( var i in options.skipToolbarBtns )
        delete options.toolbar[options.skipToolbarBtns[i]];

    var editor = this;

    /**
     * create an editor button
     * by passing in type.
     *
     * e.g.: createButton( 'bold' );
     *
     * in order to match with the css formatting, a
     * editor-icn-<type> class should be defined.
     */
    editor.createButton = function createButton( type, btnOptions ){
      var btn = $('<a href="#" class="btn w-icn-only" />');
      btn.append('<span original-title="'+(btnOptions.i18nTitle || type)+'" class="live-tipsy icn icn-'+type+'" />');
      if( btnOptions.align && btnOptions.align === 'right' )
        btn.addClass('pull-right');
      editor.controls.append( btn );
      if( type.match(editor.simpleCommands) )
        btn.on('click', function( e ){
          e.preventDefault();
          document.execCommand(type, false, null);
        });
      else
        if( options.setupMethods && options.setupMethods[type] && typeof(options.setupMethods[type]) === 'function' )
          options.setupMethods[type]( btn );
    };

    editor.origContent = $(editor).html();

    var content = '<div class="iokit-editor-content">'+$(editor).html()+'</div>';
    $(editor).addClass('iokit-editor')
      .html('');

    editor.createToolbar = function createToolbar(){
      editor.controls = $('<div class="iokit-editor-controls"/>');
      $(editor).append( editor.controls );
      for( var i in options.toolbar )
        editor.createButton( i, options.toolbar[i] );
    };

    editor.insertNodeOverSelection = function insertNodeOverSelection( node ) { 

      var range, html;
      if (window.getSelection && window.getSelection().getRangeAt) {
          range = window.getSelection().getRangeAt(0);
          range.insertNode(node);
      } else if (document.selection && document.selection.createRange) {
          range = document.selection.createRange();
          html = (node.nodeType == 3) ? node.data : node.outerHTML;
          range.pasteHTML(html);
      }

/*
      var sel, range, html, str;

      if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0);
          if (editor.isOrContainsNode($(editor).get(0), range.commonAncestorContainer)) {
            range.deleteContents();
            range.insertNode(node);
          } else {
            $(editor).append(node);
          }
        }
      } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        if (editor.isOrContainsNode($(editor).get(0), range.parentElement())) {
          html = (node.nodeType == 3) ? node.data : node.outerHTML;
          range.pasteHTML(html);
        } else {
          $(editor).append(node);
        }
      }
      */
    };

    editor.createToolbar();

    $(editor)
      .append(content)
      .find('.iokit-editor-content').attr('contenteditable', true).end()
      .find('.iokit-editor-content').css({ maxHeight: options.maxHeight,
                                           height: ( options.height || 'auto' ),
                                           minHeight: options.minHeight })
      .on('keydown', function( e ){
        var userAgentMac = ( navigator.userAgent.indexOf('Mac OS X') != -1 );
        if( !userAgentMac && e.ctrlKey || userAgentMac && e.metaKey ){
          e.preventDefault();
          var charCode = String.fromCharCode(e.keyCode).toLowerCase();
          if( editor.definedShortcuts[charCode] )
            $(editor).find('.icn-'+editor.definedShortcuts[charCode]).click();
        }
      })
      .on('drop', function( e ){
        var imgSrc = e.originalEvent.dataTransfer.getData('text/plain');
        var img = document.createElement('img');
        img.src = imgSrc;
        editor.insertNodeOverSelection(img, document.getElementById('editable'));
      })

      // NOT WORKING!
      /*
      .on('input paste', function( e ){
        $(editor).append($('<textarea></textarea>').attr('id', 'iokit-editor-paste'));
        $("#iokit-editor-paste").focus();
        console.log($(this).paste);
        var self = this;
        setTimeout(function(){
          $(self).paste;
          $('#iokit-editor-paste').remove();
        }, 250);
      });;
*/

      /*
    $(window).off('beforeunload').on('beforeunload', function(){
      if( $(editor).length && $(editor).origContent !== $(editor).find('.iokit-editor-content').html() )
        return confirm($.i18n.t('web.editor.unsaved_content'));
      return true;
    });
*/

  }

});