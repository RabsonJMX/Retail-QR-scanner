$node = 'C:\Users\JMXfo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
Start-Process 'http://localhost:4173'
& $node "$PSScriptRoot\server.mjs"
