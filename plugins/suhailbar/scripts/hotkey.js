'use strict';
// System-wide keyboard shortcut for the keep-awake toggle.
// macOS   : a Quick Action in ~/Library/Services bound to Ctrl+Option+Cmd+K
// Windows : a Start Menu shortcut (.lnk) with Hotkey Ctrl+Alt+K
// Linux   : desktops differ too much, so we print the command to bind yourself

const crypto = require('crypto');
const L = require('./lib');
const { fs, os, path, MAC_WORKFLOW, MAC_PBS_KEY, MAC_KEY_EQUIVALENT, MAC_SERVICE_NAME, WIN_LNK, HOTKEY_LABEL, run } = L;

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
const PBS = '/System/Library/CoreServices/pbs';

function macInfoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSServices</key>
	<array>
		<dict>
			<key>NSMenuItem</key>
			<dict>
				<key>default</key>
				<string>${xml(MAC_SERVICE_NAME)}</string>
			</dict>
			<key>NSMessage</key>
			<string>runWorkflowAsService</string>
		</dict>
	</array>
</dict>
</plist>
`;
}

function macWorkflow(command) {
  const uuid = () => crypto.randomUUID().toUpperCase();
  const arg = (i, name, def) => `
					<key>${i}</key>
					<dict>
						<key>default value</key>
						${def}
						<key>name</key>
						<string>${name}</string>
						<key>required</key>
						<string>0</string>
						<key>type</key>
						<string>0</string>
						<key>uuid</key>
						<string>${i}</string>
					</dict>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AMApplicationBuild</key>
	<string>534</string>
	<key>AMApplicationVersion</key>
	<string>2.10</string>
	<key>AMDocumentVersion</key>
	<string>2</string>
	<key>actions</key>
	<array>
		<dict>
			<key>action</key>
			<dict>
				<key>AMAccepts</key>
				<dict>
					<key>Container</key>
					<string>List</string>
					<key>Optional</key>
					<true/>
					<key>Types</key>
					<array>
						<string>com.apple.cocoa.string</string>
					</array>
				</dict>
				<key>AMActionVersion</key>
				<string>2.0.3</string>
				<key>AMApplication</key>
				<array>
					<string>Automator</string>
				</array>
				<key>AMParameterProperties</key>
				<dict>
					<key>COMMAND_STRING</key>
					<dict/>
					<key>CheckedForUserDefaultShell</key>
					<dict/>
					<key>inputMethod</key>
					<dict/>
					<key>shell</key>
					<dict/>
					<key>source</key>
					<dict/>
				</dict>
				<key>AMProvides</key>
				<dict>
					<key>Container</key>
					<string>List</string>
					<key>Types</key>
					<array>
						<string>com.apple.cocoa.string</string>
					</array>
				</dict>
				<key>ActionBundlePath</key>
				<string>/System/Library/Automator/Run Shell Script.action</string>
				<key>ActionName</key>
				<string>Run Shell Script</string>
				<key>ActionParameters</key>
				<dict>
					<key>COMMAND_STRING</key>
					<string>${xml(command)}</string>
					<key>CheckedForUserDefaultShell</key>
					<true/>
					<key>inputMethod</key>
					<integer>0</integer>
					<key>shell</key>
					<string>/bin/sh</string>
					<key>source</key>
					<string></string>
				</dict>
				<key>BundleIdentifier</key>
				<string>com.apple.RunShellScript</string>
				<key>CFBundleVersion</key>
				<string>2.0.3</string>
				<key>CanShowSelectedItemsWhenRun</key>
				<false/>
				<key>CanShowWhenRun</key>
				<true/>
				<key>Category</key>
				<array>
					<string>AMCategoryUtilities</string>
				</array>
				<key>Class Name</key>
				<string>RunShellScriptAction</string>
				<key>InputUUID</key>
				<string>${uuid()}</string>
				<key>Keywords</key>
				<array>
					<string>Shell</string>
					<string>Script</string>
					<string>Command</string>
					<string>Run</string>
					<string>Unix</string>
				</array>
				<key>OutputUUID</key>
				<string>${uuid()}</string>
				<key>UUID</key>
				<string>${uuid()}</string>
				<key>UnlocalizedApplications</key>
				<array>
					<string>Automator</string>
				</array>
				<key>arguments</key>
				<dict>${arg(0, 'inputMethod', '<integer>0</integer>')}${arg(1, 'CheckedForUserDefaultShell', '<false/>')}${arg(2, 'source', '<string></string>')}${arg(3, 'COMMAND_STRING', '<string></string>')}${arg(4, 'shell', '<string>/bin/sh</string>')}
				</dict>
				<key>conversionLabel</key>
				<integer>0</integer>
				<key>isViewVisible</key>
				<integer>1</integer>
				<key>location</key>
				<string>309.000000:305.000000</string>
				<key>nibPath</key>
				<string>/System/Library/Automator/Run Shell Script.action/Contents/Resources/Base.lproj/main.nib</string>
			</dict>
			<key>isViewVisible</key>
			<integer>1</integer>
		</dict>
	</array>
	<key>connectors</key>
	<dict/>
	<key>workflowMetaData</key>
	<dict>
		<key>applicationBundleIDsByPath</key>
		<dict/>
		<key>applicationPaths</key>
		<array/>
		<key>inputTypeIdentifier</key>
		<string>com.apple.Automator.nothing</string>
		<key>outputTypeIdentifier</key>
		<string>com.apple.Automator.nothing</string>
		<key>presentationMode</key>
		<integer>11</integer>
		<key>processesInput</key>
		<false/>
		<key>serviceInputTypeIdentifier</key>
		<string>com.apple.Automator.nothing</string>
		<key>serviceOutputTypeIdentifier</key>
		<string>com.apple.Automator.nothing</string>
		<key>serviceProcessesInput</key>
		<false/>
		<key>systemImageName</key>
		<string>NSActionTemplate</string>
		<key>useAutomaticInputType</key>
		<false/>
		<key>workflowTypeIdentifier</key>
		<string>com.apple.Automator.servicesMenu</string>
	</dict>
</dict>
</plist>
`;
}

function macInstall(nodePath, awakePath) {
  const contents = path.join(MAC_WORKFLOW, 'Contents');
  fs.mkdirSync(contents, { recursive: true });
  fs.writeFileSync(path.join(contents, 'Info.plist'), macInfoPlist());
  fs.writeFileSync(path.join(contents, 'document.wflow'), macWorkflow(`${shq(nodePath)} ${shq(awakePath)} toggle --notify`));
  const r = run('defaults', [
    'write', 'pbs', 'NSServicesStatus', '-dict-add', `"${MAC_PBS_KEY}"`,
    `{ "enabled_context_menu" = 1; "enabled_services_menu" = 1; "key_equivalent" = "${MAC_KEY_EQUIVALENT}"; ` +
      `"presentation_modes" = { ContextMenu = 1; ServicesMenu = 1; TouchBar = 1; }; }`,
  ]);
  run(PBS, ['-update']);
  return r.status === 0
    ? `${HOTKEY_LABEL.darwin} (Quick Action "${MAC_SERVICE_NAME}")`
    : `Quick Action "${MAC_SERVICE_NAME}" installed, but the shortcut could not be assigned. Set it in System Settings > Keyboard > Keyboard Shortcuts > Services > General.`;
}

function macRemove() {
  const existed = fs.existsSync(MAC_WORKFLOW);
  fs.rmSync(MAC_WORKFLOW, { recursive: true, force: true });
  // Drop only our entry from the pbs NSServicesStatus dictionary
  const tmp = path.join(os.tmpdir(), `suhailbar-pbs-${process.pid}.plist`);
  if (run('defaults', ['export', 'pbs', tmp]).status === 0) {
    if (run('plutil', ['-remove', `NSServicesStatus.${MAC_PBS_KEY}`, tmp]).status === 0) {
      run('defaults', ['import', 'pbs', tmp]);
    }
    fs.rmSync(tmp, { force: true });
  }
  run(PBS, ['-update']);
  return existed;
}

function winInstall(awakePath) {
  const q = (s) => String(s).replace(/'/g, "''");
  const ps = [
    `$s = (New-Object -ComObject WScript.Shell).CreateShortcut('${q(WIN_LNK)}')`,
    `$s.TargetPath = '${q(process.execPath)}'`,
    `$s.Arguments = '"${q(awakePath)}" toggle --notify'`,
    `$s.Hotkey = 'CTRL+ALT+K'`,
    `$s.WindowStyle = 7`,
    `$s.Description = 'SuhailBar: toggle keep-awake'`,
    `$s.Save()`,
  ].join('; ');
  const r = run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps]);
  return r.status === 0
    ? `${HOTKEY_LABEL.win32} (Start Menu shortcut "${MAC_SERVICE_NAME}")`
    : `Could not create the Start Menu shortcut: ${(r.stderr || '').trim()}`;
}

function winRemove() {
  const existed = fs.existsSync(WIN_LNK);
  fs.rmSync(WIN_LNK, { force: true });
  return existed;
}

function install(nodePath, awakePath) {
  if (process.platform === 'darwin') return macInstall(nodePath, awakePath);
  if (process.platform === 'win32') return winInstall(awakePath);
  return `not set automatically on Linux. Bind this command in your desktop's keyboard settings:\n      ${nodePath} ${awakePath} toggle --notify`;
}

function remove() {
  if (process.platform === 'darwin') return macRemove();
  if (process.platform === 'win32') return winRemove();
  return false;
}

module.exports = { install, remove };
