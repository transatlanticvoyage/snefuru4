'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
// Note: useDorliBlocks removed for UI-only version

interface EditorBlock {
  id: string;
  type: string;
  content?: JSONContent;
  htmlContent: string;
}

interface MudDepline {
  depline_id: string;
  fk_gcon_piece_id: string;
  depline_jnumber: number;
  depline_knumber: number | null;
  content_raw: string;
  html_tags_detected: string;
  created_at: string;
}

interface MesagenTableEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  gconPieceId?: string; // Re-added for fetching mud_deplines
  initialTitle?: string;
  onTitleChange?: (title: string) => void;
}

// Individual block editor component
function BlockEditor({ 
  block, 
  onUpdate, 
  onEnterPressed, 
  onBackspacePressed,
  onFocus,
  focused,
  onEditorReady,
  isDorliBlock = false,
  focusPosition = null,
  isNewFromEnter = false
}: {
  block: EditorBlock;
  onUpdate: (id: string, content: string) => void;
  onEnterPressed: (id: string, textAfterCursor?: string) => void;
  onBackspacePressed: (id: string, currentText?: string) => void;
  onFocus: (id: string) => void;
  focused: boolean;
  onEditorReady?: (editor: any) => void;
  isDorliBlock?: boolean;
  focusPosition?: number | null;
  isNewFromEnter?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure for block-level editing  
        heading: { levels: [2, 3] },
        paragraph: {
          HTMLAttributes: {
            class: 'block-paragraph',
          },
        },
        // Keep document but disable some document-level features
        hardBreak: false,
        // Disable horizontal rule and code block for simplicity
        horizontalRule: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Underline,
    ],
    content: block.htmlContent ? `<p>${block.htmlContent}</p>` : '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(block.id, html);
    },
    onFocus: () => {
      onFocus(block.id);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-2 min-h-[2rem]',
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key - create new block
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          
          // Get cursor position and text content
          const { from } = view.state.selection;
          const text = view.state.doc.textContent;
          
          // Split text at cursor position
          const beforeCursor = text.slice(0, from);
          const afterCursor = text.slice(from);
          
          // Update current block with text before cursor
          // Wrap in paragraph tags to maintain proper HTML structure
          if (editor) {
            editor.commands.setContent(beforeCursor || '');
          }
          
          // Pass both block ID and the text after cursor
          onEnterPressed(block.id, afterCursor);
          return true;
        }
        
        // Handle Backspace at start of block - merge with previous
        if (event.key === 'Backspace') {
          const { from, to } = view.state.selection;
          
          // Only handle if cursor is at the very start
          if (from === 0 && to === 0) {
            event.preventDefault();
            
            // Get current block's text content
            const currentText = view.state.doc.textContent;
            
            // Pass both block ID and current content to merge handler
            onBackspacePressed(block.id, currentText);
            return true;
          }
        }
        
        return false;
      },
    },
  });

  // Focus this editor when it becomes the focused block
  useEffect(() => {
    if (focused && editor) {
      if (focusPosition !== null && focusPosition >= 0) {
        // Set cursor at specific position after merge
        editor.commands.focus();
        editor.commands.setTextSelection(focusPosition);
      } else if (isNewFromEnter) {
        // For new blocks created from Enter, ensure cursor is at the start
        editor.commands.focus();
        // Force cursor to the beginning of the new block
        setTimeout(() => {
          editor.commands.setTextSelection(0);
        }, 10);
      } else {
        // Focus at the start of the editor to place cursor at beginning
        editor.commands.focus('start');
      }
      onEditorReady?.(editor);
    }
  }, [focused, editor, onEditorReady, focusPosition, isNewFromEnter]);

  if (!editor) {
    return (
      <div className="p-2 text-gray-400 border border-gray-200 rounded min-h-[2rem] flex items-center">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={`border rounded ${focused ? 'ring-2 ring-purple-500 border-purple-300' : ''} ${
      isDorliBlock 
        ? 'border-orange-400 bg-orange-50' 
        : 'border-gray-200'
    }`}>
      {isDorliBlock && (
        <div className="bg-orange-100 border-b border-orange-200 px-2 py-1">
          <span className="text-xs font-semibold text-orange-800">🧩 DORLI BLOCK</span>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

type ViewMode = 'visual' | 'html';

// Helper function to extract HTML tags from content
function extractHtmlTags(html: string): string {
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const tags = new Set<string>();
  let match;
  
  while ((match = tagRegex.exec(html)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  
  return Array.from(tags).join(',');
}

export default function MesagenTableEditor({ initialContent = '<p>Start typing...</p>', onContentChange, gconPieceId, initialTitle = '', onTitleChange }: MesagenTableEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [mudDeplines, setMudDeplines] = useState<MudDepline[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergePosition, setMergePosition] = useState<number | null>(null);
  const [newBlockFromEnter, setNewBlockFromEnter] = useState<string | null>(null);

  // Dummy dorli functions for UI-only version (no backend)
  const getDorliByPlaceholder = (placeholder: string) => null;
  const updateDorliBlock = async (dorliId: string, content: string) => true;

  // Fetch mud_deplines data for this gcon_piece
  useEffect(() => {
    const fetchMudDeplines = async () => {
      if (!gconPieceId) {
        setMudDeplines([]);
        return;
      }

      setLoading(true);
      try {
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from('mud_deplines')
          .select('*')
          .eq('fk_gcon_piece_id', gconPieceId)
          .order('depline_jnumber', { ascending: true });

        if (error) {
          console.error('Error fetching mud_deplines:', error);
          setMudDeplines([]);
        } else {
          setMudDeplines(data || []);
        }
      } catch (error) {
        console.error('Error fetching mud_deplines:', error);
        setMudDeplines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMudDeplines();
  }, [gconPieceId]);

  // Get mud_depline data for a specific block index
  const getMudDeplineForBlock = (blockIndex: number): MudDepline | null => {
    // Find mud_depline that matches this block's line number (blockIndex + 1)
    return mudDeplines.find(depline => depline.depline_jnumber === blockIndex + 1) || null;
  };

  // Handle copying depline_id to clipboard
  const handleCopyDeplineId = async (deplineId: string) => {
    try {
      await navigator.clipboard.writeText(deplineId);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy depline_id:', error);
    }
  };

  // Parse initial content into blocks
  useEffect(() => {
    if (initialContent) {
      parseContentIntoBlocks(initialContent);
    }
  }, [initialContent]);

  const parseContentIntoBlocks = (html: string) => {
    const parsedBlocks: EditorBlock[] = [];
    
    try {
      if (!html || html.trim() === '') {
        parsedBlocks.push({
          id: generateId(),
          type: 'paragraph',
          htmlContent: 'Start typing...'
        });
      } else {
        console.log('Parsing content by linebreaks. Original length:', html.length);
        
        // Split by raw linebreaks (both Unix \n and Windows \r\n)
        const lines = html.split(/\r?\n/);
        
        console.log(`Found ${lines.length} lines in content`);
        
        lines.forEach((line, index) => {
          // Keep the line exactly as is - no automatic paragraph wrapping
          if (line === '') {
            // Empty line - store as empty content
            parsedBlocks.push({
              id: generateId(),
              type: 'paragraph',
              htmlContent: ''
            });
          } else {
            // Store the line exactly as provided without wrapping
            parsedBlocks.push({
              id: generateId(),
              type: 'paragraph',
              htmlContent: line
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing content by linebreaks:', error);
      // Fallback to a single block with the original content
      parsedBlocks.push({
        id: generateId(),
        type: 'paragraph',
        htmlContent: html || 'Error parsing content. Please try again.'
      });
    }
    
    console.log(`Created ${parsedBlocks.length} blocks from ${html.split(/\r?\n/).length} lines`);
    setBlocks(parsedBlocks);
    
    // Focus the first block
    if (parsedBlocks.length > 0) {
      setTimeout(() => {
        setFocusedBlock(parsedBlocks[0].id);
      }, 100);
    }
  };

  const generateId = () => {
    return 'block-' + Math.random().toString(36).substr(2, 9);
  };

  // Check if a block content is a dorli placeholder
  const isDorliPlaceholder = (content: string): boolean => {
    return /^{{DORLI:[A-Z]+:\d+}}$/.test(content.trim());
  };

  // Extract placeholder from block content
  const extractDorliPlaceholder = (content: string): string | null => {
    const match = content.match(/^{{DORLI:[A-Z]+:\d+}}$/);
    return match ? match[0] : null;
  };

  // Replace Dorli placeholders with raw HTML content (UI-only version)
  const resolveDorliContent = (content: string): string => {
    // For UI-only version, just return the content as-is
    // (In real version, this would resolve dorli placeholders)
    return content;
  };

  const handleBlockUpdate = useCallback(async (blockId: string, content: string) => {
    setBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block => {
        if (block.id === blockId) {
          // Extract plain text content (strip HTML tags) for storage
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const plainText = tempDiv.textContent || tempDiv.innerText || '';
          
          // Store the plain text without HTML wrapping
          return { ...block, htmlContent: plainText };
        }
        return block;
      });
      
      // Combine all blocks into final content with linebreaks preserved
      const combinedContent = updatedBlocks
        .map(block => block.htmlContent)
        .join('\n'); // Join with linebreaks
      
      onContentChange?.(combinedContent);
      
      return updatedBlocks;
    });
  }, [blocks, onContentChange]);

  const handleAddRowBelow = useCallback((rowIndex: number) => {
    // Create new blank block
    const newBlock: EditorBlock = {
      id: generateId(),
      type: 'paragraph',
      htmlContent: ''
    };
    
    // Insert the new block at the specified position
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(rowIndex + 1, 0, newBlock);
      
      // Update aval_content to maintain line-by-line sync
      const combinedHtml = newBlocks
        .map(block => block.htmlContent)
        .join('\n'); // Join with linebreaks
      
      onContentChange?.(combinedHtml);
      
      return newBlocks;
    });
    
    // Focus the new block after a short delay
    setTimeout(() => {
      setFocusedBlock(newBlock.id);
    }, 50);
  }, [blocks, onContentChange]);

  const handleEnterPressed = useCallback(async (blockId: string, textAfterCursor?: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    // Create new block after current one with the text after cursor
    // Escape HTML characters to prevent XSS
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const newBlock: EditorBlock = {
      id: generateId(),
      type: 'paragraph',
      htmlContent: textAfterCursor ? `<p>${escapeHtml(textAfterCursor)}</p>` : '<p></p>'
    };
    
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      return newBlocks;
    });
    
    // If we have gconPieceId, update mud_deplines in the database
    if (gconPieceId) {
      try {
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        
        // Get current block's content for updating current depline
        const currentBlock = blocks[blockIndex];
        const currentDepline = mudDeplines.find(d => d.depline_jnumber === blockIndex + 1);
        
        if (currentDepline) {
          // Update current depline with text before cursor
          const { error: updateError } = await supabase
            .from('mud_deplines')
            .update({ 
              content_raw: currentBlock.htmlContent || '', 
              html_tags_detected: '' // No HTML tags since we store plain text 
            })
            .eq('depline_id', currentDepline.depline_id);
            
          if (updateError) {
            console.error('Error updating current depline:', updateError);
          }
        }
        
        // Increment jnumber for all deplines after the current position
        // Supabase doesn't support SQL expressions in update, so we need to do it manually
        const deplinesAfter = mudDeplines.filter(d => d.depline_jnumber > blockIndex + 1);
        for (const depline of deplinesAfter) {
          const { error: updateError } = await supabase
            .from('mud_deplines')
            .update({ depline_jnumber: depline.depline_jnumber + 1 })
            .eq('depline_id', depline.depline_id);
            
          if (updateError) {
            console.error('Error incrementing depline jnumber:', updateError);
          }
        }
        
        // Insert new depline for the new block
        const { error: insertError } = await supabase
          .from('mud_deplines')
          .insert({
            depline_id: crypto.randomUUID(),
            fk_gcon_piece_id: gconPieceId,
            depline_jnumber: blockIndex + 2,
            depline_knumber: null,
            content_raw: textAfterCursor || '',
            html_tags_detected: '', // No HTML tags since we store plain text
            created_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Error inserting new depline:', insertError);
        }
        
        // Refresh mud_deplines data
        const { data: newDeplines, error: fetchError } = await supabase
          .from('mud_deplines')
          .select('*')
          .eq('fk_gcon_piece_id', gconPieceId)
          .order('depline_jnumber', { ascending: true });
          
        if (!fetchError && newDeplines) {
          setMudDeplines(newDeplines);
        }
      } catch (error) {
        console.error('Error handling Enter press with mud_deplines:', error);
      }
    }
    
    // Focus the new block and mark it as created from Enter
    setTimeout(() => {
      setNewBlockFromEnter(newBlock.id);
      setFocusedBlock(newBlock.id);
    }, 50);
  }, [blocks, gconPieceId, mudDeplines, activeEditor]);

  const handleBackspacePressed = useCallback(async (blockId: string, currentText?: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    
    // Don't delete if it's the only block
    if (blocks.length <= 1) return;
    
    // Don't delete if it's the first block
    if (blockIndex <= 0) return;
    
    const currentBlock = blocks[blockIndex];
    const previousBlock = blocks[blockIndex - 1];
    
    if (!previousBlock) return;
    
    // Get the previous block's text content (strip HTML tags)
    const previousText = previousBlock.htmlContent.replace(/<[^>]*>/g, '');
    const mergedText = previousText + (currentText || '');
    
    // Escape HTML for the merged content
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    // Update the previous block with merged content
    const updatedPreviousBlock = {
      ...previousBlock,
      htmlContent: `<p>${escapeHtml(mergedText)}</p>`
    };
    
    // Update blocks state
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      // Update previous block
      newBlocks[blockIndex - 1] = updatedPreviousBlock;
      // Remove current block
      newBlocks.splice(blockIndex, 1);
      return newBlocks;
    });
    
    // If we have gconPieceId, update mud_deplines in the database
    if (gconPieceId) {
      try {
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        
        // Get deplines for current and previous blocks
        const currentDepline = mudDeplines.find(d => d.depline_jnumber === blockIndex + 1);
        const previousDepline = mudDeplines.find(d => d.depline_jnumber === blockIndex);
        
        if (previousDepline) {
          // Update previous depline with merged content
          const { error: updateError } = await supabase
            .from('mud_deplines')
            .update({ 
              content_raw: mergedText,
              html_tags_detected: '' // No HTML tags since we store plain text
            })
            .eq('depline_id', previousDepline.depline_id);
            
          if (updateError) {
            console.error('Error updating previous depline:', updateError);
          }
        }
        
        if (currentDepline) {
          // Delete current depline
          const { error: deleteError } = await supabase
            .from('mud_deplines')
            .delete()
            .eq('depline_id', currentDepline.depline_id);
            
          if (deleteError) {
            console.error('Error deleting current depline:', deleteError);
          }
        }
        
        // Decrement jnumber for all deplines after the deleted one
        const deplinesAfter = mudDeplines.filter(d => d.depline_jnumber > blockIndex + 1);
        for (const depline of deplinesAfter) {
          const { error: updateError } = await supabase
            .from('mud_deplines')
            .update({ depline_jnumber: depline.depline_jnumber - 1 })
            .eq('depline_id', depline.depline_id);
            
          if (updateError) {
            console.error('Error decrementing depline jnumber:', updateError);
          }
        }
        
        // Refresh mud_deplines data
        const { data: newDeplines, error: fetchError } = await supabase
          .from('mud_deplines')
          .select('*')
          .eq('fk_gcon_piece_id', gconPieceId)
          .order('depline_jnumber', { ascending: true });
          
        if (!fetchError && newDeplines) {
          setMudDeplines(newDeplines);
        }
      } catch (error) {
        console.error('Error handling Backspace with mud_deplines:', error);
      }
    }
    
    // Focus the previous block and set cursor at the merge point
    setTimeout(() => {
      setFocusedBlock(previousBlock.id);
      // The cursor position will be set in the BlockEditor's useEffect
      // We need to store where the merge happened
      setMergePosition(previousText.length);
    }, 50);
  }, [blocks, gconPieceId, mudDeplines]);

  const handleBlockFocus = useCallback((blockId: string) => {
    setFocusedBlock(blockId);
    // Clear merge position after it's been used
    if (mergePosition !== null) {
      setTimeout(() => setMergePosition(null), 100);
    }
    // Clear newBlockFromEnter flag after it's been used
    if (newBlockFromEnter !== null) {
      setTimeout(() => setNewBlockFromEnter(null), 100);
    }
    // Keep view mode consistent across blocks - don't reset it
  }, [mergePosition, newBlockFromEnter]);

  const handleEditorReady = useCallback((editor: any) => {
    setActiveEditor(editor);
  }, []);

  // Selection handlers
  const handleBlockSelection = useCallback((blockId: string) => {
    setSelectedBlocks(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(blockId)) {
        newSelection.delete(blockId);
      } else {
        newSelection.add(blockId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedBlocks.size === blocks.length) {
      // Deselect all
      setSelectedBlocks(new Set());
    } else {
      // Select all
      setSelectedBlocks(new Set(blocks.map(block => block.id)));
    }
  }, [blocks, selectedBlocks.size]);

  // Toolbar action handlers
  const insertLink = () => {
    if (!activeEditor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      activeEditor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertImage = () => {
    if (!activeEditor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      activeEditor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setVisualMode = () => {
    setViewMode('visual');
  };

  const setHtmlMode = () => {
    setViewMode('html');
  };

  // Get block's HTML content for HTML view
  const getBlockHtml = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    return block?.htmlContent || '';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-purple-100 border-b border-purple-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-purple-800">Mesagen - 11-Column Table Editor</h3>
          <div className="text-sm text-purple-600">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} × 11 columns | 
            <span className={`ml-2 font-medium ${viewMode === 'visual' ? 'text-green-600' : 'text-orange-600'}`}>
              {viewMode === 'visual' ? '📝 Visual Mode' : '💻 HTML Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* 11-Column Table Structure with 6-Row Header (including prisomi, select, html_tags_detected, depline_id) */}
      <div className="overflow-x-auto overflow-y-visible relative">
        <table className="w-full border-collapse table-fixed">
          {/* Table Header - 6 Rows */}
          <thead>
            {/* Header Row 1 - Horizomi numbering system */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 bg-purple-50 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">1</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-3 px-4 whitespace-pre-line">
                      <div className="mb-2">
                        <div>upper-left-most cell in the ui table grid</div>
                        <div>prisomi column</div>
                        <div>horizomi row</div>
                        <div>intersection point</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const textToCopy = `upper-left-most cell in the ui table grid\nprisomi column\nhorizomi row\nintersection point`;
                          navigator.clipboard.writeText(textToCopy);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50" style={{ padding: '6px 10px', width: '46px', maxWidth: '46px', minWidth: '46px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">2</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 w-20">
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">3</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 w-20">
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">4</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2" style={{ width: '120px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">5</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2" style={{ width: '100px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">6</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 w-20">
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">7</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2" style={{ width: '600px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">8</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 w-20">
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">9</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 w-20">
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">10</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 w-20">
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">11</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div className="mb-2">
                        <span className="font-bold">horizomi row</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText('horizomi row');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
            </tr>
            
            {/* Header Row 2 - Blank placeholders */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 bg-purple-50 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">2</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
            </tr>
            
            {/* Header Row 3 - Content label */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 bg-purple-50 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">3</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2 text-center text-sm font-bold text-purple-700">
                Content
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
            </tr>
            
            {/* Header Row 4 - Toolbar row */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 bg-purple-50 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">4</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2">
                {/* TipTap Toolbar in Header */}
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {/* Tools box label */}
                    <div className="mr-2 flex items-center">
                      <span className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>tools_box1</span>
                    </div>
                    
                    {/* Text formatting */}
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleBold().run()}
                      className={`px-2 py-1 rounded text-sm font-bold border ${
                        activeEditor?.isActive('bold') 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      B
                    </button>
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleItalic().run()}
                      className={`px-2 py-1 rounded text-sm italic border ${
                        activeEditor?.isActive('italic') 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      I
                    </button>
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleUnderline().run()}
                      className={`px-2 py-1 rounded text-sm underline border ${
                        activeEditor?.isActive('underline') 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      U
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Headings */}
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`px-2 py-1 rounded text-sm font-medium border ${
                        activeEditor?.isActive('heading', { level: 2 }) 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      H2
                    </button>
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`px-2 py-1 rounded text-sm font-medium border ${
                        activeEditor?.isActive('heading', { level: 3 }) 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      H3
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Links and Images */}
                    <button
                      onClick={insertLink}
                      className="px-2 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      🔗 Link
                    </button>
                    <button
                      onClick={insertImage}
                      className="px-2 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      🖼️ Image
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Lists */}
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleBulletList().run()}
                      className={`px-2 py-1 rounded text-sm border ${
                        activeEditor?.isActive('bulletList') 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      • List
                    </button>
                    <button
                      onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()}
                      className={`px-2 py-1 rounded text-sm border ${
                        activeEditor?.isActive('orderedList') 
                          ? 'bg-purple-700 text-white border-purple-700' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={!activeEditor || viewMode === 'html'}
                    >
                      1. List
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Visual/HTML Toggle Bar */}
                    <div className="flex border border-gray-300 rounded overflow-hidden">
                      <button
                        onClick={setVisualMode}
                        className={`px-3 py-1 text-xs font-medium ${
                          viewMode === 'visual'
                            ? 'bg-purple-700 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Visual
                      </button>
                      <button
                        onClick={setHtmlMode}
                        className={`px-3 py-1 text-xs font-medium ${
                          viewMode === 'html'
                            ? 'bg-purple-700 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        HTML
                      </button>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
            </tr>
            
            {/* Header Row 5 - aval_title row */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 bg-purple-50 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">5</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2">
                <div className="space-y-2">
                  <div className="text-sm text-purple-700">
                    <span>gcon_pieces.</span>
                    <span className="font-bold">mud_title</span>
                  </div>
                  <input
                    type="text"
                    value={initialTitle}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    className="w-full px-3 py-2 text-lg font-bold bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter title..."
                  />
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
            </tr>
            
            {/* Header Row 6 - aval_content label row */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 bg-purple-50 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">6</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50" style={{ padding: '6px 10px' }}>
                <input
                  type="checkbox"
                  checked={selectedBlocks.size === blocks.length && blocks.length > 0}
                  onChange={handleSelectAll}
                  className="w-[26px] h-[26px] cursor-pointer"
                />
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2"></th>
              <th className="border border-gray-300 bg-purple-50 p-2 text-center text-sm font-bold text-purple-700" style={{ width: '120px' }}>
                html_tags_detected
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 text-center text-sm font-bold text-purple-700" style={{ width: '100px' }}>
                depline_id
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 text-center text-sm font-bold text-purple-700">
                lineyoshi
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2">
                <div className="flex items-center gap-2">
                  {/* Tooltip */}
                  <div className="relative group">
                    <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-help">
                      ?
                    </div>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                      {/* Invisible bridge area to keep tooltip open when moving mouse */}
                      <div className="absolute inset-0 -m-2"></div>
                      <div className="bg-gray-800 text-white text-xs rounded py-3 px-4 whitespace-pre-line min-w-max relative">
                        <div className="mb-2">
                          <div>trace depline relationships to mud_content</div>
                          <div></div>
                          <div>gcon_pieces.mud_content</div>
                          <div>gcon_pieces.id</div>
                          <div>mud_deplines.fk_gcon_piece_id</div>
                          <div>mud_deplines.content_raw</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const textToCopy = `trace depline relationships to mud_content

gcon_pieces.mud_content
gcon_pieces.id
mud_deplines.fk_gcon_piece_id
mud_deplines.content_raw`;
                            navigator.clipboard.writeText(textToCopy);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="absolute top-full left-4 transform -translate-x-1/2 -mt-1">
                        <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm text-purple-700">
                    <span>mud_deplines.</span>
                    <span className="font-bold">content_raw</span>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 text-center text-sm text-purple-700">
                buttons5
              </th>
              <th className="border border-gray-300 bg-purple-50 p-2 text-center text-sm font-bold text-purple-700">
                is_inline_dorli
              </th>
            </tr>
          </thead>
          
          {/* Table Body - Each block is a row */}
          <tbody>
            {blocks.map((block, index) => {
              const rowNumber = index + 7; // Start at 7 since we have 6 header rows
              const showTooltip = rowNumber <= 5; // Only show tooltip for rows 1-5
              
              return (
                <tr key={block.id} className="hover:bg-purple-25">
                  {/* Prisomi Column */}
                  <td className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                    <div className={`relative ${showTooltip ? 'group' : ''}`}>
                      <div className="text-center text-xs font-normal text-gray-600">{rowNumber}</div>
                      {showTooltip && (
                        <>
                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-[100]">
                            <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                              <span className="font-bold">prisomi column</span>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  {/* Select Column */}
                  <td 
                    className="border border-gray-300 cursor-pointer" 
                    style={{ padding: '6px 10px', width: '46px', maxWidth: '46px', minWidth: '46px' }}
                    onClick={() => handleBlockSelection(block.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBlocks.has(block.id)}
                      onChange={() => handleBlockSelection(block.id)}
                      className="w-[26px] h-[26px] cursor-pointer pointer-events-none"
                    />
                  </td>
                  
                  {/* Column 3 - Thing1 */}
                  <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                    -
                  </td>
                
                {/* Column 4 - Thing2 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 5 - html_tags_detected */}
                <td className="border border-gray-300 p-2 text-left" style={{ width: '120px', maxWidth: '120px' }}>
                  {(() => {
                    const mudDepline = getMudDeplineForBlock(index);
                    const htmlTags = mudDepline?.html_tags_detected || '';
                    return htmlTags ? (
                      <div className="text-xs text-gray-700 break-words" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.3' }}>
                        {htmlTags.split(',').map((tag, i) => (
                          <span key={i}>
                            {tag.trim()}
                            {i < htmlTags.split(',').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    );
                  })()}
                </td>
                
                {/* Column 6 - depline_id */}
                <td className="border border-gray-300 p-2 text-center" style={{ width: '100px', maxWidth: '100px' }}>
                  {(() => {
                    const mudDepline = getMudDeplineForBlock(index);
                    const deplineId = mudDepline?.depline_id;
                    return deplineId ? (
                      <button
                        onClick={() => handleCopyDeplineId(deplineId)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-mono"
                        title={`Click to copy full UUID: ${deplineId}`}
                      >
                        {deplineId.substring(0, 3)}..
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    );
                  })()}
                </td>
                
                {/* Column 7 - lineyoshi */}
                <td className="border border-gray-300 p-2 text-center text-gray-700 text-sm font-medium">
                  {index + 1}
                </td>
                
                {/* Column 8 - Content (TipTap Editor or HTML View) */}
                <td className="border border-gray-300 p-1" style={{ width: '600px' }}>
                  {(() => {
                    const blockContent = getBlockHtml(block.id);
                    
                    // Check if this is a Dorli placeholder
                    const placeholder = extractDorliPlaceholder(blockContent);
                    const isDorli = !!placeholder;
                    
                    // Resolve Dorli placeholders to their raw HTML content for editing
                    const resolvedContent = resolveDorliContent(blockContent);
                    
                    // Create a resolved block for the editor
                    const resolvedBlock = {
                      ...block,
                      htmlContent: resolvedContent
                    };

                    // Render editor or HTML view based on mode
                    return viewMode === 'html' ? (
                      <div className={`p-2 rounded border min-h-[2rem] font-mono text-xs ${
                        isDorli ? 'bg-orange-100 border-orange-200' : 'bg-gray-100'
                      }`}>
                        {isDorli && (
                          <div className="mb-2 text-xs font-semibold text-orange-800">
                            🧩 DORLI: {placeholder}
                          </div>
                        )}
                        <pre className="whitespace-pre-wrap">{resolvedContent}</pre>
                      </div>
                    ) : (
                      <BlockEditor
                        block={resolvedBlock}
                        onUpdate={handleBlockUpdate}
                        onEnterPressed={handleEnterPressed}
                        onBackspacePressed={handleBackspacePressed}
                        onFocus={handleBlockFocus}
                        focused={focusedBlock === block.id}
                        onEditorReady={handleEditorReady}
                        isDorliBlock={isDorli}
                        focusPosition={focusedBlock === block.id ? mergePosition : null}
                        isNewFromEnter={focusedBlock === block.id && newBlockFromEnter === block.id}
                      />
                    );
                  })()}
                </td>
                
                {/* Column 9 - Add Row Button */}
                <td className="border border-gray-300 p-2 text-center">
                  <button
                    onClick={() => handleAddRowBelow(index)}
                    className="w-4 h-4 bg-purple-700 hover:bg-purple-800 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                    title="Add new row below"
                  >
                    +
                  </button>
                </td>
                
                {/* Column 10 - Thing9 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 11 - Thing10 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with actions */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {viewMode === 'visual' ? (
              <>
                Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> to create new block, 
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-2">Backspace</kbd> at start to merge
              </>
            ) : (
              <>
                <span className="text-orange-600 font-medium">HTML View Mode:</span> Viewing raw HTML content - 
                switch to Visual mode to edit
              </>
            )}
          </div>
          <button
            onClick={() => {
              const newBlock: EditorBlock = {
                id: generateId(),
                type: 'paragraph',
                htmlContent: ''
              };
              setBlocks(prev => [...prev, newBlock]);
              setFocusedBlock(newBlock.id);
            }}
            disabled={viewMode === 'html'}
            className={`px-3 py-1 rounded text-xs ${
              viewMode === 'html'
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            + Add Block
          </button>
        </div>
      </div>

      {/* Custom CSS for block styling and table layout */}
      <style jsx>{`
        .block-paragraph {
          margin: 0;
          padding: 0;
        }
        
        .ProseMirror {
          outline: none;
          min-width: 580px; /* Ensure minimum width for content area */
        }
        
        .ProseMirror p {
          margin: 0;
        }
        
        kbd {
          font-family: monospace;
        }
        
        /* Ensure table layout stability */
        table {
          table-layout: fixed;
          min-width: 1000px; /* Minimum table width to accommodate all columns */
        }
        
        /* Prisomi column specific styling */
        td:nth-child(1), th:nth-child(1) {
          width: 20px !important;
          max-width: 20px;
          min-width: 20px;
          padding: 0 !important;
        }
        
        /* Select column specific styling */
        td:nth-child(2), th:nth-child(2) {
          width: 46px !important;
          max-width: 46px;
          min-width: 46px;
          padding: 6px 10px !important;
        }
        
        /* Content column specific styling (now column 8 with prisomi, select, html_tags, depline_id) */
        td:nth-child(8) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        /* html_tags_detected column styling */
        td:nth-child(5) {
          width: 120px !important;
          max-width: 120px;
          min-width: 120px;
          vertical-align: top;
        }
        
        /* depline_id column styling */
        td:nth-child(6) {
          width: 100px !important;
          max-width: 100px;
          min-width: 100px;
        }
        
        /* Other columns styling */
        td:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(7)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
        
        /* Header column styling (Content column is now 8 with prisomi, select, html_tags, depline_id) */
        th:nth-child(8) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        /* html_tags_detected header styling */
        th:nth-child(5) {
          width: 120px !important;
          max-width: 120px;
          min-width: 120px;
          vertical-align: top;
        }
        
        /* depline_id header styling */
        th:nth-child(6) {
          width: 100px !important;
          max-width: 100px;
          min-width: 100px;
        }
        
        th:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(5)):not(:nth-child(6)):not(:nth-child(8)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
        
        /* Other data columns styling */
        td:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(5)):not(:nth-child(6)):not(:nth-child(8)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
        
        /* Background color for all td cells except content column (horizomi #8) */
        td:not(:nth-child(8)) {
          background-color: #e7e7e7;
        }
      `}</style>
    </div>
  );
}