#!/bin/bash

# Script to add CMS imports and hooks to template HomePage/Home files

TEMPLATES=(
  "tsuru-demo:Home.tsx"
  "tech-gadgets:HomePage.tsx"
  "vintage-fashion:HomePage.tsx"
  "artisan-crafts:HomePage.tsx"
  "gourmet-foods:HomePage.tsx"
  "fitness-hub:Home.tsx"
  "pet-care:HomePage.tsx"
)

for entry in "${TEMPLATES[@]}"; do
  IFS=':' read -r template file <<< "$entry"
  filepath="templates/$template/src/pages/$file"
  
  if [ -f "$filepath" ]; then
    echo "Processing $template/$file..."
    
    # Check if already has useHomePage
    if grep -q "useHomePage" "$filepath"; then
      echo "  ✓ Already has useHomePage"
    else
      echo "  → Adding useHomePage import"
      # Add to imports (after useProducts line)
      sed -i.bak "s/import { useProducts }/import { useProducts, useHomePage }/" "$filepath"
    fi
    
    # Check if has parsePageSections
    if grep -q "parsePageSections" "$filepath"; then
      echo "  ✓ Already has parsePageSections"
    else
      echo "  → Adding pageUtils import"
      # Add pageUtils import after hooks import
      sed -i.bak "/useProducts/a\\
import { parsePageSections, getSectionByType } from '@/lib/pageUtils';" "$filepath"
    fi
    
    echo "  ✓ Done"
  else
    echo "✗ File not found: $filepath"
  fi
  echo ""
done

echo "✅ All templates processed"
echo "Note: Manual updates still needed for:"
echo "  - Add useHomePage() hook call"
echo "  - Parse sections with parsePageSections()"
echo "  - Replace hardcoded content with dynamic data"
