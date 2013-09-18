// ==UserScript==
// @name          Docbuilder Overlay
// @namespace     https://skynet.usersys.redhat.com
// @include       http://docbuilder.usersys.redhat.com/*
// @require       http://code.jquery.com/jquery-2.0.3.min.js
// @require       https://rawgithub.com/moment/moment/2.2.1/min/moment.min.js
// ==/UserScript==

/**
 * A regex to extract URls
 * http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
 * @type {RegExp}
 */
var URL_RE = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;
/**
 * A regex to extract XML comments
 * @type {RegExp}
 */
var COMMENT_RE = /<!--([\S\s]*?)-->/g;
/**
 * What to look for in a bug link to indicate the topic's ID
 * @type {string}
 */
var MATCH_PREFIX = "cf_build_id=";
/**
 * The regex that actually extracts the topic's ID
 * @type {string}
 */
var MATCH_BUILD_ID = MATCH_PREFIX + "[0-9]+";
/**
 * Some builds don't have report a bug links, but the editor links are included by DocBuilder, so if we can't use
 * the bug links, extract the topic id from the editor link.
 * @type {string}
 */
var MATCH_PREFIX2 = "topicIds=";
/**
 * The regex to extract the topic's id from the editor link.
 * @type {string}
 */
var MATCH_BUILD_ID2 = MATCH_PREFIX2 + "[0-9]+";
/**
 * The server that hosts the UI we want to connect to.
 * @type {string}
 */
var SERVER = "http://topika.ecs.eng.bne.redhat.com:8080/pressgang-ccms/rest/1";
//var SERVER = "http://skynet-dev.usersys.redhat.com:8080/pressgang-ccms/rest/1";

/**
 * Maintains the topic to source URL info
 * @type {{}}
 */
var urlCache = {};

/*
	When the page is loaded, start looking for the links that indicate the topics.
 */
$(document).ready(findTopicIds);

/**
 * Create and add the icons after the bug or editor links
 * @param topicId The topic ID
 * @param RoleCreatePara The element that held the link that we extracted the ID from.
 */
function addOverlayIcons(topicId, RoleCreatePara) {
    if (topicId != null && topicId.length > 0) {
        var bubbleDiv = document.createElement("div");
        bubbleDiv.style.height = "42px";
        $(bubbleDiv).insertAfter(RoleCreatePara);
        createSpecsPopover(topicId, bubbleDiv);
        createHistoryPopover(topicId, bubbleDiv);
        createTagsPopover(topicId, bubbleDiv);
        createUrlsPopover(topicId, bubbleDiv);
        createDescriptionPopover(topicId, bubbleDiv);
    }
}

/**
 * Creates the popuver that lists the specs the topic is included in.
 * @param topicId The topic id
 * @param parent The element that should hold the icon
 */
function createSpecsPopover(topicId, parent) {
    var linkDiv = createIcon("book", topicId);
    parent.appendChild(linkDiv);

    var popover = createPopover("Content Specifications", topicId);
    document.body.appendChild(popover);

    linkDiv.onmouseover=function(){

        openPopover(popover, linkDiv);

        popover.popoverContent.innerHTML = 'Loading...';

        $.getJSON( SERVER + "/contentspecnodes/get/json/query;csNodeType=0%2C9%2C10;csNodeEntityId=" + topicId + "?expand=%7B%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A+%22nodes%22%7D%2C+%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A+%22inheritedCondition%22%7D%7D%2C+%7B%22trunk%22%3A%7B%22name%22%3A+%22contentSpec%22%7D%2C+%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A+%22children_OTM%22%7D%7D%5D%7D%5D%7D%5D%7D",
            function(popover) {
                return function( data ) {
                    popover.popoverContent.innerHTML = '';
                    specs = {};
                    for (var specIndex = 0, specCount = data.items.length; specIndex < specCount; ++specIndex) {
                        var spec = data.items[specIndex].item.contentSpec;
                        if (!specs[spec.id]) {
                            var specDetails = {title: "", product: "", version: ""};
                            for (var specChildrenIndex = 0, specChildrenCount = spec.children_OTM.items.length; specChildrenIndex < specChildrenCount; ++specChildrenIndex) {
                                var child = spec.children_OTM.items[specChildrenIndex].item;
                                if (child.title == "Product") {
                                    specDetails.product = child.additionalText;
                                } else if (child.title == "Version") {
                                    specDetails.version = child.additionalText;
                                } if (child.title == "Title") {
                                    specDetails.title = child.additionalText;
                                }
                            }
                            specs[spec.id] = specDetails;
                        }
                    }

                    for (spec in specs) {
                        var container = document.createElement("div");
                        var link = document.createElement("a");
                        container.appendChild(link);

                        $(link).text(spec + ":  " + specs[spec].title + ", " + specs[spec].product + " " + specs[spec].version);
                        link.setAttribute("href", "/" + spec);
                        popover.popoverContent.appendChild(container);
                    }
                }
        }(popover));
    };

    setupEvents(linkDiv, popover);
}

/**
 * Create the popover that lists the topic's tags
 * @param topicId The topic id
 * @param parent The element that should hold the icon
 */
function createTagsPopover(topicId, parent) {
    var linkDiv = createIcon("tags", topicId);
    parent.appendChild(linkDiv);

    var popover = createPopover("Tags", topicId);
    document.body.appendChild(popover);

    linkDiv.onmouseover=function(){

        openPopover(popover, linkDiv);

        $.getJSON( SERVER + "/topic/get/json/" + topicId + "?expand=%7B%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A%20%22tags%22%7D%7D%5D%7D",
            function(popover) {
                return function( data ) {
                    if (data.tags.items.length != 0) {
                        popover.popoverContent.innerHTML = '';
                        for (var tagIndex = 0, tagCount = data.tags.items.length; tagIndex < tagCount; ++tagIndex) {
                            var tag = data.tags.items[tagIndex].item;
                            var link = document.createElement("div");

                            $(link).text(tag.name);
                            popover.popoverContent.appendChild(link);
                        }
                    } else {
						$(popover.popoverContent).text('[No Tags]');
                    }
                }
            }(popover));
    };

    setupEvents(linkDiv, popover);
}

/**
 * Create the popover that lists the topic's URLs
 * @param topicId The topic id
 * @param parent The element that should hold the icon
 */
function createUrlsPopover(topicId, parent) {
    var linkDiv = createIcon("urls", topicId);
    parent.appendChild(linkDiv);

    var popover = createPopover("URLs", topicId);
    document.body.appendChild(popover);

	urlCache[topicId] = {popover: popover};

    linkDiv.onmouseover=function(){

        openPopover(popover, linkDiv);

		if (!urlCache[topicId].data) {

			$.getJSON( SERVER + "/topic/get/json/" + topicId + "?expand=%7B%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A%20%22sourceUrls_OTM%22%7D%7D%5D%7D",
				function(popover) {
					return function( data ) {

						if (!urlCache[topicId].data) {
							urlCache[topicId].data = [];

							var match = null;
							while (match = COMMENT_RE.exec(data.xml)) {
								var comment = match[1];

								var match2 = null;
								while (match2 = URL_RE.exec(comment)) {
									var url = match2[0];
									urlCache[topicId].data.push({url: url, title: "[Comment] " + url});
								}
							}

							if (data.sourceUrls_OTM.items.length != 0) {

								for (var urlIndex = 0, urlCount = data.sourceUrls_OTM.items.length; urlIndex < urlCount; ++urlIndex) {
									var url = data.sourceUrls_OTM.items[urlIndex].item;
									urlCache[topicId].data.push({url: url.url, title: url.title == null || url.title.length == 0 ? url.url : url.title});
								}
							}

							updateCount(linkDiv, urlCache[topicId].data.length);
							renderUrls(topicId);
						}
					}
				}(popover));
		}
    };

    setupEvents(linkDiv, popover);
}

function renderUrls(topicId) {
	urlCache[topicId].popover.popoverContent.innerHTML = '';

	for (var index = 0, count = urlCache[topicId].data.length; index < count; ++index) {
		var urlData = urlCache[topicId].data[index];

		var container = document.createElement("div");
		var link = document.createElement("a");

		$(link).text(urlData.title);
		link.setAttribute("href", urlData.url);

		container.appendChild(link);
		urlCache[topicId].popover.popoverContent.appendChild(container);
	}

	if (urlCache[topicId].popover.popoverContent.innerHTML == '') {
		$(urlCache[topicId].popover.popoverContent).text('[No Source URLs]');
	}
}

/**
 * Create the popover that lists the topic's revision history
 * @param topicId The topic id
 * @param parent The element that should hold the icon
 */
function createHistoryPopover(topicId, parent) {
    var linkDiv = createIcon("history", topicId);
    parent.appendChild(linkDiv);

    var popover = createPopover("History", topicId);
    document.body.appendChild(popover);

    linkDiv.onmouseover=function(){

        openPopover(popover, linkDiv);

        $.getJSON( SERVER + "/topic/get/json/" + topicId + "?expand=%7B%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A%20%22revisions%22%2C%20%22start%22%3A0%2C%20%22end%22%3A15%7D%2C%22branches%22%3A%5B%7B%22trunk%22%3A%7B%22name%22%3A%20%22logDetails%22%7D%7D%5D%7D%5D%7D",
            function(popover) {
                return function( data ) {
                    popover.popoverContent.innerHTML = '';
                    specs = {};
                    for (var revisionIndex = 0, revisionCount = data.revisions.items.length; revisionIndex < revisionCount; ++revisionIndex) {
                        var revision = data.revisions.items[revisionIndex].item;
                        var link = document.createElement("div");

                        var message = revision.logDetails.message == null || revision.logDetails.message.length == 0 ? "[No Message]" : revision.logDetails.message;
                        var date = moment(revision.lastModified);

                        $(link).text(revision.revision + " - " + date.format('lll') + " - " + message);
                        popover.popoverContent.appendChild(link);
                    }
                }
            }(popover));
    };

    setupEvents(linkDiv, popover);
}

/**
 * Create the popover that displays the topic's description
 * @param topicId The topic id
 * @param parent The icon
 */
function createDescriptionPopover(topicId, parent) {
    var linkDiv = createIcon("info", topicId);
    parent.appendChild(linkDiv);

    var popover = createPopover("Description", topicId);
    document.body.appendChild(popover);

    linkDiv.onmouseover=function(){

        openPopover(popover, linkDiv);

        $.getJSON( SERVER + "/topic/get/json/" + topicId, function(popover) {
            return function( data ) {
                if (data.description.trim().length != 0) {
                    $(popover.popoverContent).text(data.description);
                } else {
                    $(popover.popoverContent).text("[No Description]");
                }
            }
        }(popover));
    };

    setupEvents(linkDiv, popover);
}

/**
 * Some code to be executed whenever a popover is shown
 * @param popover The popover div
 * @param linkDiv The link that we extracted the topic's ID from
 */
function openPopover(popover, linkDiv) {
    if (popover.timeout) {
        clearTimeout(popover.timeout);
        popover.timeout = null;
    }

    popover.style.left= linkDiv.parentNode.offsetLeft + 'px';
    popover.style.top= (linkDiv.offsetTop - 300) + 'px';
    popover.style.display = '';
}

/**
 * Setup the event handlers on the popover and the icon
 * @param popover The popover div
 * @param linkDiv The icon
 */
function setupEvents(linkDiv, popover) {
    linkDiv.onmouseout=function(popover) {
        return function(){

            if (popover.timeout) {
                clearTimeout(popover.timeout);
                popover.timeout = null;
            }

            popover.timeout = setTimeout(function() {
                popover.style.display = 'none';
            }, 200);
        }
    }(popover);

    popover.onmouseover = function(popover) {
        return function() {
            if (popover.timeout) {
                clearTimeout(popover.timeout);
                popover.timeout = null;
            }
        }
    }(popover);

    popover.onmouseout = function(popover) {
        return function() {

            if (popover.timeout) {
                clearTimeout(popover.timeout);
                popover.timeout = null;
            }

            popover.timeout = setTimeout(function() {
                popover.style.display = 'none';
            }, 200);
        }
    }(popover);
}

/*
 * Finds all the topic ids in a document and adds the topic id to the bottom of the title.
 */
function findTopicIds() {
    var foundTopics = {};
    var elements = document.getElementsByTagName("div");
    for (var i = elements.length - 1; i >= 0; --i) {
        var element = elements[i];
        if (element.className.match(".*RoleCreateBugPara.*")) {
            if (element.innerHTML.match(".*Report a bug.*")) {
                var startPos = element.innerHTML.search(MATCH_BUILD_ID);
                if (startPos != -1) {
                    var temp = element.innerHTML.substring(startPos + MATCH_PREFIX.length);
                    var endPos = temp.search("(?![0-9]+).*");
                    var id = temp.substring(0, endPos);
                    if (!foundTopics[id]) {
                        addOverlayIcons(id, element);
                        foundTopics[id] = true;
                    }
                }
            } else if (element.innerHTML.match(".*Edit this topic.*")) {
                var startPos = element.innerHTML.search(MATCH_BUILD_ID2);
                if (startPos != -1) {
                    var temp = element.innerHTML.substring(startPos + MATCH_PREFIX2.length);
                    var endPos = temp.search("(?![0-9]+).*");
                    var id = temp.substring(0, endPos);
                    if (!foundTopics[id]) {
                        addOverlayIcons(id, element);
                        foundTopics[id] = true;
                    }
                }
            }
        }
    }
    return null;
}

/**
 * Create the icon used to display a popup
 * @param img The name of the image to be used for the icon, exluding the filename
 * @param topicId The topic id
 * @returns The icon element
 */
function createIcon(img, topicId) {
    var linkDiv = document.createElement("div");
    linkDiv.setAttribute("id", topicId + img + "Icon");
    linkDiv.style.backgroundImage = "url(/images/" + img + ".png)";
    linkDiv.style.width = "26px";
    linkDiv.style.height = "26px";
    linkDiv.style.cssFloat = "left";
    linkDiv.style.backgroundRepeat = "no-repeat";
    linkDiv.style.margin = "8px";

	var countDiv = document.createElement("div");
	countDiv.style.position = "relative";
	countDiv.style.left = "14px";
	countDiv.style.top = "14px";
	countDiv.style.width = "12px";
	countDiv.style.height = "12px";
	countDiv.style.backgroundSize = "cover";

	linkDiv.appendChild(countDiv);
	linkDiv.countMarker = countDiv;

    return linkDiv;
}

function updateCount(linkDiv, count) {
	if (count >= 1 && count <= 10) {
		linkDiv.countMarker.style.backgroundImage = "url(/images/" + count + ".png)";
	} else if (count > 10) {
		linkDiv.countMarker.style.backgroundImage = "url(/images/10plus.png)";
	} else {
		linkDiv.countMarker.style.backgroundImage = null;
	}
}

/**
 * Create the popover element
 * @param title The title of the popover
 * @param topicId The topic's ID
 * @returns The popover element
 */
function createPopover(title, topicId) {
    var popover = document.createElement("div");
    popover.setAttribute("id", topicId + "title");
    popover.style.position="absolute";
    popover.style.height='300px';
    popover.style.width='750px';
    popover.style.display = 'none';
    popover.style.backgroundColor = 'white';
    popover.style.borderColor = 'blue';
    popover.style.borderWidth = '2px';
    popover.style.borderStyle = 'solid';

    var popoverTitle = document.createElement("div");
    popoverTitle.style.width = "742px";
    popoverTitle.style.height = "30px";
    popoverTitle.style.paddingLeft = "8px";
    popoverTitle.style.color = "white";
    popoverTitle.style.backgroundColor = "blue";
    popoverTitle.style.fontWeight = "bold";
    popoverTitle.style.display = "table-cell";
    popoverTitle.style.verticalAlign = "middle";
    $(popoverTitle).text(title);

    popover.appendChild(popoverTitle);

    var popoverContent = document.createElement("div");
    popoverContent.style.margin = "8px";
    popoverContent.style.height = "254px";
    popoverContent.style.overflowY = "auto";
	$(popoverContent).text('Loading...');
    popover.appendChild(popoverContent);

    popover.popoverContent = popoverContent;

    return popover;
}

function secondPass() {

}