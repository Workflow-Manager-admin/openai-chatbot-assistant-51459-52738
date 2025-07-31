#!/bin/bash
cd /home/kavia/workspace/code-generation/openai-chatbot-assistant-51459-52738/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

