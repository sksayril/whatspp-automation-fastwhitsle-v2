const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs').promises
const { app } = require('electron')

class TemplateService {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'templates.db')
    this.attachmentsDir = path.join(app.getPath('userData'), 'attachments')
    
    // Ensure attachments directory exists
    fs.mkdir(this.attachmentsDir, { recursive: true })
      .then(() => console.log('Attachments directory ready'))
      .catch(err => console.error('Error creating attachments directory:', err))
    
    console.log('Database path:', dbPath)
    console.log('Attachments directory:', this.attachmentsDir)
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err)
      } else {
        console.log('Database connected successfully')
        this.initializeDatabase()
      }
    })
  }

  initializeDatabase() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        variables TEXT,
        attachmentPath TEXT,
        attachmentType TEXT,
        attachmentName TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `

    return new Promise((resolve, reject) => {
      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating templates table:', err)
          reject(err)
        } else {
          console.log('Templates table created or already exists')
          resolve()
        }
      })
    })
  }

  async saveAttachment(attachment) {
    if (!attachment) return null

    try {
      const fileName = `${Date.now()}-${attachment.name}`
      const filePath = path.join(this.attachmentsDir, fileName)
      
      // Save file to attachments directory
      await fs.writeFile(filePath, attachment.data)
      
      return {
        path: filePath,
        name: attachment.name,
        type: attachment.type
      }
    } catch (error) {
      console.error('Error saving attachment:', error)
      throw error
    }
  }

  async create(template) {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    
    let attachmentInfo = null
    if (template.attachment) {
      attachmentInfo = await this.saveAttachment(template.attachment)
    }

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO templates (
          id, name, content, category, variables, 
          attachmentPath, attachmentType, attachmentName,
          createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        id,
        template.name,
        template.content,
        template.category || 'general',
        JSON.stringify(template.variables || []),
        attachmentInfo?.path || null,
        attachmentInfo?.type || null,
        attachmentInfo?.name || null,
        now,
        now
      ]

      this.db.run(sql, params, (err) => {
        if (err) {
          console.error('Error creating template:', err)
          reject(err)
          return
        }
        
        const newTemplate = {
          ...template,
          id,
          attachmentPath: attachmentInfo?.path,
          attachmentType: attachmentInfo?.type,
          attachmentName: attachmentInfo?.name,
          createdAt: now,
          updatedAt: now
        }
        
        resolve({ success: true, template: newTemplate })
      })
    })
  }

  async update(id, template) {
    const now = new Date().toISOString()
    
    let attachmentInfo = null
    if (template.attachment) {
      // Delete old attachment if exists
      const oldTemplate = await this.getById(id)
      if (oldTemplate.template?.attachmentPath) {
        try {
          await fs.unlink(oldTemplate.template.attachmentPath)
        } catch (error) {
          console.error('Error deleting old attachment:', error)
        }
      }
      
      attachmentInfo = await this.saveAttachment(template.attachment)
    }

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE templates 
        SET name = ?,
            content = ?,
            category = ?,
            variables = ?,
            attachmentPath = COALESCE(?, attachmentPath),
            attachmentType = COALESCE(?, attachmentType),
            attachmentName = COALESCE(?, attachmentName),
            updatedAt = ?
        WHERE id = ?
      `
      
      const params = [
        template.name,
        template.content,
        template.category || 'general',
        JSON.stringify(template.variables || []),
        attachmentInfo?.path,
        attachmentInfo?.type,
        attachmentInfo?.name,
        now,
        id
      ]

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error updating template:', err)
          reject(err)
          return
        }
        
        if (this.changes === 0) {
          reject(new Error('Template not found'))
          return
        }
        
        const updatedTemplate = {
          ...template,
          id,
          attachmentPath: attachmentInfo?.path || template.attachmentPath,
          attachmentType: attachmentInfo?.type || template.attachmentType,
          attachmentName: attachmentInfo?.name || template.attachmentName,
          updatedAt: now
        }
        
        resolve({ success: true, template: updatedTemplate })
      })
    })
  }

  async delete(id) {
    // First get the template to check for attachments
    const template = await this.getById(id)
    
    if (template.template?.attachmentPath) {
      try {
        await fs.unlink(template.template.attachmentPath)
      } catch (error) {
        console.error('Error deleting attachment file:', error)
      }
    }

    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM templates WHERE id = ?'
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting template:', err)
          reject(err)
          return
        }
        
        if (this.changes === 0) {
          reject(new Error('Template not found'))
          return
        }
        
        resolve({ success: true })
      })
    })
  }

  async getById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM templates WHERE id = ?'
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error fetching template:', err)
          reject(err)
          return
        }
        
        if (!row) {
          resolve({ success: true, template: null })
          return
        }
        
        try {
          const template = {
            ...row,
            variables: JSON.parse(row.variables || '[]')
          }
          resolve({ success: true, template })
        } catch (error) {
          console.error('Error parsing template data:', error)
          reject(error)
        }
      })
    })
  }

  async search(query) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM templates 
        WHERE name LIKE ? OR content LIKE ?
        ORDER BY createdAt DESC
      `
      
      const searchPattern = `%${query}%`
      
      this.db.all(sql, [searchPattern, searchPattern], (err, rows) => {
        if (err) {
          console.error('Error searching templates:', err)
          reject(err)
          return
        }
        
        try {
          const templates = rows.map(row => ({
            ...row,
            variables: JSON.parse(row.variables || '[]')
          }))
          resolve({ success: true, templates })
        } catch (error) {
          console.error('Error parsing template data:', error)
          reject(error)
        }
      })
    })
  }

  async getByCategory(category) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM templates WHERE category = ? ORDER BY createdAt DESC'
      
      this.db.all(sql, [category], (err, rows) => {
        if (err) {
          console.error('Error fetching templates by category:', err)
          reject(err)
          return
        }
        
        try {
          const templates = rows.map(row => ({
            ...row,
            variables: JSON.parse(row.variables || '[]')
          }))
          resolve({ success: true, templates })
        } catch (error) {
          console.error('Error parsing template data:', error)
          reject(error)
        }
      })
    })
  }

  async getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM templates 
        ORDER BY createdAt DESC
      `

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching templates:', err)
          reject(err)
          return
        }

        try {
          // Parse variables JSON string for each template
          const templates = rows.map(row => ({
            ...row,
            variables: JSON.parse(row.variables || '[]')
          }))
          resolve({ success: true, templates })
        } catch (error) {
          console.error('Error parsing template data:', error)
          reject(error)
        }
      })
    })
  }

  async getAttachment(templateId) {
    try {
      const template = await this.getById(templateId)
      if (!template.template?.attachmentPath) {
        return { success: false, error: 'No attachment found' }
      }

      const data = await fs.readFile(template.template.attachmentPath)
      return {
        success: true,
        attachment: {
          data,
          name: template.template.attachmentName,
          type: template.template.attachmentType
        }
      }
    } catch (error) {
      console.error('Error reading attachment:', error)
      return { success: false, error: error.message }
    }
  }

  // Close the database connection when the app is closing
  async closeDatabase() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err)
          reject(err)
          return
        }
        console.log('Database connection closed')
        resolve()
      })
    })
  }
}

module.exports = TemplateService