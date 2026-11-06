import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const flags=['--permission',`--allow-fs-read=${root}`];
for (const code of ["require('fs').readFileSync('/etc/passwd')", "require('fs').writeFileSync('blocked-write','x')", "require('child_process').execFileSync('/bin/true')"]) {
 const r=spawnSync(process.execPath,[...flags,'-e',code],{encoding:'utf8'});
 assert.notEqual(r.status,0); assert.match(r.stderr,/ERR_ACCESS_DENIED/);
}
const t = new StdioClientTransport({command:process.execPath,args:[...flags,'build/index.js'],env:{PATH:'/usr/bin:/bin',LAW_READ_ONLY:'1',LAW_OC:'test-not-a-real-key'},stderr:'pipe'});
const c=new Client({name:'security-check',version:'1'});
try {
 await c.connect(t);
 const {tools}=await c.listTools();assert.equal(tools.length,10);
 const r=await c.callTool({name:'legal_analysis',arguments:{mode:'amendment_table',amendments:[{text:'제1조(목적) 새 내용',currentText:'제1조(목적) 이전 내용'}],outputPath:'/etc/blocked.hwpx'}});
 assert.match(JSON.stringify(r),/File output is disabled/);
 console.log('PASS: MCP handshake, 10 tools, output rejection, filesystem read/write and child-process denial');
} finally { await c.close(); }
const {getLawApiProtocol}=await import('../build/lib/law-url-config.js');
process.env.LAW_API_PROTOCOL='http'; assert.throws(()=>getLawApiProtocol(),/Insecure/);
console.log('PASS: plaintext HTTP rejected');
