# Changelog #
**Version 1.28.1:** (_Chrome, Opera_)
  * Prevent the background page from closing when the 'choose an email service' window is opened
  * Sort the email services alphabetically again

**Version 1.28.0:** (_Chrome, Opera_)
  * Redesigned the options page
  * The extension can be disabled on certain URLs

**Version 1.27.0:** (_Chrome, Opera_)
  * Remove Safari code from the extension
  * Remove My Opera mail as it will be discontinued

**Version 1.26.0:** (_Chrome, Opera_)
  * Prevent 'saved' label from flashing up when 'ask me every time' is used
  * Fix issue where the email service opened as a very small popup in Opera
  * Allow removing/editing the predefined email services
  * Allow renaming the email services
  * Add My Opera mail as predefined email service
  * Warn when the context menu option is enabled, but is incompatible with the selected email service
  * Do not remove the email service if the options page is reloaded while editing the service
  * Correct typo in Dutch translation

**Version 1.25.0:** (_Opera_)
  * Never send password form fields, even if they're valid input to the URL
  * Filter out non-to/cc/bcc/body/subject values in the content script instead of the background page
  * Add support for Opera (version 15+)

**Version 1.24.0:** (_Chrome_)
  * Only launch the background page when it's really needed

**Version 1.23.5:** (_Chrome, Safari_)
  * Attempt to fix Safari 6
  * A few fixes for the previous commit

**Version 1.23.4:** (_Chrome, Safari_)
  * Fix an compression issue
  * Use more https URLs, this time for updating and docs

**Version 1.23.3:** (_Chrome, Safari_)
  * Update the links for FastMail and Hotmail/WLM. The latter now also supports outlook.com
  * Move Safari code out of the background in Chrome

**Version 1.23.2:** (_Chrome_)
  * Update the manifest file to version 2

**Version 1.23.1:** (_Chrome, Safari_)
  * Remove trailing whitespace from custom URLs

**Version 1.23.0:** (_Chrome, Safari_)
  * Add 'use system default' option to the 'ask me every time' dialog
  * Fix behavior when the popup from 'ask me every time' closes after 60 seconds, when it was opened via the context menu.

**Version 1.22.0:** (_Chrome, Safari_)
  * Add a context menu entry to send the URL and title of the current page
  * Wrong cursor was shown for hidden 'saved' labels

**Version 1.21.1:** (_Chrome_)
  * Revert manifest file version update

**Version 1.21.0:** (_Chrome, Safari_)
  * Link to the help page for the custom URL syntax

**Version 1.20.0:** (_Chrome, Safari_)
  * Add support for `{url}`, which inserts the full mailto: url into that position of the link.

**Version 1.19.3:** (_Chrome_)
  * Update the manifest file to version 2

**Version 1.19.2:** (_Chrome, Safari_)
  * Fix multiple `{X}` not being replaced
  * Make JSLint happy
  * Use a different compressor

**Version 1.19.1:** (_Chrome, Safari_)
  * If no (or an unknown) mail client has been set, default to ask\_every\_time behavior.
  * Don't popup on browser start if 'asking' has been enabled

**Version 1.19.0:** (_Chrome, Safari_)
  * Add 'Ask me every time' option. (Chrome only)

**Version 1.18.0:** (_Chrome, Safari_)
  * Implement multiple custom URLs
  * Correct usage of `addEventListener`

**Version 1.17.0:** (_Chrome, Safari_)
  * Apply `content_security_policy`

**Version 1.16.1:** (_Chrome, Safari_)
  * Do not allow urls without top level domain name as custom URLs
  * Use valid HTML5/CSS3 in the options page
  * Fix the 'restart' message appearing several times in Safari

**Version 1.16.0:** (_Chrome, Safari_)
  * Add custom URL support

**Version 1.15.0:** (_Chrome, Safari_)
  * Add support for Safari

**Version 1.14.0:** (_Chrome_)
  * Add donate button to the options page

**Version 1.13.0:** (_Chrome_)
  * Support AOL mail

**Version 1.12.0:** (_Chrome_)
  * Use `(de|en)codeURIComponent` instead of `(un)escape`
  * Work around the Yahoo Mail newlines bug
  * Correct some issues with form submits that have disabled or unchecked components
  * Correct some issues with form `method="post"` submits

**Version 1.11.0:** (_Chrome_)
  * Preparing code for custom URLs

**Version 1.10.1:** (_Chrome_)
  * Check if `e.target.action` does exist

**Version 1.10.0:** (_Chrome_)
  * `Mailto://` links were incorrectly parsed as '`to=//`'
  * Make it work for links inserted after the page has loaded

**Version 1.9.0:** (_Chrome_)
  * Prevent nearly-duplicate code

**Version 1.8.3:** (_Chrome_)
  * Allow `mailto:` (without anything after the ":"), which simply creates an empty new message

**Version 1.8.2:** (_Chrome_)
  * Make it work for `<form action="mailto:email@provider.com">...</form>` too

**Version 1.8.1:** (_Chrome_)
  * Get rid of a variable and a `.match` call

**Version 1.8.0:** (_Chrome_)
  * Add support for `<form>` submissions with mailto: as action

**Version 1.7.1:** (_Chrome_)
  * Some code cleanup

**Version 1.7.0:** (_Chrome_)
  * Fix an issue when the `<a>` tag wasn't the topmost element, but nested in other tags.

**Version 1.6.1:** (_Chrome_)
  * Fix an issue for WLM users

**Version 1.6.0:** (_Chrome_)
  * Add support for Fastmail

**Version 1.5.0:** (_Chrome_)
  * Use eventhandlers instead of the onclick attribute
  * Parse links when they are clicked instead of when loaded.

**Version 1.4.1:** (_Chrome_)
  * Make some validators (JSHint, validator.w3.org) happier with the code

**Version 1.4.0:** (_Chrome_)
  * Make [this](http://shadow2531.com/opera/testcases/mailto/rfc2368-1.html) test case work:  (as far as it is supported by the email services)
    * Support multiple 'to', 'cc', 'bcc' and 'body' arguments
    * Escape special characters
  * Fix a bug with Hotmail when no 'to' argument exists

**Version 1.3.1:** (_Chrome_)
  * Fix an issue with multiple email addresses separated by commas for Hotmail.

**Version 1.3.0:** (_Chrome_)
  * Better compression of `mailto.js`
  * Display WLM and Hotmail as two different items, although they are the same
  * Support BCC for Gmail and Yahoo mail
  * Support Zoho mail

**Version 1.2.1:** (_Chrome_)
  * Add a missing translation
  * Do not include `.svn` files in the package

**Version 1.2.0:** (_Chrome_)
  * Added support for translations

**Version 1.1.0:** (_Chrome_)
  * Show a 'saved' message when you change an option

**Version 1.0.0:** (_Chrome_)
  * Initial release
