jQuery(document).ready(function($) {
    'use strict';
    
    let currentPage = 1;
    let itemsPerPage = 25;
    let currentSearch = '';
    let totalItems = 0;
    let totalPages = 1;
    let currentData = [];
    let activeFilters = {
        post_type: '',
        post_status: ''
    };
    let currentColumnPage = 1;
    let columnsPerPage = 8;
    let editingPostId = null;
    
    const allColumns = [
        {field: 'ID', label: 'id', table: 'posts'},
        {field: 'post_status', label: 'post_status', table: 'posts', editable: true},
        {field: 'post_title', label: 'post_title', table: 'posts', editable: true},
        {field: 'post_name', label: 'post_name', table: 'posts', editable: true},
        {field: 'post_content', label: 'post_content', table: 'posts', special: 'content'},
        {field: '_elementor_data', label: '_elementor_data', table: 'postmeta', special: 'elementor'},
        {field: 'post_type', label: 'post_type', table: 'posts', editable: true},
        {field: 'post_date', label: 'post_date', table: 'posts'},
        {field: 'post_modified', label: 'post_modified', table: 'posts'},
        {field: 'post_author', label: 'post_author', table: 'posts', editable: true},
        {field: 'post_parent', label: 'post_parent', table: 'posts', editable: true},
        {field: 'menu_order', label: 'menu_order', table: 'posts', editable: true},
        {field: 'comment_status', label: 'comment_status', table: 'posts', editable: true},
        {field: 'ping_status', label: 'ping_status', table: 'posts', editable: true},
        {field: 'rel_wp_post_id', label: 'rel_wp_post_id', table: 'zen_orbitposts'},
        {field: 'orbitpost_id', label: 'orbitpost_id', table: 'zen_orbitposts'},
        {field: 'redshift_datum', label: 'redshift_datum', table: 'zen_orbitposts'},
        {field: 'rover_datum', label: 'rover_datum', table: 'zen_orbitposts'},
        {field: 'hudson_imgplanbatch_id', label: 'hudson_imgplanbatch_id', table: 'zen_orbitposts'},
        {field: 'is_pinned', label: 'is_pinned', table: 'zen_orbitposts'},
        {field: 'is_flagged', label: 'is_flagged', table: 'zen_orbitposts'},
        {field: 'is_starred', label: 'is_starred', table: 'zen_orbitposts'},
        {field: 'is_squared', label: 'is_squared', table: 'zen_orbitposts'},
        {field: 'created_at', label: 'created_at', table: 'zen_orbitposts'},
        {field: 'updated_at', label: 'updated_at', table: 'zen_orbitposts'}
    ];
    
    init();
    
    function init() {
        bindEventHandlers();
        loadData();
    }
    
    function bindEventHandlers() {
        $('.klyra-rows-per-page-btn').on('click', function() {
            itemsPerPage = $(this).data('rows') === 'all' ? 999999 : parseInt($(this).data('rows'));
            $('.klyra-rows-per-page-btn').removeClass('active').css({
                'background': 'white',
                'color': '#333',
                'border-color': '#D1D5DB'
            });
            $(this).addClass('active').css({
                'background': '#3B82F6',
                'color': 'white',
                'border-color': '#3B82F6'
            });
            currentPage = 1;
            loadData();
        });
        
        $('#klyra-first-row-page').on('click', function() {
            currentPage = 1;
            loadData();
        });
        
        $('#klyra-prev-row-page').on('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadData();
            }
        });
        
        $('#klyra-next-row-page').on('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadData();
            }
        });
        
        $('#klyra-last-row-page').on('click', function() {
            currentPage = totalPages;
            loadData();
        });
        
        $('#klyra-search').on('input', debounce(function() {
            currentSearch = $(this).val();
            currentPage = 1;
            loadData();
        }, 500));
        
        $('.klyra-filter-btn').on('click', function() {
            const filterType = $(this).data('filter');
            const filterValue = $(this).data('value');
            
            if ($(this).hasClass('active')) {
                activeFilters[filterType] = '';
                $(this).removeClass('active').css({
                    'background': 'white',
                    'color': '#333',
                    'border-color': '#D1D5DB'
                });
            } else {
                $('.klyra-filter-btn[data-filter="' + filterType + '"]').removeClass('active').css({
                    'background': 'white',
                    'color': '#333',
                    'border-color': '#D1D5DB'
                });
                activeFilters[filterType] = filterValue;
                $(this).addClass('active').css({
                    'background': '#0073aa',
                    'color': 'white',
                    'border-color': '#0073aa'
                });
            }
            
            currentPage = 1;
            loadData();
        });
        
        $('.klyra-cols-per-page-btn').on('click', function() {
            columnsPerPage = $(this).data('cols') === 'all' ? allColumns.length : parseInt($(this).data('cols'));
            $('.klyra-cols-per-page-btn').removeClass('active').css({
                'background': 'white',
                'color': '#333'
            });
            $(this).addClass('active').css({
                'background': '#f8f782',
                'color': 'black'
            });
            currentColumnPage = 1;
            renderTable();
        });
        
        $('#klyra-first-col-page, #klyra-prev-col-page, #klyra-next-col-page, #klyra-last-col-page').on('click', function() {
            const totalColPages = Math.ceil(allColumns.length / columnsPerPage);
            const btnId = $(this).attr('id');
            
            if (btnId === 'klyra-first-col-page') currentColumnPage = 1;
            else if (btnId === 'klyra-prev-col-page' && currentColumnPage > 1) currentColumnPage--;
            else if (btnId === 'klyra-next-col-page' && currentColumnPage < totalColPages) currentColumnPage++;
            else if (btnId === 'klyra-last-col-page') currentColumnPage = totalColPages;
            
            renderTable();
        });
        
        $('#klyra-create-post-btn').on('click', function() {
            $('#modal-post-type').val('post');
            $('#klyra-modal-title').text('Create New Post');
            $('#klyra-modal-form')[0].reset();
            $('#klyra-create-modal').addClass('active');
        });
        
        $('#klyra-create-page-btn').on('click', function() {
            $('#modal-post-type').val('page');
            $('#klyra-modal-title').text('Create New Page');
            $('#klyra-modal-form')[0].reset();
            $('#klyra-create-modal').addClass('active');
        });
        
        $('#klyra-modal-close, #klyra-modal-cancel').on('click', function() {
            $('#klyra-create-modal').removeClass('active');
        });
        
        $('#klyra-modal-form').on('submit', function(e) {
            e.preventDefault();
            createPost();
        });
        
        $(document).on('click', '.klyra-editable-cell', function() {
            const $cell = $(this);
            const postId = $cell.data('id');
            const field = $cell.data('field');
            const currentValue = $cell.find('.tcell_inner_wrapper_div').text();
            
            const $input = $('<input type="text" class="klyra-editing-input">').val(currentValue);
            $cell.find('.tcell_inner_wrapper_div').html($input);
            $input.focus();
            
            $input.on('blur', function() {
                const newValue = $(this).val();
                if (newValue !== currentValue) {
                    updateField(postId, field, newValue, $cell);
                } else {
                    $cell.find('.tcell_inner_wrapper_div').text(currentValue);
                }
            });
            
            $input.on('keypress', function(e) {
                if (e.which === 13) {
                    $(this).blur();
                }
            });
        });
        
        $(document).on('click', '.klyra-content-edit-btn', function(e) {
            e.stopPropagation();
            const postId = $(this).data('id');
            editingPostId = postId;
            
            const post = currentData.find(p => p.ID == postId);
            if (post) {
                $('#klyra-content-editor-textarea').val(post.post_content || '');
                $('#klyra-content-editor-modal').addClass('active');
            }
        });
        
        $('#klyra-content-editor-cancel').on('click', function() {
            $('#klyra-content-editor-modal').removeClass('active');
            editingPostId = null;
        });
        
        $('#klyra-content-editor-save').on('click', function() {
            if (editingPostId) {
                const content = $('#klyra-content-editor-textarea').val();
                updatePostContent(editingPostId, content);
            }
        });
        
        $('#klyra-select-all').on('change', function() {
            $('.klyra-row-checkbox').prop('checked', $(this).prop('checked'));
        });
    }
    
    function loadData() {
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: {
                action: 'klyra_get_posts_data',
                nonce: klyraBeamray.nonce,
                page: currentPage,
                per_page: itemsPerPage,
                search: currentSearch,
                post_type: activeFilters.post_type,
                post_status: activeFilters.post_status
            },
            success: function(response) {
                if (response.success) {
                    currentData = response.data.data;
                    totalItems = response.data.total;
                    totalPages = response.data.total_pages;
                    renderTable();
                    updatePaginationInfo();
                }
            },
            error: function() {
                alert('Error loading data');
            }
        });
    }
    
    function renderTable() {
        const $tbody = $('#klyra-beamray-tbody');
        const $thead = $('#klyra-beamray-table thead');
        $tbody.empty();
        
        const totalColPages = Math.ceil(allColumns.length / columnsPerPage);
        const startColIdx = (currentColumnPage - 1) * columnsPerPage;
        const endColIdx = columnsPerPage === allColumns.length ? allColumns.length : startColIdx + columnsPerPage;
        const visibleColumns = allColumns.slice(startColIdx, endColIdx);
        
        $thead.find('.klyra-db-table-name-row, .klyra-header-row').each(function() {
            const $row = $(this);
            $row.find('th').not(':first, :nth-child(2)').remove();
            
            visibleColumns.forEach(col => {
                const isDbNameRow = $row.hasClass('klyra-db-table-name-row');
                const thContent = isDbNameRow 
                    ? `<div class="tcell_inner_wrapper_div"><strong>wp_${col.table}</strong></div>`
                    : `<div class="tcell_inner_wrapper_div">${col.label}</div>`;
                $row.append(`<th data-field="${col.field}">${thContent}</th>`);
            });
        });
        
        $('#klyra-current-col-page').text(currentColumnPage);
        $('#klyra-total-col-pages').text(totalColPages);
        $('#klyra-columns-showing').text(visibleColumns.length);
        
        if (currentData.length === 0) {
            $tbody.html('<tr><td colspan="' + (visibleColumns.length + 2) + '" class="klyra-loading">No posts or pages found.</td></tr>');
            return;
        }
        
        currentData.forEach(post => {
            const $tr = $('<tr></tr>').attr('data-post-id', post.ID);
            
            $tr.append(`
                <td class="klyra-checkbox-cell">
                    <div class="tcell_inner_wrapper_div">
                        <input type="checkbox" class="klyra-checkbox klyra-row-checkbox" value="${post.ID}">
                    </div>
                </td>
            `);
            
            $tr.append(`
                <td>
                    <div class="tcell_inner_wrapper_div" style="display: flex; gap: 2px;">
                        <a href="/wp-admin/post.php?post=${post.ID}&action=edit" class="klyra-tool-btn" title="Edit">ED</a>
                        <a href="${getPermalink(post)}" class="klyra-tool-btn" title="View" target="_blank">VW</a>
                    </div>
                </td>
            `);
            
            visibleColumns.forEach(col => {
                let cellValue = post[col.field] || '';
                let cellClass = '';
                let cellAttrs = '';
                
                if (col.field === 'post_status') {
                    cellAttrs = `data-status="${cellValue}"`;
                }
                
                if (col.field === 'post_title') {
                    cellClass = 'post-title-cell';
                }
                
                if (col.editable) {
                    cellClass += ' klyra-editable-cell';
                    cellAttrs += ` data-id="${post.ID}" data-field="${col.field}"`;
                }
                
                if (col.special === 'content') {
                    const preview = stripTags(cellValue).substring(0, 50) + '...';
                    $tr.append(`
                        <td class="${cellClass}" ${cellAttrs}>
                            <div class="tcell_inner_wrapper_div">
                                ${preview}
                                <button class="klyra-content-edit-btn" data-id="${post.ID}" style="width: 20px; height: 20px; background: #0073aa; color: white; border: none; cursor: pointer; font-size: 10px; font-weight: bold; float: right; margin-left: 8px;">ED</button>
                            </div>
                        </td>
                    `);
                } else if (col.special === 'elementor') {
                    const hasElementor = cellValue ? 'Yes' : 'No';
                    $tr.append(`<td class="${cellClass}"><div class="tcell_inner_wrapper_div">${hasElementor}</div></td>`);
                } else {
                    $tr.append(`<td class="${cellClass}" ${cellAttrs}><div class="tcell_inner_wrapper_div">${cellValue}</div></td>`);
                }
            });
            
            $tbody.append($tr);
        });
    }
    
    function updatePaginationInfo() {
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        
        $('#klyra-showing').text(end);
        $('#klyra-total').text(totalItems);
        $('#klyra-current-row-page').text(currentPage);
        $('#klyra-total-row-pages').text(totalPages);
    }
    
    function updateField(postId, field, value, $cell) {
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: {
                action: 'klyra_update_post_field',
                nonce: klyraBeamray.nonce,
                post_id: postId,
                field: field,
                value: value
            },
            success: function(response) {
                if (response.success) {
                    $cell.find('.tcell_inner_wrapper_div').text(value);
                    const post = currentData.find(p => p.ID == postId);
                    if (post) {
                        post[field] = value;
                    }
                } else {
                    alert('Error updating field: ' + response.data);
                    $cell.find('.tcell_inner_wrapper_div').text(value);
                }
            },
            error: function() {
                alert('Error updating field');
            }
        });
    }
    
    function updatePostContent(postId, content) {
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: {
                action: 'klyra_update_post_content',
                nonce: klyraBeamray.nonce,
                post_id: postId,
                content: content
            },
            success: function(response) {
                if (response.success) {
                    $('#klyra-content-editor-modal').removeClass('active');
                    editingPostId = null;
                    loadData();
                } else {
                    alert('Error updating content: ' + response.data);
                }
            },
            error: function() {
                alert('Error updating content');
            }
        });
    }
    
    function createPost() {
        const formData = {
            action: 'klyra_create_post',
            nonce: klyraBeamray.nonce,
            post_title: $('#modal-post-title').val(),
            post_content: $('#modal-post-content').val(),
            post_status: $('#modal-post-status').val(),
            post_type: $('#modal-post-type').val(),
            post_name: $('#modal-post-name').val(),
            post_parent: $('#modal-post-parent').val()
        };
        
        $.ajax({
            url: klyraBeamray.ajaxurl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    $('#klyra-create-modal').removeClass('active');
                    loadData();
                } else {
                    alert('Error creating post: ' + response.data);
                }
            },
            error: function() {
                alert('Error creating post');
            }
        });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function stripTags(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    function getPermalink(post) {
        if (post.post_name) {
            return '/' + post.post_name + '/';
        }
        return '/?p=' + post.ID;
    }
});