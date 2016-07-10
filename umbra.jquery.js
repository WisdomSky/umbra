;(function() {
    function umbra(opts) {

        var $this = this,
            mo = window.MutationObserver || window.WebKitMutationObserver || null;


        /*
         |---------------------------------------------------------------
         |   Check if mutation observer API is supported
         |---------------------------------------------------------------
         |
         */
        if (mo === null) {
            throw new Error("Umbra: Mutation Observer API not supported");
        }

        /*
         |---------------------------------------------------------------
         |   Responsible for generating shadow for the custom elements
         |---------------------------------------------------------------
         |
         */
        var shadow = function (elem) {

            // get the tag name of the element
            var tag_name = elem.tagName.toLocaleLowerCase();

            // check if the element is registered in umbra
            if (Object.keys($this.data("umbra-tag")).indexOf(tag_name) !== -1) {

                var shadow;

                // check if there is already an existing shadow instance to this element
                if ($(elem).data("umbra-shadow")) {

                    shadow = $(elem).data("umbra-shadow");

                // or else create a new one
                } else {

                    shadow = elem.createShadowRoot();
                }

                // if the element is registered, get the template registered in umbra
                var template, content = $this.data("umbra-tag")[tag_name];

                // check if the template is url, plain text, or a closure
                switch (typeof content) {
                    case "string":
                        if (/\.[^\.\?]{1,5}(\?.*)?$/.test(content)) {
                            break;
                        }
                        template = content;
                        break;
                    case "function":
                        // the template is a closure, apply the current element as the context when invoked
                        var ret = content.apply(elem);
                        template = ret instanceof jQuery ? ret : ret;
                        break;

                }

                // replace the {{content}} placeholder with the content of the current element
                if (!(template instanceof jQuery) && template != null) {

                    template = template.replace("{{content}}", $(elem).html());

                    try {
                        template = $(template);
                    } catch(e) {
                        template = $("<span>").html(template);
                    }
                }

                // insert the template into the shadow
                if (template != null && template.length) {
                    $(shadow).html(template[0]);
                } else {
                    $(shadow).text(content);
                }

                // save the shadow
                $(elem).data("umbra-shadow", shadow);
            }
        };

        /*
        |------------------------------------------
        |   Preloads all tags with external source
        |------------------------------------------
        |
        */
        var preloadExtTags = function () {
            var tags = $this.data("umbra-tag"),
                keys = Object.keys(tags);

            for (var i=0; i< Object.keys(tags).length; i++) {

                var key = keys[i],
                    tag = tags[key];

                // check if the template is a file
                if (/\.[^\.\?]{1,5}(\?.*)?$/.test(tag)) {

                    // wrap the ajax code in a closure
                    (function (_key, _file) {

                        // check if the url has params
                        if (/[\?]/g.test(_file)) {
                            _file = _file.split("?", 2);
                            var param = _file[1];
                            _file = _file[0];
                        }

                        // use ajax to fetch the contents from the url
                        $.ajax({
                            type: "get",
                            url: _file,
                            data: param != undefined ? param : undefined,
                            dataType: "html",

                            success: function (html) {

                                var tags = $this.data("umbra-tag");
                                // replace the url with the real contents
                                tags[_key] = html;
                                // and update the tags list
                                $this.data("umbra-tag", tags)

                                // now run again the shadow to the affected elements
                                // to make sure they are updated
                                $(_key).each(function () {
                                    shadow(this);
                                });

                            },
                            error: function () {
                                // if error occurs, restart ajax request
                                $.ajax(this);

                            }
                        });
                    })(key, tag);
                }
            }
        };

        /*
         |---------------------------------------------------------------------------------
         |  Umbra methods
         |  Note: these methods should only be invoked after the umbra is instantiated.
         |---------------------------------------------------------------------------------
         |
         */
        if (typeof opts == "string") {

            switch (opts) {
                /*
                 |---------------------------------------------------------------------------------
                 |  TAG method
                 |  used to update the template of a target tag
                 |
                 |  parameters:
                 |  1 - the target tag
                 |  2 - new template to apply to the tag specified in the first parameter
                 |---------------------------------------------------------------------------------
                 |
                 */
                case "tag":

                    var tags = $this.data("umbra-tag");

                    if (arguments[1] !== undefined) {

                        tags[arguments[1]] = arguments[2];

                        $(arguments[1]).each(function () {

                            shadow(this);

                        });

                        $this.data("umbra-tag", tags);
                    }
                    preloadExtTags();
                    break;
                    /*
                     |---------------------------------------------------------------------------------
                     |  DESTROY method
                     |  destroys the umbra instance
                     |---------------------------------------------------------------------------------
                     |
                     */
                case "destroy":

                    var tags = this.data("umbra-tag"),
                        tagkeys = Object.keys(tags);

                    for (var i = 0; i < tagkeys.length; i++) {

                        $(tagkeys[i]).each(function () {
                            $(this).data("umbra-shadow").innerHTML = $(this).html();
                        });

                    }

                    this.data("umbra-observer").disconnect();
                    this.removeData("umbra-observer");
                    this.removeData("umbra-tag");
                    break;
            }
            

            return this;
        }

        var observer;

        opts = opts || {};

        $this.data("umbra-tag",  opts.tag || {});
        preloadExtTags();

        // create new mutation observer instance
        observer = new mo(function(mutations) {

            for (var i = 0; i < mutations.length; i++) {

                var mutation = mutations[i];

                if (mutation.addedNodes.length == 0) {

                    shadow(mutation.target);

                } else {

                    for (var e = 0; e < mutation.addedNodes.length; e++) {

                        var subnode = mutation.addedNodes[e];
                        shadow(subnode);
                        var subs = $(subnode).find("*");

                        if (subs.length) {

                            for (var z = 0; z < subs.length; z++) {

                                var subss = subs[z];
                                shadow(subss);

                            }

                        }

                    }

                }

            }
        });

        // start observing target element
        observer.observe($this[0], {
            childList: true,
            subtree: true
        });

        // instantiate umbra when document is loaded
        $(function () {

            var itags = Object.keys($this.data("umbra-tag"));

            for (i = 0; i < itags.length; i++) {

                $(itags[i]).each(function () {

                    shadow($(this)[0]);

                });


            }
        });

        // save the observer instance
        this.data("umbra-observer", observer);

        return this;
    }
    $.fn.umbra = umbra;
})(jQuery);