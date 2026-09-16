@echo off
title ZKTeco Sync Agent - Factory
echo ===================================================
echo Starting ZKTeco Sync Agent (Factory)
echo ===================================================
node "%~dp0zk_sync_agent.js" --config "%~dp0config_factory.json"
pause
