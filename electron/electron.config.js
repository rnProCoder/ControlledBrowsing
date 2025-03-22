/**
 * Electron configuration file
 * 
 * This file configures the Electron build process for the BrowseControl desktop application.
 * 
 * To run the Electron app in development mode:
 * concurrently "npm run dev" "wait-on http://localhost:5000 && electron electron/main.js"
 * 
 * To build the Electron app for distribution:
 * - First build the React app: npm run build
 * - Then build Electron: electron-builder build --mac --win --linux
 */

module.exports = {
  appId: 'com.browsecontrol.app',
  productName: 'BrowseControl',
  copyright: `Copyright © ${new Date().getFullYear()} BrowseControl`,
  directories: {
    output: 'electron-dist'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    '!**/node_modules/**/*'
  ],
  mac: {
    category: 'public.app-category.utilities',
    icon: 'electron/icons/icon.icns'
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      }
    ],
    icon: 'electron/icons/icon.ico'
  },
  linux: {
    target: ['AppImage', 'deb', 'rpm'],
    category: 'Utility',
    icon: 'electron/icons/icon.png'
  },
  publish: {
    provider: 'github',
    releaseType: 'release'
  }
};