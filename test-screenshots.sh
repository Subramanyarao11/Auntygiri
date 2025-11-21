#!/bin/bash

# Test script to verify screenshot capture

SCREENSHOT_DIR="$HOME/.monitoring-screenshots"

echo "🔍 Screenshot Service Test"
echo "================================"
echo ""

if [ -d "$SCREENSHOT_DIR" ]; then
    echo "✅ Screenshots directory exists: $SCREENSHOT_DIR"
    
    # Count screenshots
    COUNT=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
    echo "📸 Total screenshots: $COUNT"
    echo ""
    
    if [ $COUNT -gt 0 ]; then
        echo "📋 Recent screenshots:"
        ls -lht "$SCREENSHOT_DIR"/*.png | head -5
        echo ""
        
        # Show total size
        SIZE=$(du -sh "$SCREENSHOT_DIR" | cut -f1)
        echo "💾 Total size: $SIZE"
        echo ""
        
        echo "🖼️  To view screenshots, run:"
        echo "   open $SCREENSHOT_DIR"
    else
        echo "⚠️  No screenshots found yet"
        echo "   Wait for the first capture or trigger manually from the menu"
    fi
else
    echo "❌ Screenshots directory not found"
    echo "   The app may not be running or hasn't captured yet"
fi

echo ""
echo "📱 Quick Actions:"
echo "   View folder:  open $SCREENSHOT_DIR"
echo "   Clear all:    rm -rf $SCREENSHOT_DIR/*.png"
echo "   Watch live:   watch -n 5 'ls -lht $SCREENSHOT_DIR/*.png | head -5'"


