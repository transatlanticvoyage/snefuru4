//
//  DatabaseManager.swift
//  Feldervich
//
//  Created by Kyle Campbell on 6/9/25.
//

import SQLite
import Foundation

class DatabaseManager: ObservableObject {
    private var db: Connection?
    private let dbPath: String
    
    // MARK: - Table Definitions
    
    // Files table
    private let files = Table("files")
    private let fileId = Expression<Int64>("id")
    private let filePath = Expression<String>("path")
    private let fileName = Expression<String>("name")
    private let fileSize = Expression<Int64?>("size")
    private let dateCreated = Expression<Date?>("date_created")
    private let dateModified = Expression<Date>("date_modified")
    private let dateAccessed = Expression<Date?>("date_accessed")
    private let fileType = Expression<String?>("file_type")
    private let isDirectory = Expression<Bool>("is_directory")
    private let isHidden = Expression<Bool>("is_hidden")
    private let parentPath = Expression<String?>("parent_path")
    
    // Tags table
    private let tags = Table("tags")
    private let tagId = Expression<Int64>("id")
    private let tagName = Expression<String>("name")
    private let tagColor = Expression<String?>("color")
    private let tagCreated = Expression<Date>("created_at")
    
    // File-Tags relationship table (many-to-many)
    private let fileTags = Table("file_tags")
    private let fileTagId = Expression<Int64>("id")
    private let fileTagFileId = Expression<Int64>("file_id")
    private let fileTagTagId = Expression<Int64>("tag_id")
    private let fileTagCreated = Expression<Date>("created_at")
    
    // Bookmarks table
    private let bookmarks = Table("bookmarks")
    private let bookmarkId = Expression<Int64>("id")
    private let bookmarkPath = Expression<String>("path")
    private let bookmarkName = Expression<String>("name")
    private let bookmarkIcon = Expression<String?>("icon")
    private let bookmarkOrder = Expression<Int>("display_order")
    private let bookmarkCreated = Expression<Date>("created_at")
    
    // File Notes table
    private let fileNotes = Table("file_notes")
    private let noteId = Expression<Int64>("id")
    private let noteFilePath = Expression<String>("file_path")
    private let noteContent = Expression<String>("content")
    private let noteCreated = Expression<Date>("created_at")
    private let noteModified = Expression<Date>("modified_at")
    
    // MARK: - Initialization
    
    init() {
        // Database will be stored in Application Support directory
        let appSupportURL = FileManager.default.urls(for: .applicationSupportDirectory, 
                                                    in: .userDomainMask).first!
        let appDirectory = appSupportURL.appendingPathComponent("com.feldervich.app")
        
        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(at: appDirectory, 
                                               withIntermediateDirectories: true)
        
        dbPath = appDirectory.appendingPathComponent("feldervich.sqlite3").path
        
        print("DEBUG DatabaseManager: Database path: \(dbPath)")
        
        setupDatabase()
    }
    
    // MARK: - Database Setup
    
    private func setupDatabase() {
        do {
            db = try Connection(dbPath)
            createTables()
            print("DEBUG DatabaseManager: Database connected successfully")
        } catch {
            print("ERROR DatabaseManager: Failed to connect to database: \(error)")
        }
    }
    
    private func createTables() {
        guard let db = db else { return }
        
        do {
            // Create Files table
            try db.run(files.create(ifNotExists: true) { t in
                t.column(fileId, primaryKey: .autoincrement)
                t.column(filePath, unique: true)
                t.column(fileName)
                t.column(fileSize)
                t.column(dateCreated)
                t.column(dateModified)
                t.column(dateAccessed)
                t.column(fileType)
                t.column(isDirectory)
                t.column(isHidden)
                t.column(parentPath)
            })
            
            // Create Tags table
            try db.run(tags.create(ifNotExists: true) { t in
                t.column(tagId, primaryKey: .autoincrement)
                t.column(tagName, unique: true)
                t.column(tagColor)
                t.column(tagCreated)
            })
            
            // Create File-Tags relationship table
            try db.run(fileTags.create(ifNotExists: true) { t in
                t.column(fileTagId, primaryKey: .autoincrement)
                t.column(fileTagFileId)
                t.column(fileTagTagId)
                t.column(fileTagCreated)
                t.foreignKey(fileTagFileId, references: files, fileId, delete: .cascade)
                t.foreignKey(fileTagTagId, references: tags, tagId, delete: .cascade)
                t.unique(fileTagFileId, fileTagTagId) // Prevent duplicate relationships
            })
            
            // Create Bookmarks table
            try db.run(bookmarks.create(ifNotExists: true) { t in
                t.column(bookmarkId, primaryKey: .autoincrement)
                t.column(bookmarkPath, unique: true)
                t.column(bookmarkName)
                t.column(bookmarkIcon)
                t.column(bookmarkOrder)
                t.column(bookmarkCreated)
            })
            
            // Create File Notes table
            try db.run(fileNotes.create(ifNotExists: true) { t in
                t.column(noteId, primaryKey: .autoincrement)
                t.column(noteFilePath)
                t.column(noteContent)
                t.column(noteCreated)
                t.column(noteModified)
                t.foreignKey(noteFilePath, references: files, filePath, delete: .cascade)
            })
            
            // Create Tarjnon table
            let tarjnonTable = Table("tarjnon1")
            let folderPath = Expression<String>("folderPath")
            let folderName = Expression<String>("name")
            try db.run(tarjnonTable.create(ifNotExists: true) { t in
                t.column(folderPath, unique: true)
                t.column(folderName)
            })
            
            print("DEBUG DatabaseManager: All tables created successfully")
            
        } catch {
            print("ERROR DatabaseManager: Failed to create tables: \(error)")
        }
    }
    
    // MARK: - File Operations
    
    func addOrUpdateFile(url: URL) {
        guard let db = db else { return }
        
        do {
            let resourceValues = try url.resourceValues(forKeys: [
                .fileSizeKey,
                .creationDateKey,
                .contentModificationDateKey,
                .contentAccessDateKey,
                .typeIdentifierKey,
                .isDirectoryKey,
                .isHiddenKey
            ])
            
            let insert = files.insert(or: .replace,
                filePath <- url.path,
                fileName <- url.lastPathComponent,
                fileSize <- Int64(resourceValues.fileSize ?? 0),
                dateCreated <- resourceValues.creationDate,
                dateModified <- resourceValues.contentModificationDate ?? Date(),
                dateAccessed <- resourceValues.contentAccessDate,
                fileType <- resourceValues.typeIdentifier,
                isDirectory <- resourceValues.isDirectory ?? false,
                isHidden <- resourceValues.isHidden ?? false,
                parentPath <- url.deletingLastPathComponent().path
            )
            
            try db.run(insert)
            
        } catch {
            print("ERROR DatabaseManager: Failed to add/update file \(url.path): \(error)")
        }
    }
    
    func getFile(path: String) -> Row? {
        guard let db = db else { return nil }
        
        do {
            return try db.pluck(files.filter(filePath == path))
        } catch {
            print("ERROR DatabaseManager: Failed to get file \(path): \(error)")
            return nil
        }
    }
    
    func deleteFile(path: String) {
        guard let db = db else { return }
        
        do {
            let fileToDelete = files.filter(filePath == path)
            try db.run(fileToDelete.delete())
        } catch {
            print("ERROR DatabaseManager: Failed to delete file \(path): \(error)")
        }
    }
    
    func getFilesInDirectory(path: String) -> [Row] {
        guard let db = db else { return [] }
        
        do {
            return Array(try db.prepare(files.filter(parentPath == path)))
        } catch {
            print("ERROR DatabaseManager: Failed to get files in directory \(path): \(error)")
            return []
        }
    }
    
    // MARK: - Tag Operations
    
    func createTag(name: String, color: String? = nil) -> Int64? {
        guard let db = db else { return nil }
        
        do {
            let insert = tags.insert(
                tagName <- name,
                tagColor <- color,
                tagCreated <- Date()
            )
            return try db.run(insert)
        } catch {
            print("ERROR DatabaseManager: Failed to create tag \(name): \(error)")
            return nil
        }
    }
    
    func getAllTags() -> [Row] {
        guard let db = db else { return [] }
        
        do {
            return Array(try db.prepare(tags.order(tagName)))
        } catch {
            print("ERROR DatabaseManager: Failed to get all tags: \(error)")
            return []
        }
    }
    
    func deleteTag(id: Int64) {
        guard let db = db else { return }
        
        do {
            let tagToDelete = tags.filter(tagId == id)
            try db.run(tagToDelete.delete())
        } catch {
            print("ERROR DatabaseManager: Failed to delete tag \(id): \(error)")
        }
    }
    
    // MARK: - File-Tag Relationship Operations
    
    func tagFile(filePath: String, tagId: Int64) {
        guard let db = db else { return }
        
        do {
            let insert = fileTags.insert(or: .ignore,
                fileTagFileId <- try db.scalar(files.select(fileId).filter(self.filePath == filePath)),
                fileTagTagId <- tagId,
                fileTagCreated <- Date()
            )
            try db.run(insert)
        } catch {
            print("ERROR DatabaseManager: Failed to tag file \(filePath) with tag \(tagId): \(error)")
        }
    }
    
    func untagFile(filePath: String, tagId: Int64) {
        guard let db = db else { return }
        
        do {
            let fileIdValue = try db.scalar(files.select(fileId).filter(self.filePath == filePath))
            let relationshipToDelete = fileTags.filter(fileTagFileId == fileIdValue && fileTagTagId == tagId)
            try db.run(relationshipToDelete.delete())
        } catch {
            print("ERROR DatabaseManager: Failed to untag file \(filePath) with tag \(tagId): \(error)")
        }
    }
    
    func getTagsForFile(filePath: String) -> [Row] {
        guard let db = db else { return [] }
        
        do {
            let query = tags
                .join(fileTags, on: tagId == fileTagTagId)
                .join(files, on: fileId == fileTagFileId)
                .filter(self.filePath == filePath)
                .select(tags[*])
            
            return Array(try db.prepare(query))
        } catch {
            print("ERROR DatabaseManager: Failed to get tags for file \(filePath): \(error)")
            return []
        }
    }
    
    func getFilesWithTag(tagId: Int64) -> [Row] {
        guard let db = db else { return [] }
        
        do {
            let query = files
                .join(fileTags, on: fileId == fileTagFileId)
                .filter(fileTagTagId == tagId)
                .select(files[*])
            
            return Array(try db.prepare(query))
        } catch {
            print("ERROR DatabaseManager: Failed to get files with tag \(tagId): \(error)")
            return []
        }
    }
    
    // MARK: - Bookmark Operations
    
    func addBookmark(path: String, name: String, icon: String? = nil) -> Int64? {
        guard let db = db else { return nil }
        
        do {
            let maxOrder = try db.scalar(bookmarks.select(bookmarkOrder.max)) ?? 0
            let insert = bookmarks.insert(
                bookmarkPath <- path,
                bookmarkName <- name,
                bookmarkIcon <- icon,
                bookmarkOrder <- maxOrder + 1,
                bookmarkCreated <- Date()
            )
            return try db.run(insert)
        } catch {
            print("ERROR DatabaseManager: Failed to add bookmark \(name): \(error)")
            return nil
        }
    }
    
    func getAllBookmarks() -> [Row] {
        guard let db = db else { return [] }
        
        do {
            return Array(try db.prepare(bookmarks.order(bookmarkOrder)))
        } catch {
            print("ERROR DatabaseManager: Failed to get all bookmarks: \(error)")
            return []
        }
    }
    
    func deleteBookmark(id: Int64) {
        guard let db = db else { return }
        
        do {
            let bookmarkToDelete = bookmarks.filter(bookmarkId == id)
            try db.run(bookmarkToDelete.delete())
        } catch {
            print("ERROR DatabaseManager: Failed to delete bookmark \(id): \(error)")
        }
    }
    
    // MARK: - File Notes Operations
    
    func addOrUpdateNote(filePath: String, content: String) -> Int64? {
        guard let db = db else { return nil }
        
        do {
            let insert = fileNotes.insert(or: .replace,
                noteFilePath <- filePath,
                noteContent <- content,
                noteCreated <- Date(),
                noteModified <- Date()
            )
            return try db.run(insert)
        } catch {
            print("ERROR DatabaseManager: Failed to add/update note for \(filePath): \(error)")
            return nil
        }
    }
    
    func getNote(filePath: String) -> Row? {
        guard let db = db else { return nil }
        
        do {
            return try db.pluck(fileNotes.filter(noteFilePath == filePath))
        } catch {
            print("ERROR DatabaseManager: Failed to get note for \(filePath): \(error)")
            return nil
        }
    }
    
    func deleteNote(filePath: String) {
        guard let db = db else { return }
        
        do {
            let noteToDelete = fileNotes.filter(noteFilePath == filePath)
            try db.run(noteToDelete.delete())
        } catch {
            print("ERROR DatabaseManager: Failed to delete note for \(filePath): \(error)")
        }
    }
    
    // MARK: - Search Operations
    
    func searchFiles(query: String) -> [Row] {
        guard let db = db else { return [] }
        
        do {
            let searchQuery = files.filter(fileName.like("%\(query)%"))
            return Array(try db.prepare(searchQuery))
        } catch {
            print("ERROR DatabaseManager: Failed to search files with query '\(query)': \(error)")
            return []
        }
    }
    
    // MARK: - Utility Methods
    
    func getDatabasePath() -> String {
        return dbPath
    }
    
    func getDatabaseSize() -> Int64 {
        do {
            let attributes = try FileManager.default.attributesOfItem(atPath: dbPath)
            return (attributes[.size] as? NSNumber)?.int64Value ?? 0
        } catch {
            return 0
        }
    }
    
    func vacuum() {
        guard let db = db else { return }
        
        do {
            try db.execute("VACUUM")
            print("DEBUG DatabaseManager: Database vacuumed successfully")
        } catch {
            print("ERROR DatabaseManager: Failed to vacuum database: \(error)")
        }
    }
    
    func addTarjnonFolder(path: String, name: String) {
        guard let db = db else { return }
        let tarjnonTable = Table("tarjnon1")
        let folderPath = Expression<String>("folderPath")
        let folderName = Expression<String>("name")
        do {
            let insert = tarjnonTable.insert(folderPath <- path, folderName <- name)
            try db.run(insert)
            print("Successfully added Tarjnon folder: \(name)")
        } catch {
            print("ERROR: Failed to add Tarjnon folder \(name): \(error)")
        }
    }
    
    func getTarjnonFolders() -> [String] {
        guard let db = db else { return [] }
        let tarjnonTable = Table("tarjnon1")
        let folderPath = Expression<String>("folderPath")
        do {
            return try db.prepare(tarjnonTable.select(folderPath)).map { $0[folderPath] }
        } catch {
            print("ERROR: Failed to retrieve Tarjnon folders: \(error)")
            return []
        }
    }
    
    static let shared = DatabaseManager()
}
