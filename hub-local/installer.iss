#define MyAppName "Agil OS - Hub Local LAN"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Supreme Apps"
#define MyAppURL "https://agilos.supremeapps.com.br"
#define MyAppExeName "AgilOS-Hub.exe"

[Setup]
AppId={{B7F2A7C9-4B39-4E37-A116-4E0A8B9C7D11}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\AgilOS Hub Local
DefaultGroupName=Agil OS Hub Local
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=AgilOS-Hub-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
CloseApplications=yes

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Status do Agil OS Hub"; Filename: "http://localhost:4321"
Name: "{group}\Iniciar Hub Local"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

[Registry]
Root: HKLM; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "AgilOSLanHub"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Agil OS LAN Hub HTTP"""; Flags: runhidden waituntilterminated
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Agil OS LAN Hub HTTPS"""; Flags: runhidden waituntilterminated
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Agil OS LAN Hub HTTP"" dir=in action=allow protocol=TCP localport=4321"; Flags: runhidden waituntilterminated
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Agil OS LAN Hub HTTPS"" dir=in action=allow protocol=TCP localport=4322"; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar o Agil OS Hub Local agora (recomendado)"; Flags: nowait postinstall skipifsilent
Filename: "http://localhost:4321"; Description: "Abrir página de status local no navegador"; Flags: shellexec nowait postinstall skipifsilent

[UninstallRun]
Filename: "taskkill"; Parameters: "/F /IM {#MyAppExeName}"; Flags: runhidden waituntilterminated
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Agil OS LAN Hub HTTP"""; Flags: runhidden waituntilterminated
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Agil OS LAN Hub HTTPS"""; Flags: runhidden waituntilterminated

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Exec('taskkill', '/F /IM AgilOS-Hub.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := '';
end;
