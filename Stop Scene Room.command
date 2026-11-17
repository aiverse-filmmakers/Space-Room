#!/bin/zsh
cd -- "${0:A:h}"
NODE="$HOME/.nvm/versions/node/v24.7.0/bin/node"
if [[ ! -x "$NODE" ]]; then NODE="$(command -v node)"; fi
"$NODE" service.mjs stop
if [[ $? -ne 0 ]]; then read '?Press Enter to close…'; fi
