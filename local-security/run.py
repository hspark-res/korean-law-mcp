#!/usr/bin/python3
"""Local read-only MCP launcher; never logs the credential."""
import os
from pathlib import Path
import stat
import shutil
import sys
ROOT = Path(__file__).resolve().parent.parent
KEY = Path.home() / '.config/korean-law-mcp/oc.key'
if not KEY.is_file() or KEY.is_symlink():
    sys.exit('법제처 인증키 파일이 없습니다: ~/.config/korean-law-mcp/oc.key')
s = KEY.stat()
if s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) & 0o077:
    sys.exit('인증키 파일은 본인 소유이고 권한이 600이어야 합니다.')
key = KEY.read_text().strip()
if not key or '\n' in key:
    sys.exit('인증키 파일에는 OC 값 한 줄만 넣으세요.')
node_path = shutil.which('node')
if not node_path:
    sys.exit('Node.js 24가 필요합니다.')
node = Path(node_path)
env = {'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8', 'LAW_OC': key,
       'LAW_READ_ONLY': '1', 'LAW_API_PROTOCOL': 'https', 'UV_THREADPOOL_SIZE': '2'}
os.chdir(ROOT)
os.execve(node, [str(node), '--permission', '--allow-fs-read=' + str(ROOT),
                  '--max-old-space-size=512', str(ROOT / 'build/index.js')], env)
