#!/bin/bash
# Manual load script for nvm on Replit

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

echo "🎖 NVM Loaded → Ready for Node.js overlay flow!"