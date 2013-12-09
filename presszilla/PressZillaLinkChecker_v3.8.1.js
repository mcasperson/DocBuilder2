/**
 * A list of links not to check for 404s
 * @type {Array}
 */
var IGNORED_LINK_CHECK_NAMES  = ["javascript:void", "#", "Edit this topic", "permlink", "Report a bug"];

function logURLNotLoading(href){
    console.log(href + " was not loaded successfully");
}

function checkDeadLinks() {
    jQuery('div[class=book] a').each(function(index, object){
        var link = jQuery(object);
        var href = link.attr("href");
        if (href != null && href != "" && href.substr(0, 1) != "#" && jQuery.inArray(link.text(), IGNORED_LINK_CHECK_NAMES) == -1) {

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onabort: function(href) { return function() {logURLNotLoading(href);}},
                onerror: function(href) { return function() {logURLNotLoading(href);}},
                ontimeout: function(href) { return function() {logURLNotLoading(href);}}
            });
        }
    });
}

checkDeadLinks();