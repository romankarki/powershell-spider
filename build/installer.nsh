; Runs at the start of the installer. Removes a copy installed by the old
; Squirrel-based setup (1.0.0 builds) so the two don't coexist.
!macro customInit
  IfFileExists "$LOCALAPPDATA\powershell-spider\Update.exe" 0 +3
    ExecWait '"$LOCALAPPDATA\powershell-spider\Update.exe" --uninstall -s'
    RMDir /r "$LOCALAPPDATA\powershell-spider"
!macroend
