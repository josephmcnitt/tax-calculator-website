@echo off
echo ===================================
echo Tax Calculator Server Starter
echo ===================================
echo.

echo Step 1: Killing any existing server processes...
node kill-server.js
echo.

echo Step 2: Starting server with automatic port selection...
node start-server.js
echo.

echo If the server doesn't start, check the console for errors.
echo Press Ctrl+C to stop the server when you're done. 