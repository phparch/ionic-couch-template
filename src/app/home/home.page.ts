// Angular
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
// PouchDB
import cordovaSqlitePlugin from 'pouchdb-adapter-cordova-sqlite';
import PouchDB from 'pouchdb';
import { Subject } from 'rxjs';

const COUCH_DATABASE_NAME = 'test_database_name';
const COUCH_PASSWORD = "FIX_ME";
const COUCH_REMOTE_URL = "FIX_ME";
const COUCH_USERNAME = "FIX_ME";
const DATABASE_NAME_EXTENSION = '.db'


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class HomePage {
  public textArea: string;
  public syncNotifications: Subject<any>;
  public syncHandlerDatabase: any;

  private localDB: any;
  private remoteDB: any;

  constructor(
  ) {
    this.textArea = 'Empty';
    this.localDB = null;
    this.syncNotifications = new Subject();

    PouchDB.plugin(cordovaSqlitePlugin);

    this.createDatabase();
  }

  public async getAllDocumentsClick() {
    const allDocs = await this.getAllDocuments(this.localDB);

    if (allDocs.length === 0) {
      this.textArea = 'No documents';
      return;
    }

    this.textArea = allDocs.join('\n');
  }

  public getAllDocuments(database: PouchDB.Database): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      let allPromises = [];

      // Get all documents before design documents
      allPromises.push(database.allDocs({ include_docs: true, endkey: '_' }));
      // Get all documents after design documents
      allPromises.push(database.allDocs({ include_docs: true, startkey: '`' }));

      Promise.all(allPromises).then(values => {
        const beforeDesignDocs = values[0].rows.map(row => row.doc);
        const afterDesignDocs = values[1].rows.map(row => row.doc);
        const allDocs = beforeDesignDocs.concat(afterDesignDocs);

        resolve(allDocs);
      }, error => {
        reject(error);
      });
    });
  }

  private createDatabase(): Promise<PouchDB.Database> {
    return new Promise((resolve, reject) => {
      try {
        this.localDB = this.createLocalDatabase(COUCH_DATABASE_NAME);

        const databaseURL = this.getCouchDatabaseURLWithCredentials(COUCH_USERNAME, COUCH_PASSWORD) + COUCH_DATABASE_NAME;
        this.remoteDB = this.createRemoteDatabase(databaseURL);

        this.syncHandlerDatabase = this.syncDatabases(this.localDB, this.remoteDB, {
          live: true,
          retry: true,
        });

        resolve(this.localDB);
      } catch (error) {
        reject(error);
      }
    });
  }

  private createLocalDatabase(name: string, options = {}): PouchDB.Database {
    const pouchDbCommonOptions = { adapter: 'cordova-sqlite' };
    let pouchDbOptions = {
      ...pouchDbCommonOptions,
      ...options
    }
    let dbName = this.addDBNameExtensionIfNeeded(name);

    return new PouchDB(dbName, pouchDbOptions);
  }

  private createRemoteDatabase(path: string): PouchDB.Database {
    return new PouchDB(path);
  }

  private syncDatabases(localDB: any, remoteDB: any, syncOptions: any) {
    return localDB.sync(remoteDB, syncOptions)
      .on('change', (info: any) => {
        console.log('Handling syncing change');
        this.syncNotifications.next({
          status: 'sync:change',
          info: info,
          database: localDB.name
        });
      })
      .on('paused', (info: any) => {
        console.log('Handling syncing pause');
        this.syncNotifications.next({
          status: 'sync:paused',
          info: info,
          database: localDB.name
        });
      })
      .on('active', (info: any) => {
        console.log('Handling syncing resumption');
        this.syncNotifications.next({
          status: 'sync:active',
          info: info,
          database: localDB.name
        });
      })
      .on('denied', (error: any) => {
        console.log('Handling syncing denied');
        console.error(error);
        this.syncNotifications.next({
          status: 'sync:denied',
          info: error,
          database: localDB.name
        });
      })
      .on('complete', (info: any) => {
        console.log('Handling syncing complete');
        this.syncNotifications.next({
          status: 'sync:complete',
          info: info,
          database: localDB.name
        });
      })
      .on('error', (error: any) => {
        console.log('Handling syncing error');
        console.error(error);
        this.syncNotifications.next({
          status: 'sync:error',
          info: error,
          database: localDB.name
        });
      });
  }

  private getCouchDatabaseURLWithCredentials(username: string, password: string): string {
    if (!username || !password) return COUCH_REMOTE_URL;

    const scheme = this.getCouchDatabaseScheme();
    const domain = this.getCouchDatabaseDomain();

    if ( !scheme || !domain) return COUCH_REMOTE_URL;

    return scheme + username + ':' + password + '@' + domain + '/';
  }

  private getCouchDatabaseScheme(): string | null {
    const couchDatabaseURL = COUCH_REMOTE_URL;
    if (!couchDatabaseURL) return null;

    const couchDatabaseURLParts = couchDatabaseURL.split('://');
    if (couchDatabaseURLParts.length !== 2) return null;

    return couchDatabaseURLParts[0] + '://';
  }

  private getCouchDatabaseDomain(): string | null {
    const couchDatabaseURL = COUCH_REMOTE_URL;
    if (!couchDatabaseURL) return null;

    const couchDatabaseURLParts = couchDatabaseURL.split('://');
    if (couchDatabaseURLParts.length !== 2) return null;

    return couchDatabaseURLParts[1];
  }

  private addDBNameExtensionIfNeeded(name: string): string {
    if (name.substr(name.lastIndexOf("."), name.length) === DATABASE_NAME_EXTENSION) return name;

    return name + DATABASE_NAME_EXTENSION;
  }

}
