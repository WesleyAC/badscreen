# bad screen

A Firefox extension to block the Bad Websites.

It allows blocking and allowing websites on a schedule, as well as temporarily disabling a block for a configurable period of time after a configurable delay.

[You can install it here](https://addons.mozilla.org/en-US/firefox/addon/bad-screen/)

![](screenshots/screenshot_1.png?raw=true)
![](screenshots/screenshot_2.png?raw=true)

## changelog

### v0.0.5

* Fix several bugs involving blocklist failing to update

### v0.0.4

* Fix bug that caused temp allows to be out of sync with the UI

### v0.0.3

* Block all subdomains of blocked domains

### v0.0.2

* Update icon to have transparent background
* Remove unneeded files from bundle

### v0.0.1

* Only intercept requests that we know will be blocked, fixing bug where all requests were slowed down whenever the extension was installed.

### v0.0.0

* Initial release. It's bad. Don't use it.

## note to addon reviewer

The minified code in `3p/htm.js` is third-party code — it's a vendored copy of `https://unpkg.com/htm@3.1.0/dist/htm.module.js?module`. The source code to generate that file is at https://github.com/developit/htm/.
