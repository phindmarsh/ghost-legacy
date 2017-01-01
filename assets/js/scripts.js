/* global hljs, $, console */
/* jshint browser: true */

!function(){
    var Saga = {

        /*
         *  Switch this to true if all the dependencies are already loaded,
         *  for example via a bundeld js file.
         */

        scriptsPresent: false,

        initialize: function(){
            // Get url for blog (in case site is run under a sub-domain)
            this.siteurl = $('#site-url').attr('href');
            this.$main = $('#main');

            this.highlightCode();
            this.responsiveVideos();
            this.gallery();
            this.fullWidthImages();
        },

        highlightCode: function(){
            if($('code').length === 0){
                return;
            }

            this.getScript('/assets/js/helper/highlight.min.js')
            .then(function() {
                hljs.initHighlightingOnLoad();
            });
        },

        responsiveVideos: function(){
            this.getScript('/assets/js/helper/jquery.fitvids.js').then($.proxy(function() {
                this.$main.fitVids();
            }, this));
        },

        gallery: function(){
            if( $('p a:not(:only-child) img').closest('p').length === 0
                && $('p img:not(:only-child)').closest('p').length === 0){
                return;
            }
            this.getScript('/assets/js/helper/imagesloaded.pkgd.min.js').then($.proxy(function() {
                // start with all paragraphs that have images
                $('p:has(img)')
                  // exclude p tags that contain things other than images or has full width images
                  .filter(function(i, p){ return $(p).has(':not(img[src$="#full"])').length > 0 && $(p).has(':not(img)').length === 0 })
                  .addClass('gallery')
                  .hide()
                  .imagesLoaded($.proxy(this.onGallery, this))
                  .children()
                  // wrap each image inside an <a> so the fluidbox plugin works
                  .each(function(i, item) {
                    $(item).wrap('<a href="'+item.src+'" class="post-gallery-image" title="'+item.alt+'"></a>')
                  });

                $(window).resize($.proxy(this.onGallery, this));
            }, this));
        },

        onGallery: function(){
            this.getScript('/assets/js/helper/gallery.min.js')
                .then(function(){
                  var size = 0;
                  if ($(window).height() > $(window).width()){
                      size = $(window).height();
                  } else {
                      size = $(window).width();
                  }
                  size = Math.max(size/5, 500);

                  $('.gallery').fadeIn().removeWhitespace().collagePlus({
                          'targetHeight': size
                  }).promise();
                })
                .then($.proxy(this.lightBox, this));
        },

        fullWidthImages: function(){
            if(!this.$main.hasClass('content')){
                return;
            }

            this.getScript('/assets/js/helper/imagesloaded.pkgd.min.js')
            .then($.proxy(function() {
                this.$main.imagesLoaded($.proxy(this.onFullWidthImages, this));
                $(window).resize($.proxy(this.onFullWidthImages, this));
            }, this));
        },

        onFullWidthImages: function(){
            $("img[src$='#full']:only-child").each(function() {
                var $t = $(this);
                $t.addClass('full-loaded');
                $t.closest('p').css('min-height', $t.height());
                $t.closest('p').addClass('full-image-container');
            });
        },

        lightBox: function(){
            if(!this.$main.hasClass('content')){
                return;
            }

            this.getScripts([
                '/assets/js/helper/jquery.fluidbox.min.js',
                '/assets/js/helper/imagesloaded.pkgd.min.js'
            ]).then($.proxy(function(){
                this.$main.imagesLoaded(this.onLightBox.bind(this));
            }, this));
        },

        onLightBox: function(){
            $('.content a').filter(function() {
                return $(this).attr('href').match(/\.(jpeg|jpg|png|gif)/i);
            }).fluidbox({
                closeTrigger: [
                    { selector: '#fluidbox-overlay', event: 'click'         },
                    { selector: 'window',            event: 'resize scroll' }
                ]
            });
        },

        stickyFooter: function(){
            var resize = $.proxy(function(){
                this.$main.css('min-height',
                    $(window).height() - $('#header').height() - $('#footer').height()
                );
            }, this);

            $(window).load(resize);
            $(window).resize(resize);
        },

        loadedScripts: {
          '/assets/js/helper/imagesloaded.pkgd.min.js': true,
          '/assets/js/helper/jquery.fluidbox.min.js': true,
          '/assets/js/helper/gallery.min.js': true
        },

        getScripts: function(scripts){
            var promise = $.Deferred();
            var loader = $.proxy(function(){
                if(scripts.length > 0){
                    var path = scripts.shift();

                    if(path in this.loadedScripts){
                        loader();
                    } else {
                        $.getScript(this.siteurl + path)
                        .then($.proxy(function(){
                            this.loadedScripts[path] = true;
                            loader();
                        }, this))
                        .fail(function(err){
                            if(err){
                                promise.rejectWith(err);
                            } else {
                                promise.reject();
                            }
                        });
                    }
                } else {
                    promise.resolve();
                }
            }, this);

            if(this.scriptsPresent){
                promise.resolve();
            } else {
                loader();
            }

            return promise;
        },

        getScript: function(path){
            return this.getScripts([path]);
        }
    };
    $.ajaxSetup({ cache: true });
    $($.proxy(Saga.initialize, Saga));
}();
