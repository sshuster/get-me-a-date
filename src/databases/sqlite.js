/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Promise = require('bluebird')

const sqlite3 = require('sqlite3')

const { mkdirAsync, existsSync } = Promise.promisifyAll(require('fs'))

const { join } = require('path')

const createFile = function () {
  return Promise.resolve()
    .then(() => {
      const path = join(__dirname, '../../tmp/')

      if (!existsSync(path)) {
        return mkdirAsync(path)
      }
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        const path = join(__dirname, '../../tmp/get-me-a-date.db')
        const options = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        const callback = (error) => {
          if (error) {
            reject(error)

            return
          }

          resolve()
        }

        this._database = Promise.promisifyAll(new sqlite3.Database(path, options, callback))
      })
    })
}

const createSchema = function () {
  return this._database.runAsync(
    'CREATE TABLE IF NOT EXISTS recommendations (' +
    'id VARCHAR(36) NOT NULL, ' +
    'channel VARCHAR(32) NOT NULL, ' +
    'channel_id VARCHAR(64) NOT NULL, ' +
    'created_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
    'updated_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
    'name VARCHAR(32) DEFAULT NULL,' +
    'thumbnail_url VARCHAR(512) DEFAULT NULL,' +
    'photos TEXT NOT NULL,' +
    'photos_similarity_mean REAL DEFAULT NULL,' +
    'checked_out_times INTEGER NOT NULL DEFAULT 0,' +
    'last_checked_out_date DATETIME DEFAULT NULL,' +
    'like INTEGER NOT NULL DEFAULT 0,' +
    'is_pass INTEGER NOT NULL DEFAULT 0,' +
    'decision_date DATETIME DEFAULT NULL,' +
    'is_human_decision INTEGER NOT NULL DEFAULT 0,' +
    'match INTEGER NOT NULL DEFAULT 0,' +
    'match_id VARCHAR(64) DEFAULT NULL,' +
    'matched_date DATETIME DEFAULT NULL,' +
    'train INTEGER NOT NULL DEFAULT 0,' +
    'trained_date DATETIME DEFAULT NULL,' +
    'data TEXT NOT NULL,' +
    'PRIMARY KEY (channel, channel_id)' +
    ')')
    .then(() => this._database.runAsync(
      'CREATE TABLE IF NOT EXISTS channels (' +
      'name VARCHAR(32) NOT NULL, ' +
      'created_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'updated_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'is_enabled INTEGER NOT NULL DEFAULT 0,' +
      'user_id VARCHAR(64) DEFAULT NULL,' +
      'auth_id INTEGER NULL,' +
      'last_activity_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))),' +
      'is_out_of_likes INTEGER NOT NULL DEFAULT 0,' +
      'out_of_likes_date DATETIME DEFAULT NULL,' +
      'PRIMARY KEY (name)' +
      ')'))
    .then(() => this._database.runAsync(
      'CREATE TABLE IF NOT EXISTS auth (' +
      'id INTEGER PRIMARY KEY,' +
      'created_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'updated_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'token TEXT NOT NULL' +
      ')'))
    .then(() => this._database.runAsync(
      'CREATE TABLE IF NOT EXISTS stats (' +
      'date DATE PRIMARY KEY,' +
      'created_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'updated_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'machine_likes INTEGER NOT NULL DEFAULT 0,' +
      'human_likes INTEGER NOT NULL DEFAULT 0,' +
      'machine_passes INTEGER NOT NULL DEFAULT 0,' +
      'human_passes INTEGER NOT NULL DEFAULT 0,' +
      'trains INTEGER NOT NULL DEFAULT 0,' +
      'matches INTEGER NOT NULL DEFAULT 0,' +
      'skips INTEGER NOT NULL DEFAULT 0' +
      ')'))
    .then(() => this._database.runAsync(
      'CREATE TABLE IF NOT EXISTS messages (' +
      'channel VARCHAR(32) NOT NULL, ' +
      'channel_message_id VARCHAR(64) NOT NULL, ' +
      'created_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'updated_date DATETIME DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', datetime(\'now\'))), ' +
      'recommendation_id VARCHAR(36) NOT NULL, ' +
      'sent_date DATETIME NOT NULL, ' +
      'is_from_recommendation INTEGER NOT NULL,' +
      'text TEXT NOT NULL,' +
      'PRIMARY KEY (channel, channel_message_id)' +
      ')'))
}

class SQLite {
  start () {
    if (this._database) {
      return Promise.resolve()
    }

    return createFile.bind(this)()
      .then(() => createSchema.bind(this)())
  }

  run (sql, param) {
    return new Promise((resolve, reject) => {
      this._database.run(sql, param, function (error) {
        if (error) {
          return reject(error)
        }

        resolve(this)
      })
    })
  }

  get (...args) {
    return this._database.getAsync(...args)
  }

  all (...args) {
    return this._database.allAsync(...args)
  }
}

module.exports = new SQLite()