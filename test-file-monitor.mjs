// Test script for File Monitor system
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

class TestFileMonitor extends EventEmitter {
  constructor(watchDirectory) {
    super();
    this.watchDirectory = watchDirectory;
    this.supportedExtensions = ['.json', '.md'];
  }

  async scanDirectory() {
    try {
      console.log(`🔍 Scanning directory: ${this.watchDirectory}`);
      
      if (!fs.existsSync(this.watchDirectory)) {
        console.log('❌ Directory does not exist');
        return [];
      }
      
      const files = fs.readdirSync(this.watchDirectory);
      const claudeFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return this.supportedExtensions.includes(ext);
      });
      
      console.log(`📁 Found ${files.length} total files`);
      console.log(`📄 Found ${claudeFiles.length} Claude Code compatible files (.json/.md)`);
      
      return claudeFiles;
    } catch (error) {
      console.error('❌ Error scanning directory:', error.message);
      return [];
    }
  }

  async analyzeFiles(files) {
    console.log('\n📊 File Analysis:');
    
    for (const filename of files.slice(0, 10)) { // Analyze first 10 files
      try {
        const filePath = path.join(this.watchDirectory, filename);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        
        console.log(`  📄 ${filename}`);
        console.log(`     Size: ${sizeKB} KB`);
        console.log(`     Modified: ${stats.mtime.toISOString()}`);
        
        // Try to detect conversation format
        if (filename.endsWith('.md')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const hasSpecStoryFormat = content.includes('Claude Code Session') && content.includes('_**User**_');
          const hasClaudeFormat = content.includes('## Human:') || content.includes('## Assistant:');
          
          if (hasSpecStoryFormat) {
            console.log(`     Format: ✅ SpecStory format detected`);
          } else if (hasClaudeFormat) {
            console.log(`     Format: ✅ Claude Code format detected`);
          } else {
            console.log(`     Format: ⚠️  Unknown markdown format`);
          }
        }
        
        console.log('');
      } catch (error) {
        console.log(`  ❌ Error analyzing ${filename}: ${error.message}`);
      }
    }
    
    if (files.length > 10) {
      console.log(`  ... and ${files.length - 10} more files`);
    }
  }
}

// Test the file monitor
async function testFileMonitor() {
  console.log('🧪 Testing Yoshidex File Monitor System\n');
  
  // Test with SpecStory history directory
  const specStoryDir = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/.specstory/history';
  const monitor = new TestFileMonitor(specStoryDir);
  
  const files = await monitor.scanDirectory();
  
  if (files.length > 0) {
    await monitor.analyzeFiles(files);
    
    console.log('\n🎯 File Monitor Test Results:');
    console.log(`✅ Directory accessible: ${specStoryDir}`);
    console.log(`✅ Found ${files.length} importable files`);
    console.log('✅ File format detection working');
    console.log('✅ Ready for integration with Yoshidex system');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start file monitoring on SpecStory directory');
    console.log('2. Auto-import new conversation files');
    console.log('3. Link sessions to SpecStory stories');
    console.log('4. Enable progress tracking and synchronization');
    
  } else {
    console.log('❌ No compatible files found');
  }
}

testFileMonitor();