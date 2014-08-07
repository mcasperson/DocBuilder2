/*
 Copyright 2011-2014 Red Hat, Inc

 This file is part of PressGang CCMS.

 PressGang CCMS is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 PressGang CCMS is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with PressGang CCMS.  If not, see <http://www.gnu.org/licenses/>.
 */


/*
 This file contains deployment specific info, like what server to contact for REST queries. When deploying
 DocBuilder, the contents of this file is all you will have to change.

 This file is currently configured for DocBuilder Next. This means the logo and links to the UI all reference
 Next.

 The stable release of DocBuilder should change the logo and links to the UI to not reference next.
 */
module.exports = {
    /**
     * The REST server hostname and port
     * @type {string}
     */
    BASE_SERVER:  "localhost:8080",
    /**
     * The UI instance to point to
     */
    UI_URL: "pressgang-ccms-ui",
    /**
     * The DocBuilder server
     */
    DOCBUILDER_SERVER: "localhost",
    /**
     * The marker in the OPEN_LINK string that is to be replaced by the spec ID
     */
    OPEN_LINK_ID_REPLACE: "${ID}",
    /**
     * The marker in the OPEN_LINK string that is to be replaced by the spec ID
     */
    OPEN_LINK_LOCALE_REPLACE: "${LOCALE}",
    /**
     * Where the links to open the books should go. Replace ${ID} with the spec ID
     */
    OPEN_LINK: "http://localhost/${ID}", //http://skynet.usersys.redhat.com:8080/pressgang-ccms-ui/#DocBuilderView;${ID}
    /**
     * Where the links to edit the books should go. Replace ${ID} with the spec ID
     */
    EDIT_LINK: "http://localhost:8080/pressgang-ccms-ui/#ContentSpecFilteredResultsAndContentSpecView;query;contentSpecIds=${ID}",
    /**
     * The file that holds the lat time a complete rebuild was completed.
     * @type {string}
     */
    LAST_RUN_FILE: "/root/.docbuilder/docbuilder2_lastrun",
    /**
     * The web root dir.
     * @type {string}
     */
    APACHE_HTML_DIR: "/var/www/html",
    /**
     * The data javascript file for the DocBuilder
     * @type {string}
     */
    DATA_JS: "/var/www/html/data.js",
    /**
     * The maximum number of child processes to run at any given time.
     * @type {number}
     */
    MAX_PROCESSES: 6,
    /**
    * The amount of time to wait, in milliseconds, before querying the server when no
    * updates were found.
    * @type {number}
    */
    DELAY_WHEN_NO_UPDATES: 10000
}
