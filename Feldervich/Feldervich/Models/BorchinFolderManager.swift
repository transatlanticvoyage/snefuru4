import Foundation

class BorchinFolderManager {
    private let borchinFolderKey = "borchinFolder"
    
    var borchinFolder: String? {
        get {
            return UserDefaults.standard.string(forKey: borchinFolderKey)
        }
        set {
            UserDefaults.standard.set(newValue, forKey: borchinFolderKey)
            print("DEBUG: borchinFolder set to: \(newValue ?? "None")")
        }
    }
    
    func loadBorchinFolder() -> String? {
        let folder = UserDefaults.standard.string(forKey: borchinFolderKey)
        print("DEBUG: Loaded borchinFolder from UserDefaults: \(folder ?? "None")")
        return folder
    }
} 