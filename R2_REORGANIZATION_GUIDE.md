# R2 Bucket Reorganization Guide

## Current Setup
- **R2 Bucket URL**: `https://pub-0ddb0004edaa4980a580d6c3f79b3a3f.r2.dev`
- **Total files needed**: 14,233

## Required Folder Structure

Your R2 bucket needs files organized in this structure to match the database:

```
R2 Bucket Root/
├── ART LESSONS/
│   ├── CLASS-1/
│   │   ├── ART BOOK/
│   │   ├── COLORING/
│   │   ├── COVER PAGE/
│   │   ├── GRID ART/
│   │   ├── JOIN THE DOTS/
│   │   ├── LEARN TO DRAW/
│   │   └── TRACE AND COLORING/
│   ├── CLASS-2/
│   │   ├── ART BOOK/
│   │   ├── ART WORK COLORING/
│   │   ├── COLORING/
│   │   └── ... (similar subfolders)
│   └── ... (CLASS-3 through CLASS-10, LKG, NURSERY, UKG)
├── Academic/
│   └── CLASS/
│       ├── CLASS-1/
│       │   ├── ART/
│       │   ├── CHARTS/
│       │   ├── COMPUTER/
│       │   ├── CRAFT/
│       │   ├── ENGLISH/
│       │   ├── EVS/
│       │   ├── GK/
│       │   ├── HINDI/
│       │   ├── LOVABLE STORIES/
│       │   ├── MATHS/
│       │   └── TELUGU/
│       └── ... (other classes)
├── VALUE EDUCATION/
├── VISUAL WORKSHEETS/
└── ... (other top-level folders)
```

## Current R2 Structure vs Required Structure

**Your current R2 path:**
```
ACADEMIC 72DPI 2.0/CLASS/CLASS-1/ART/COLOURING/1.COLOUR THE BEAUTIFUL SUNFLOWER/ATENIC01CR0101JPC.jpg
```

**Required path (matching database):**
```
ART LESSONS/CLASS-1/COLORING/ATENIC01CR0101JPC.jpg
```

## Option 1: Reorganize R2 to Match Database (Recommended)

Move files in R2 to match the simpler database structure:

1. Remove numbered subfolders (like `1.COLOUR THE BEAUTIFUL SUNFLOWER/`)
2. Rename `ACADEMIC 72DPI 2.0/CLASS/CLASS-1/ART/COLOURING/` to `ART LESSONS/CLASS-1/COLORING/`
3. Files go directly in the subject folder

## Option 2: Update Database to Match R2

If reorganizing R2 is too complex, I can update the database paths to match your R2 structure. This requires:
1. A mapping file showing old path → new path for each file
2. Or a consistent pattern I can use to transform paths

## Verification

Once R2 is reorganized, test with:
```bash
curl -I "https://pub-0ddb0004edaa4980a580d6c3f79b3a3f.r2.dev/ART%20LESSONS/CLASS-1/COLORING/ATENIC01CR0101JPC.jpg"
```

Should return `HTTP 200 OK`.

## Files Reference

Full folder structure saved at: `/tmp/r2_folder_structure.txt`
Sample file mapping saved at: `/tmp/r2_file_mapping.json`
