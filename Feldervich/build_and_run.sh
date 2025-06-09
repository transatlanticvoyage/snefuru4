#!/bin/bash

# Build and Run Feldervich File Manager
# This script builds the Xcode project and launches the app

echo "Building Feldervich..."
xcodebuild -project Feldervich.xcodeproj -scheme Feldervich -configuration Debug build

if [ $? -eq 0 ]; then
    echo "Build successful! Launching Feldervich..."
    open ~/Library/Developer/Xcode/DerivedData/Feldervich-*/Build/Products/Debug/Feldervich.app
else
    echo "Build failed!"
    exit 1
fi 