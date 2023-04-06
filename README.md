# ionic-couch-template

This repo is a template application for using PouchDB to communicate with a CouchDB server.  This uses Ionic Capacitor with Angular to make a blank app and adding PouchDB.  Currently this template app is mainly to show how CouchDB, PouchDB, Ionic, Capacitor, and Angular all work together.  Would accept pull requests for adding functionality to the template.


### These are the step that were performed to integrate PouchDB:
```
npm install pouchdb --save
npm install @types/pouchdb --save
npm install cordova-plugin-sqlite-2 --save
npm install pouchdb-adapter-cordova-sqlite --save
```

### Note:
`cordova-plugin-sqlite-2` only works on the device and not the web.  Android is currently configured with this app but it should also work with iOS.  The web can be configured to be used as well but would require a different plugin driver for PouchDB.  Would accept pull requests for this or any other added functionality that could be deemed useful for the template.

### Other changes performed:

Add to `tsconfig.json`:
```
"allowSyntheticDefaultImports": true,
```

Add to `polyfills.ts`:
```
// For PouchDB - Add global to window, assigning the value of window itself.
(window as any).global = window;
```
