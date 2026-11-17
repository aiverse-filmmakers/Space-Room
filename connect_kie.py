#!/usr/bin/env python3
import getpass
import os
import pty
import subprocess
import termios

dialog = 'text returned of (display dialog "Paste your Kie.ai API key here:" default answer "" with hidden answer buttons {"Cancel", "Save key"} default button "Save key" with title "Connect Kie.ai")'
result = subprocess.run(['/usr/bin/osascript', '-e', dialog], capture_output=True, text=True)
if result.returncode:
    raise SystemExit(0)
key = result.stdout.rstrip('\n')
if not key or '\n' in key or '\r' in key:
    subprocess.run(['/usr/bin/osascript', '-e', 'display alert "No valid key was entered."'])
    raise SystemExit(1)
master, slave = pty.openpty()
settings = termios.tcgetattr(slave)
settings[3] &= ~termios.ECHO
termios.tcsetattr(slave, termios.TCSANOW, settings)
process = subprocess.Popen(['/usr/bin/security', 'add-generic-password', '-U', '-a', getpass.getuser(), '-s', 'Scene Room Kie API Key', '-w'], stdin=slave, stdout=slave, stderr=slave, close_fds=True)
os.close(slave)
os.write(master, (key + '\n').encode())
key = ''
try:
    code = process.wait(timeout=30)
except subprocess.TimeoutExpired:
    process.kill()
    process.wait()
    code = 1
os.close(master)
message = 'Key saved to your Mac Keychain. Return to Codex and say done.' if code == 0 else 'The key could not be saved. Please return to Codex.'
subprocess.run(['/usr/bin/osascript', '-e', 'display dialog "' + message + '" buttons {"OK"} default button "OK" with title "Connect Kie.ai"'])
raise SystemExit(code)
