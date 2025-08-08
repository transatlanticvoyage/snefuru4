# WordPress Sites in Snefuru Repo

This directory contains all WordPress sites organized using **Option 1: Simple WordPress Sites Structure**.

## Current Structure

```
wordpress-sites/
├── augusta-mold-removal-pros/     # Augusta Mold Removal Pros site
├── augusta-plumber-co/            # Augusta Plumber Co site  
├── shared-resources/              # Shared plugins, themes, uploads
│   ├── plugins/
│   ├── themes/
│   └── uploads/
└── README.md                      # This file
```

## Flywheel Local Integration

Both sites are now **symlinked** to Flywheel Local:

### Augusta Mold Removal Pros
- **Local Path**: `/Users/kylecampbell/Local Sites/augustamoldremovalproscom/app/public/`
- **Repo Path**: `/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites/augusta-mold-removal-pros/`
- **Status**: ✅ Symlinked and integrated

### Augusta Plumber Co
- **Local Path**: `/Users/kylecampbell/Local Sites/augustaplumbercocom/app/public/`
- **Repo Path**: `/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites/augusta-plumber-co/`
- **Status**: ✅ Symlinked and integrated

## Benefits of This Setup

✅ **Visual Studio Code Integration** - All WordPress files visible in your main editor  
✅ **Git Version Control** - Track all changes to WordPress themes, plugins, content  
✅ **Direct File Access** - Claude Code can make real-time changes you see immediately  
✅ **Flywheel Local Compatible** - Sites still run normally in Local  
✅ **Backup Preserved** - Original files backed up as `public-backup`  

## How It Works

1. **Original Flywheel files** are backed up as `public-backup`
2. **Symlinks** point Flywheel Local to files in your repo
3. **All changes** made in VS Code are immediately reflected in Flywheel Local
4. **Database** remains in Flywheel Local for now (can be moved later if needed)

## Navigation Menu Fix

The Augusta Mold Removal site now includes automatic navigation organization:
- All service pages are automatically organized under the "Services" parent item
- Function runs on theme activation and menu updates
- Located in: `augusta-mold-removal-pros/wp-content/themes/augusta-mold-removal/functions.php`

## Phone Number Update

All instances of the old phone number `(706) 555-MOLD` have been updated to the real number `(762) 224-0533` throughout the Augusta Mold Removal site.

## Next Steps

1. **Test in Flywheel Local** - Start both sites and verify they work
2. **Open in VS Code** - Add `wordpress-sites/` folder to your workspace
3. **Make test changes** - Edit a file in VS Code and see it reflect in Local
4. **Navigation menu** - The service pages should automatically organize under Services dropdown

## Troubleshooting

If sites don't load in Flywheel Local:
1. Check that symlinks are working: `ls -la "/Users/kylecampbell/Local Sites/augustamoldremovalproscom/app/"`
2. Restart Flywheel Local
3. If needed, restore from backup: `mv public-backup public` and remove symlink