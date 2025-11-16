@echo off
setlocal enabledelayedexpansion

set "output=mainfront_dump.txt"

if exist "%output%" del "%output%"
type nul > "%output%"

echo Scanning files...

for /r %%f in (*.py *.js *.ts *.tsx *.jsx *.json *.txt *.html *.css *.md) do (
    set "filepath=%%f"
    set "filename=%%~nxf"
    
    :: Skip .env files, node_modules, .git, .vscode, etc.
    echo !filepath! | findstr /i "node_modules .git\\ dist\\ build\\ .next\\ venv\\ __pycache__ .vscode .idea" >nul
    
    if errorlevel 1 (
        if /i not "!filename!"==".env" (
            if /i not "!filename!"==".env.local" (
                if /i not "!filename!"==".env.production" (
                    if /i not "!filename!"=="package-lock.json" (
                        if /i not "!filename!"=="yarn.lock" (
                            if /i not "!filename!"=="!output!" (
                                echo. >> "%output%"
                                echo ================================================================================ >> "%output%"
                                echo %%f >> "%output%"
                                echo ================================================================================ >> "%output%"
                                type "%%f" >> "%output%" 2>nul
                            )
                        )
                    )
                )
            )
        )
    )
)

echo ✅ Done! Check %output%
echo Note: .env, lockfiles, and node_modules were excluded
pause