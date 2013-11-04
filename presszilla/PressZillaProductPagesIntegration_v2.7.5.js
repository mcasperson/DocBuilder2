(function(){
    /**
     * The height of each process in the timeline
     * @type {number}
     */
    var PRESSGANG_TIMELINE_ITEM_HEIGHT = 10;
    /**
     * The number of times to retry the product pages API
     * @type {number}
     */
    var PRODUCT_PAGES_RETRY = 5;

    // Edited from http://raphaeljs.com/github/impact-code.js
    var process = function (json) {

        logToConsole("Creating offscreen rendering area");

        var timelineChartDiv = jQuery('<div id="timelineChartDiv" style="position: absolute; top:0; left: 0; right: 0; height: 150px"></div>');
        timelineChartDiv.appendTo(jQuery('#offscreenRendering'));

        // raphael charts need to be drawn in an element attached to the DOM
        setTimeout(function() {

            logToConsole("Creating timeline graph");

            timelineChartDiv.appendTo(jQuery("body"));

            var x = 0,
                timelineChart = Raphael("timelineChartDiv", window.innerWidth, 150),
            //labels = {},
            //textattr = {"font": '9px "Arial"', stroke: "none", fill: "#fff"},
                pathes = {},
                lgnd2 = $("#legend2")[0],
                usrnm2 = $("#username2")[0];

            function hashCode(s) {
                return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
            }

            function finishes() {

                logToConsole("finishes()");

                // look for the first and last time an author is mentioned in a bucket
                for (var i in json.processes) {
                    var start, end;

                    // look for the last bucket (buckets have to be sorted by date)
                    for (var j = json.buckets.length - 1; j >= 0; j--) {
                        var isin = false;
                        for (var k = 0, kk = json.buckets[j].processes.length; k < kk; k++) {
                            isin = isin || (json.buckets[j].processes[k][0] == i);
                        }
                        if (isin) {
                            end = j;
                            break;
                        }
                    }

                    // look for the first bucket
                    for (var j = 0, jj = json.buckets.length; j < jj; j++) {
                        var isin = false;
                        for (var k = 0, kk = json.buckets[j].processes.length; k < kk; k++) {
                            isin = isin || (json.buckets[j].processes[k][0] == i);
                        };
                        if (isin) {
                            start = j;
                            break;
                        }
                    }

                    // add the author to every bucket inbetween if not already present
                    for (var j = start, jj = end; j < jj; j++) {
                        var isin = false;
                        for (var k = 0, kk = json.buckets[j].processes.length; k < kk; k++) {
                            isin = isin || (json.buckets[j].processes[k][0] == i);
                        }
                        if (!isin) {
                            json.buckets[j].processes.push(i);
                        }
                    }
                }
            }
            function block() {

                logToConsole("block()");

                var p, h;
                finishes();
                for (var j = 0, jj = json.buckets.length; j < jj; j++) {
                    var processes = json.buckets[j].processes;
                    h = 0;
                    for (var i = 0, ii = processes.length; i < ii; i++) {
                        p = pathes[processes[i]];
                        if (!p) {
                            p = pathes[processes[i]] = {f:[], b:[]};
                        }
                        // push an array with x (x pos), h (height) and the number of commits
                        p.f.push([x, h]);
                        // add the x (x pos) and a height based on the number of commits to the start of the array
                        p.b.unshift([x, h += PRESSGANG_TIMELINE_ITEM_HEIGHT]);
                        h += 2;
                    }
                    // get date from milliseconds
                    var dt = json.buckets[j].date;
                    var dtext = dt.getDate() + " " + ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][dt.getMonth()] + " " + dt.getFullYear();
                    timelineChart.text(x + 25, h + 10, dtext).attr({"font": '9px "Arial"', stroke: "none", fill: "#aaa"});
                    x += 100;
                }
                var c = 0;
                for (var i in pathes) {
                    //labels[i] = timelineChart.set();

                    var hash = hashCode(json.processes[i].name);
                    var mask = parseInt("11111111", 2);

                    red += (hash & mask) / mask;
                    hash = hash << 2;
                    green += (hash & mask) / mask;
                    hash = hash << 2;
                    blue += (hash & mask) / mask;

                    var clr = Raphael.getRGB("rgb(" + (red * 255) + "," + (green * 255) + "," + (blue * 255) + ")");
                    pathes[i].p = timelineChart.path().attr({fill: clr, stroke: clr});
                    var path = "M".concat(pathes[i].f[0][0], ",", pathes[i].f[0][1], "L", pathes[i].f[0][0] + 50, ",", pathes[i].f[0][1]);
                    var th = Math.round(pathes[i].f[0][1] + (pathes[i].b[pathes[i].b.length - 1][1] - pathes[i].f[0][1]) / 2 + 3);
                    //labels[i].push(timelineChart.text(pathes[i].f[0][0] + 25, th, pathes[i].f[0][2]).attr(textattr));
                    var X = pathes[i].f[0][0] + 50,
                        Y = pathes[i].f[0][1];
                    for (var j = 1, jj = pathes[i].f.length; j < jj; j++) {
                        path = path.concat("C", X + 20, ",", Y, ",");
                        X = pathes[i].f[j][0];
                        Y = pathes[i].f[j][1];
                        path = path.concat(X - 20, ",", Y, ",", X, ",", Y, "L", X += 50, ",", Y);
                        th = Math.round(Y + (pathes[i].b[pathes[i].b.length - 1 - j][1] - Y) / 2 + 3);
                        if (th - 9 > Y) {
                            //labels[i].push(timelineChart.text(X - 25, th, pathes[i].f[j][2]).attr(textattr));
                        }
                    }
                    path = path.concat("L", pathes[i].b[0][0] + 50, ",", pathes[i].b[0][1], ",", pathes[i].b[0][0], ",", pathes[i].b[0][1]);
                    for (var j = 1, jj = pathes[i].b.length; j < jj; j++) {
                        path = path.concat("C", pathes[i].b[j][0] + 70, ",", pathes[i].b[j - 1][1], ",", pathes[i].b[j][0] + 70, ",", pathes[i].b[j][1], ",", pathes[i].b[j][0] + 50, ",", pathes[i].b[j][1], "L", pathes[i].b[j][0], ",", pathes[i].b[j][1]);
                    }
                    pathes[i].p.attr({path: path + "z"});
                    //labels[i].hide();
                    var current = null;
                    (function (i) {
                        pathes[i].p.mouseover(function () {
                            if (current != null) {
                                //labels[current].hide();
                            }
                            current = i;
                            //labels[i].show();
                            pathes[i].p.toFront();
                            //labels[i].toFront();
                            usrnm2.innerHTML = json.processes[i].name;
                            lgnd2.style.backgroundColor = pathes[i].p.attr("fill");
                        });
                    })(i);
                }
            }

            block();

        }, 0);


    };

    var solutionsUrl = "https://pp.engineering.redhat.com/pp/action/explorer/fedora-20/all/cpe,schedule/";
    function getSchedule(count) {
        if (count >= PRODUCT_PAGES_RETRY) {
            // handle error
        } else {

            logToConsole("Getting Schedules");

            GM_xmlhttpRequest({
                method: 'GET',
                url: solutionsUrl,
                headers: {Accept: 'application/json'},
                onabort: function() {logToConsole("onabort"); getSchedule(++count);},
                onerror: function() {logToConsole("onerror"); getSchedule(++count);},
                onprogress: function() {logToConsole("onprogress");},
                onreadystatechange: function() {logToConsole("onreadystatechange");},
                ontimeout: function() {logToConsole("ontimeout"); getSchedule(++count);},
                onload: function(response) {
                    logToConsole(response);

                    var responseJson = JSON.parse(response);

                    if (responseJson.length != 0 && responseJson[0].schedule) {

                        var data = {buckets: [], processes: {}};

                        for (var scheduleIndex = 0, scheduleCount = responseJson[0].schedule.length; scheduleIndex < scheduleCount; ++scheduleIndex) {
                            var schedule = responseJson[0].schedule[scheduleIndex];
                            var foundSchedule = false;
                            var maxId = null;
                            var processId = null;
                            for (var scheduleDetails in data.processes) {
                                if (data.processes[scheduleDetails] == schedule.name) {
                                    foundSchedule = true;
                                    processId = scheduleDetails;
                                }

                                if (!maxId || maxId < scheduleDetails) {
                                    maxId = scheduleDetails;
                                }
                            }

                            if (!foundSchedule) {
                                processId = maxId ? 0 : maxId + 1;
                                data.processes[processId] = schedule.name;
                            }

                            var startDate = new Date(schedule.start.actual.timet * 1000);
                            var endDate = new Date(schedule.end.actual.timet * 1000);
                            var startBucket = null;
                            var endBucket = null;
                            for (var bucketIndex = 0, bucketCount = data.buckets.length; bucketIndex < bucketCount; ++bucketIndex) {
                                var bucket = data.buckets[bucketIndex];
                                if (bucket.date == startDate) {
                                    startBucket = bucket;
                                }

                                if (bucket.date == endDate) {
                                    endBucket = bucket;
                                }

                                if (startBucket && endBucket) {
                                    break;
                                }
                            }

                            if (!startBucket) {
                                data.buckets.push({date: startDate, processes: [processId]});
                            } else {
                                startBucket.processes.push(processId);
                            }

                            if (!endBucket) {
                                data.buckets.push({date: endDate, processes: [processId]});
                            } else {
                                endBucket.processes.push(processId);
                            }
                        }

                        // sort the buckets
                        data.buckets.sort(function(a, b){
                            if (a.date < b.date)
                                return -1;
                            if (a.date > b.date)
                                return 1;
                            return 0;
                        });

                        process(data);
                    }
                }
            });
        }
    }

    getSchedule(0);

})();