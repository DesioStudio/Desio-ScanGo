const { spawn } = require('node:child_process');

function escapeSendKeysText(value) {
  return value.replace(/[+^%~()[\]{}]/g, (match) => `{${match}}`);
}

function escapePowerShellSingleQuoted(value) {
  return value.replace(/'/g, "''");
}

function sendKeyboardText(value, { appendEnter = true } = {}) {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Keyboard input simulation is only enabled on Windows.'));
  }

  const sequence = escapeSendKeysText(value) + (appendEnter ? '{ENTER}' : '');
  const script = [
    '$ws = New-Object -ComObject WScript.Shell',
    'Start-Sleep -Milliseconds 120',
    `$ws.SendKeys('${escapePowerShellSingleQuoted(sequence)}')`
  ].join('; ');

  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script
    ], {
      windowsHide: true,
      stdio: 'ignore'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`SendKeys exited with code ${code}.`));
    });
  });
}

module.exports = { sendKeyboardText };
