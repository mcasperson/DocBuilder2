/**
 * A list of links not to check for 404s
 * @type {Array}
 */
var IGNORED_LINK_CHECK_NAMES  = ["javascript:void", "#", "Edit this topic", "permlink", "Report a bug"];

var badLinkCount = 0;


function logURLNotLoading(link, href){
    console.log(href + " was not loaded successfully");

    ++badLinkCount;

    var button = jQuery('<button type="button" class="btn btn-default" style="width:230px; white-space: normal;")">' + href + '</button>');
    var buttonParent = jQuery('<div class="btn-group" style="margin-bottom: 8px;"></div>');

    buttonParent.append(button);
    jQuery('#badLinksItems').append(buttonParent);

    button.click(function(link) {
        return function() {
            link.scrollIntoView();
        }
    }(link[0]));
}

function checkDeadLinks(links, index) {
    if (index < links.length) {

        jQuery('#badLinksBadge').remove();
        jQuery('#badLinks').append($('<span id="badLinksBadge" class="badge pull-right">' + badLinkCount + ' (' + (index / links.length * 100.0).toFixed(2) + '%)</span>'));

        var link = jQuery(links[index]);
        var href = link.attr("href");
        if (href != null &&
            href != "" &&
            href.substr(0, 1) != "#" &&
            jQuery.inArray(link.text(), IGNORED_LINK_CHECK_NAMES) == -1 &&
            unsafeWindow.URI(href).hostname() != "localhost" &&
            unsafeWindow.URI(href).hostname() != "127.0.0.1" &&
            unsafeWindow.URI(href).protocol() != "mailto") {

            console.log("Checking " + href);

            setTimeout(function() {
                GM_xmlhttpRequest({
                    method: 'HEAD',
                    url: href,
                    timeout: 10000,
                    onabort: function(link, href) { return function() {logURLNotLoading(link, href); checkDeadLinks(links, ++index);}}(link, href),
                    onerror: function(link, href) { return function() {logURLNotLoading(link, href); /* onload will be called anyway */}}(link, href),
                    ontimeout: function(link, href) { return function() {logURLNotLoading(link, href); checkDeadLinks(links, ++index);}}(link, href),
                    onload: function(response) {
                        checkDeadLinks(links, ++index);
                    }
                });
            }, 0);
        }  else {
            checkDeadLinks(links, ++index);
        }
    } else {
        jQuery('#badLinksBadge').remove();
        jQuery('#badLinks').append($('<span id="badLinksBadge" class="badge pull-right">' + badLinkCount + '</span>'));
    };
}

checkDeadLinks(jQuery('div[class=book] a'), 0);