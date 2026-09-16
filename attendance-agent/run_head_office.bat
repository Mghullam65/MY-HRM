@echo off
title ZKTeco Sync Agent - Head Office
echo ===================================================
echo Starting ZKTeco Sync Agent (Head Office)
echo ===================================================
node "%~dp0zk_sync_agent.js" --config "%~dp0config_head_office.json"
pause
