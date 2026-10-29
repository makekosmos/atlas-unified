Unicode true
!include "MUI2.nsh"

!ifndef OUT
  !error "Pass -DOUT=<Atlas-Setup.exe>"
!endif
!ifndef EXE
  !error "Pass -DEXE=<atlas.exe>"
!endif
!ifndef VERSION
  !error "Pass -DVERSION=<version>"
!endif

Name "Atlas"
OutFile "${OUT}"
InstallDir "$PROGRAMFILES64\Atlas"
InstallDirRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "InstallLocation"
RequestExecutionLevel admin

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Russian"

Section
  SetOutPath $INSTDIR
  File "${EXE}"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$SMPROGRAMS\Atlas.lnk" "$INSTDIR\atlas.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "DisplayName" "Atlas"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "Publisher" "Mundus"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\Atlas.lnk"
  Delete "$INSTDIR\atlas.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas"
SectionEnd
