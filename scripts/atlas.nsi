; Atlas for Windows: one file to download and run, as v0.0.1 shipped.
;
;   makensis /DVERSION=0.0.2 /DEXE=target\release\atlas.exe /DOUT=dist\Atlas-Setup.exe atlas.nsi
;
; It installs into Program Files, puts Atlas in the Start menu and on the
; desktop, and leaves an uninstaller behind. The app reads Engine from the
; per-user data folder, so nothing here needs to be per machine beyond the
; binary itself.

Unicode true

!ifndef VERSION
  !define VERSION "0.0.0"
!endif
!ifndef EXE
  !define EXE "atlas.exe"
!endif
!ifndef OUT
  !define OUT "Atlas-Setup.exe"
!endif

Name "Atlas"
OutFile "${OUT}"
InstallDir "$PROGRAMFILES64\Atlas"
InstallDirRegKey HKLM "Software\Atlas" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Atlas"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "FileDescription" "Atlas installer"
VIAddVersionKey "FileVersion" "${VERSION}.0"

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Atlas" SecMain
  SetOutPath "$INSTDIR"
  File "${EXE}"
  WriteRegStr HKLM "Software\Atlas" "InstallDir" "$INSTDIR"
  WriteUninstaller "$INSTDIR\uninstall.exe"

  CreateShortCut "$SMPROGRAMS\Atlas.lnk" "$INSTDIR\atlas.exe"
  CreateShortCut "$DESKTOP\Atlas.lnk" "$INSTDIR\atlas.exe"

  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "DisplayName" "Atlas"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "Publisher" "Mundus"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "DisplayIcon" "$INSTDIR\atlas.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\atlas.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Atlas.lnk"
  Delete "$DESKTOP\Atlas.lnk"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Atlas"
  DeleteRegKey HKLM "Software\Atlas"
SectionEnd
