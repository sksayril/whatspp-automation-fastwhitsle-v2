!macro customInstall
  ; Create registry entries for uninstall
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "DisplayName" "WhatsApp Automation"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "DisplayIcon" "$INSTDIR\WhatsApp Automation.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "Publisher" "WhatsApp Automation Team"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "URLInfoAbout" "https://github.com/your-repo/whatsapp-automation"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation" "NoRepair" 1
  
  ; Create application data directory
  CreateDirectory "$LOCALAPPDATA\WhatsApp Automation"
  CreateDirectory "$LOCALAPPDATA\WhatsApp Automation\logs"
  CreateDirectory "$LOCALAPPDATA\WhatsApp Automation\cache"
!macroend

!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\WhatsApp Automation"
  
  ; Remove application data
  RMDir /r "$LOCALAPPDATA\WhatsApp Automation"
  
  ; Remove desktop shortcut
  Delete "$DESKTOP\WhatsApp Automation.lnk"
  
  ; Remove start menu shortcuts
  RMDir /r "$SMPROGRAMS\WhatsApp Automation"
  
  ; Remove installation directory
  RMDir /r "$INSTDIR"
!macroend 