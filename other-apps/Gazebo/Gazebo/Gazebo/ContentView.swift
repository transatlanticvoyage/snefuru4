//
//  ContentView.swift
//  Gazebo
//
//  Created by Kyle Campbell on 10/5/25.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "square.grid.3x3.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            
            Text("Gazebo Finder Extension")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("The Finder Extension is now active!")
                .font(.title3)
                .foregroundColor(.secondary)
            
            Divider()
                .padding(.horizontal, 40)
            
            VStack(alignment: .leading, spacing: 10) {
                Text("How to use:")
                    .font(.headline)
                
                Text("1. Right-click any file or folder in Finder")
                Text("2. Look for 'Gazebo Options' in the menu")
                Text("3. Choose an action from the submenu")
            }
            .font(.body)
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8)
            
            Spacer()
            
            Text("Keep this window open for the extension to work")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(width: 400, height: 400)
    }
}

#Preview {
    ContentView()
}
