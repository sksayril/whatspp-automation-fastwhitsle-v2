const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { app } = require('electron')

class QuickReplyService {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'quickreplies.db')
    console.log('Quick Reply Database path:', dbPath)
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening quick reply database:', err)
      } else {
        console.log('Quick reply database connected successfully')
        this.initializeDatabase()
      }
    })
  }

  initializeDatabase() {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS quick_replies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        triggerType TEXT NOT NULL,
        triggerPattern TEXT,
        isActive BOOLEAN DEFAULT 1,
        templateId TEXT,
        delay INTEGER DEFAULT 0,
        timeFrom TEXT,
        timeTo TEXT,
        daysOfWeek TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS quick_reply_options (
        id TEXT PRIMARY KEY,
        quickReplyId TEXT NOT NULL,
        optionNumber INTEGER NOT NULL,
        responseTemplateId TEXT NOT NULL,
        createdAt TEXT,
        FOREIGN KEY (quickReplyId) REFERENCES quick_replies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quick_reply_stats (
        id TEXT PRIMARY KEY,
        quickReplyId TEXT NOT NULL,
        triggeredCount INTEGER DEFAULT 0,
        lastTriggered TEXT,
        FOREIGN KEY (quickReplyId) REFERENCES quick_replies(id) ON DELETE CASCADE
      );
    `

    return new Promise((resolve, reject) => {
      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          console.error('Error creating quick reply tables:', err)
          reject(err)
        } else {
          console.log('Quick reply tables created or already exist')
          resolve()
        }
      })
    })
  }

  async create(quickReply) {
    const id = Date.now().toString()
    const now = new Date().toISOString()

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION')

        try {
          // Insert main quick reply
          const mainSql = `
            INSERT INTO quick_replies (
              id, name, triggerType, triggerPattern, isActive,
              templateId, delay, timeFrom, timeTo, daysOfWeek,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          
          const mainParams = [
            id,
            quickReply.name,
            quickReply.triggerType,
            quickReply.triggerPattern,
            quickReply.isActive ? 1 : 0,
            quickReply.templateId,
            quickReply.delay || 0,
            quickReply.timeFrom,
            quickReply.timeTo,
            JSON.stringify(quickReply.daysOfWeek || []),
            now,
            now
          ]

          this.db.run(mainSql, mainParams)

          // Insert options if any
          if (quickReply.options && quickReply.options.length > 0) {
            const optionSql = `
              INSERT INTO quick_reply_options (
                id, quickReplyId, optionNumber, responseTemplateId, createdAt
              ) VALUES (?, ?, ?, ?, ?)
            `

            quickReply.options.forEach((option, index) => {
              const optionParams = [
                `${id}-option-${index + 1}`,
                id,
                option.number,
                option.responseTemplateId,
                now
              ]
              this.db.run(optionSql, optionParams)
            })
          }

          // Initialize stats
          const statsSql = `
            INSERT INTO quick_reply_stats (
              id, quickReplyId, triggeredCount, lastTriggered
            ) VALUES (?, ?, 0, NULL)
          `
          this.db.run(statsSql, [`${id}-stats`, id])

          this.db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error in commit:', err)
              reject(err)
              return
            }

            resolve({
              success: true,
              quickReply: {
                ...quickReply,
                id,
                createdAt: now,
                updatedAt: now,
                stats: { triggeredCount: 0, lastTriggered: null }
              }
            })
          })
        } catch (error) {
          this.db.run('ROLLBACK')
          console.error('Error creating quick reply:', error)
          reject(error)
        }
      })
    })
  }

  async update(id, quickReply) {
    const now = new Date().toISOString()

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION')

        try {
          // Update main quick reply
          const mainSql = `
            UPDATE quick_replies 
            SET name = ?,
                triggerType = ?,
                triggerPattern = ?,
                isActive = ?,
                templateId = ?,
                delay = ?,
                timeFrom = ?,
                timeTo = ?,
                daysOfWeek = ?,
                updatedAt = ?
            WHERE id = ?
          `
          
          const mainParams = [
            quickReply.name,
            quickReply.triggerType,
            quickReply.triggerPattern,
            quickReply.isActive ? 1 : 0,
            quickReply.templateId,
            quickReply.delay || 0,
            quickReply.timeFrom,
            quickReply.timeTo,
            JSON.stringify(quickReply.daysOfWeek || []),
            now,
            id
          ]

          this.db.run(mainSql, mainParams)

          // Delete existing options
          this.db.run('DELETE FROM quick_reply_options WHERE quickReplyId = ?', [id])

          // Insert new options
          if (quickReply.options && quickReply.options.length > 0) {
            const optionSql = `
              INSERT INTO quick_reply_options (
                id, quickReplyId, optionNumber, responseTemplateId, createdAt
              ) VALUES (?, ?, ?, ?, ?)
            `

            quickReply.options.forEach((option, index) => {
              const optionParams = [
                `${id}-option-${index + 1}`,
                id,
                option.number,
                option.responseTemplateId,
                now
              ]
              this.db.run(optionSql, optionParams)
            })
          }

          this.db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error in commit:', err)
              reject(err)
              return
            }

            resolve({
              success: true,
              quickReply: {
                ...quickReply,
                id,
                updatedAt: now
              }
            })
          })
        } catch (error) {
          this.db.run('ROLLBACK')
          console.error('Error updating quick reply:', error)
          reject(error)
        }
      })
    })
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM quick_replies WHERE id = ?'
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting quick reply:', err)
          reject(err)
          return
        }
        
        if (this.changes === 0) {
          reject(new Error('Quick reply not found'))
          return
        }
        
        resolve({ success: true })
      })
    })
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          qr.*,
          GROUP_CONCAT(
            json_object(
              'id', qro.id,
              'number', qro.optionNumber,
              'responseTemplateId', qro.responseTemplateId
            )
          ) as options,
          qrs.triggeredCount,
          qrs.lastTriggered
        FROM quick_replies qr
        LEFT JOIN quick_reply_options qro ON qr.id = qro.quickReplyId
        LEFT JOIN quick_reply_stats qrs ON qr.id = qrs.quickReplyId
        GROUP BY qr.id
        ORDER BY qr.createdAt DESC
      `

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching quick replies:', err)
          reject(err)
          return
        }

        try {
          const quickReplies = rows.map(row => ({
            ...row,
            isActive: Boolean(row.isActive),
            daysOfWeek: JSON.parse(row.daysOfWeek || '[]'),
            options: row.options ? JSON.parse(`[${row.options}]`) : [],
            stats: {
              triggeredCount: row.triggeredCount,
              lastTriggered: row.lastTriggered
            }
          }))

          resolve({ success: true, quickReplies })
        } catch (error) {
          console.error('Error parsing quick reply data:', error)
          reject(error)
        }
      })
    })
  }

  async getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          qr.*,
          GROUP_CONCAT(
            json_object(
              'id', qro.id,
              'number', qro.optionNumber,
              'responseTemplateId', qro.responseTemplateId
            )
          ) as options,
          qrs.triggeredCount,
          qrs.lastTriggered
        FROM quick_replies qr
        LEFT JOIN quick_reply_options qro ON qr.id = qro.quickReplyId
        LEFT JOIN quick_reply_stats qrs ON qr.id = qrs.quickReplyId
        WHERE qr.id = ?
        GROUP BY qr.id
      `

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error fetching quick reply:', err)
          reject(err)
          return
        }

        if (!row) {
          resolve({ success: true, quickReply: null })
          return
        }

        try {
          const quickReply = {
            ...row,
            isActive: Boolean(row.isActive),
            daysOfWeek: JSON.parse(row.daysOfWeek || '[]'),
            options: row.options ? JSON.parse(`[${row.options}]`) : [],
            stats: {
              triggeredCount: row.triggeredCount,
              lastTriggered: row.lastTriggered
            }
          }

          resolve({ success: true, quickReply })
        } catch (error) {
          console.error('Error parsing quick reply data:', error)
          reject(error)
        }
      })
    })
  }

  async updateStats(id, triggered = true) {
    const now = new Date().toISOString()

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE quick_reply_stats
        SET triggeredCount = triggeredCount + 1,
            lastTriggered = ?
        WHERE quickReplyId = ?
      `

      this.db.run(sql, [triggered ? now : null, id], (err) => {
        if (err) {
          console.error('Error updating quick reply stats:', err)
          reject(err)
          return
        }

        resolve({ success: true })
      })
    })
  }

  async toggleActive(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE quick_replies
        SET isActive = NOT isActive,
            updatedAt = ?
        WHERE id = ?
      `

      const now = new Date().toISOString()

      this.db.run(sql, [now, id], function(err) {
        if (err) {
          console.error('Error toggling quick reply active state:', err)
          reject(err)
          return
        }

        if (this.changes === 0) {
          reject(new Error('Quick reply not found'))
          return
        }

        resolve({ success: true })
      })
    })
  }

  // Close the database connection when the app is closing
  async closeDatabase() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing quick reply database:', err)
          reject(err)
          return
        }
        console.log('Quick reply database connection closed')
        resolve()
      })
    })
  }
}

module.exports = QuickReplyService 