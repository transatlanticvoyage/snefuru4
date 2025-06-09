import SQLite3

class DatabaseManager {
    static let shared = DatabaseManager()
    private init() {
        // Initialize the database connection here
    }
    // ... existing code ...

    func createTarjnonTable() {
        let createTableString = """
        CREATE TABLE IF NOT EXISTS tarjnon1 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folderPath TEXT NOT NULL,
        name TEXT NOT NULL
        );
        """
        var createTableStatement: OpaquePointer? = nil
        if sqlite3_prepare_v2(db, createTableString, -1, &createTableStatement, nil) == SQLITE_OK {
            if sqlite3_step(createTableStatement) == SQLITE_DONE {
                print("Tarjnon table created.")
            } else {
                print("Tarjnon table could not be created.")
            }
        } else {
            print("CREATE TABLE statement could not be prepared.")
        }
        sqlite3_finalize(createTableStatement)
    }

    func addTarjnonFolder(path: String, name: String) {
        let insertStatementString = "INSERT INTO tarjnon1 (folderPath, name) VALUES (?, ?);"
        var insertStatement: OpaquePointer? = nil

        if sqlite3_prepare_v2(db, insertStatementString, -1, &insertStatement, nil) == SQLITE_OK {
            sqlite3_bind_text(insertStatement, 1, (path as NSString).utf8String, -1, nil)
            sqlite3_bind_text(insertStatement, 2, (name as NSString).utf8String, -1, nil)

            if sqlite3_step(insertStatement) == SQLITE_DONE {
                print("Successfully inserted row.")
            } else {
                print("Could not insert row.")
            }
        } else {
            print("INSERT statement could not be prepared.")
        }
        sqlite3_finalize(insertStatement)
    }

    func removeTarjnonFolder(path: String) {
        let deleteStatementString = "DELETE FROM tarjnon1 WHERE folderPath = ?;"
        var deleteStatement: OpaquePointer? = nil

        if sqlite3_prepare_v2(db, deleteStatementString, -1, &deleteStatement, nil) == SQLITE_OK {
            sqlite3_bind_text(deleteStatement, 1, (path as NSString).utf8String, -1, nil)

            if sqlite3_step(deleteStatement) == SQLITE_DONE {
                print("Successfully deleted row.")
            } else {
                print("Could not delete row.")
            }
        } else {
            print("DELETE statement could not be prepared.")
        }
        sqlite3_finalize(deleteStatement)
    }
} 