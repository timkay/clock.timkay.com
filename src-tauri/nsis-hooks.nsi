!macro NSIS_HOOK_PREINSTALL
  nsProcess::KillProcess "Clock.exe"
  Pop $R0
  Sleep 500
!macroend
