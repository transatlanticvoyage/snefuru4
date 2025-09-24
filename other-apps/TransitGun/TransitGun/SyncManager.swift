import Foundation

struct DirectoryInfo {
    let sourcePath: String
    let targetPath: String
    let sourceExists: Bool
    let targetExists: Bool
}

struct SyncResult {
    let success: Bool
    let message: String
    let details: String
}

class SyncManager {
    private let sourcePath = "/Users/kylecampbell/Documents/repos/localrepo-snefuru4/shenzi-wordpress-plugins/grove"
    private let targetPath = "/Users/kylecampbell/Documents/repos/localrepo-vulcanhatch/wordpress-sites/moldremovalstars.com/app/public/wp-content/plugins/grove"
    private let alpineTargetPath = "/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites/moldremovalstars.com/app/public/wp-content/plugins/grove"
    private let hotspringTargetPath = "/Users/kylecampbell/Local Sites/moldremovalstars/app/public/wp-content/plugins/grove"
    
    func getDirectoryInfo() -> DirectoryInfo {
        let fileManager = FileManager.default
        
        let sourceExists = fileManager.fileExists(atPath: sourcePath)
        let targetExists = fileManager.fileExists(atPath: targetPath)
        
        return DirectoryInfo(
            sourcePath: sourcePath,
            targetPath: targetPath,
            sourceExists: sourceExists,
            targetExists: targetExists
        )
    }
    
    func runSync() -> SyncResult {
        let fileManager = FileManager.default
        
        guard fileManager.fileExists(atPath: sourcePath) else {
            return SyncResult(
                success: false,
                message: "Source directory not found",
                details: "The source directory does not exist:\n\(sourcePath)"
            )
        }
        
        let targetDir = (targetPath as NSString).deletingLastPathComponent
        if !fileManager.fileExists(atPath: targetDir) {
            do {
                try fileManager.createDirectory(atPath: targetDir, withIntermediateDirectories: true)
            } catch {
                return SyncResult(
                    success: false,
                    message: "Failed to create target directory",
                    details: "Error: \(error.localizedDescription)"
                )
            }
        }
        
        let process = Process()
        process.launchPath = "/usr/bin/rsync"
        process.arguments = [
            "-av",
            "--delete",
            "--exclude=.DS_Store",
            "--exclude=node_modules",
            "\(sourcePath)/",
            targetPath
        ]
        
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        
        process.launch()
        process.waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        
        if process.terminationStatus == 0 {
            let lines = output.components(separatedBy: .newlines)
            let summary = lines.filter { !$0.isEmpty && !$0.hasPrefix("building file list") }
            
            return SyncResult(
                success: true,
                message: "Sync completed successfully",
                details: summary.joined(separator: "\n")
            )
        } else {
            return SyncResult(
                success: false,
                message: "rsync failed with exit code \(process.terminationStatus)",
                details: output
            )
        }
    }
    
    func getAlpineDirectoryInfo() -> DirectoryInfo {
        let fileManager = FileManager.default
        
        let sourceExists = fileManager.fileExists(atPath: sourcePath)
        let targetExists = fileManager.fileExists(atPath: alpineTargetPath)
        
        return DirectoryInfo(
            sourcePath: sourcePath,
            targetPath: alpineTargetPath,
            sourceExists: sourceExists,
            targetExists: targetExists
        )
    }
    
    func runAlpineSync() -> SyncResult {
        let fileManager = FileManager.default
        
        guard fileManager.fileExists(atPath: sourcePath) else {
            return SyncResult(
                success: false,
                message: "Source directory not found",
                details: "The source directory does not exist:\n\(sourcePath)"
            )
        }
        
        let targetDir = (alpineTargetPath as NSString).deletingLastPathComponent
        if !fileManager.fileExists(atPath: targetDir) {
            do {
                try fileManager.createDirectory(atPath: targetDir, withIntermediateDirectories: true)
            } catch {
                return SyncResult(
                    success: false,
                    message: "Failed to create target directory",
                    details: "Error: \(error.localizedDescription)"
                )
            }
        }
        
        let process = Process()
        process.launchPath = "/usr/bin/rsync"
        process.arguments = [
            "-av",
            "--delete",
            "--exclude=.DS_Store",
            "--exclude=node_modules",
            "\(sourcePath)/",
            alpineTargetPath
        ]
        
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        
        process.launch()
        process.waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        
        if process.terminationStatus == 0 {
            let lines = output.components(separatedBy: .newlines)
            let summary = lines.filter { !$0.isEmpty && !$0.hasPrefix("building file list") }
            
            return SyncResult(
                success: true,
                message: "Sync completed successfully",
                details: summary.joined(separator: "\n")
            )
        } else {
            return SyncResult(
                success: false,
                message: "rsync failed with exit code \(process.terminationStatus)",
                details: output
            )
        }
    }
    
    func getHotspringDirectoryInfo() -> DirectoryInfo {
        let fileManager = FileManager.default
        
        let sourceExists = fileManager.fileExists(atPath: sourcePath)
        let targetExists = fileManager.fileExists(atPath: hotspringTargetPath)
        
        return DirectoryInfo(
            sourcePath: sourcePath,
            targetPath: hotspringTargetPath,
            sourceExists: sourceExists,
            targetExists: targetExists
        )
    }
    
    func runHotspringSync() -> SyncResult {
        let fileManager = FileManager.default
        
        guard fileManager.fileExists(atPath: sourcePath) else {
            return SyncResult(
                success: false,
                message: "Source directory not found",
                details: "The source directory does not exist:\n\(sourcePath)"
            )
        }
        
        let targetDir = (hotspringTargetPath as NSString).deletingLastPathComponent
        if !fileManager.fileExists(atPath: targetDir) {
            do {
                try fileManager.createDirectory(atPath: targetDir, withIntermediateDirectories: true)
            } catch {
                return SyncResult(
                    success: false,
                    message: "Failed to create target directory",
                    details: "Error: \(error.localizedDescription)"
                )
            }
        }
        
        let process = Process()
        process.launchPath = "/usr/bin/rsync"
        process.arguments = [
            "-av",
            "--delete",
            "--exclude=.DS_Store",
            "--exclude=node_modules",
            "\(sourcePath)/",
            hotspringTargetPath
        ]
        
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        
        process.launch()
        process.waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        
        if process.terminationStatus == 0 {
            let lines = output.components(separatedBy: .newlines)
            let summary = lines.filter { !$0.isEmpty && !$0.hasPrefix("building file list") }
            
            return SyncResult(
                success: true,
                message: "Sync completed successfully",
                details: summary.joined(separator: "\n")
            )
        } else {
            return SyncResult(
                success: false,
                message: "rsync failed with exit code \(process.terminationStatus)",
                details: output
            )
        }
    }
}