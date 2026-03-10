# Agent Orchestration Guide

PowerShell Spider supports orchestrating multiple AI agents across terminal panes. This document describes the architecture and patterns for multi-agent workflows.

## Core Concept

The **Agent Panel** (Ctrl+Shift+A) is the control center for broadcasting commands to multiple PowerShell terminals simultaneously. Think of it as a mission control for your AI agents — each terminal pane can run an independent agent, and you orchestrate them from one place.

## Current Capabilities

### Multi-Terminal Broadcast
- Select any combination of terminal panes as "targets"
- Send a command to all selected terminals at once
- Sequence mode: send multiple commands line-by-line with configurable delay between each

### Workspace Isolation
- Each workspace tab has its own split tree of terminals
- Organize agents by task: one workspace for "build agents", another for "test agents", etc.
- Switch between workspaces without disrupting running agents

### Split Pane Layouts
- Horizontal split (Ctrl+Shift+H) and vertical split (Ctrl+Shift+V)
- Arbitrary nesting — create 2x2, 3x1, or any layout
- Drag dividers to resize panes
- Each pane is an independent PowerShell session

## Agent Workflow Patterns

### Pattern 1: Parallel Task Execution
```
┌─────────────┬─────────────┐
│  Agent 1    │  Agent 2    │
│  (build)    │  (test)     │
├─────────────┼─────────────┤
│  Agent 3    │  Agent 4    │
│  (lint)     │  (deploy)   │
└─────────────┴─────────────┘
```
Use Agent Panel → Select All → Send command to run parallel tasks across all panes.

### Pattern 2: Pipeline Orchestration
Use **Sequence Mode** with delay to chain commands:
```
Line 1: cd C:\project
Line 2: npm run build
Line 3: npm run test
```
Each line is sent with a delay, simulating a pipeline.

### Pattern 3: Multi-Environment Testing
Create terminals pointed at different directories or environments:
- Pane 1: `cd C:\project-v1`
- Pane 2: `cd C:\project-v2`
Then broadcast the same test command to compare behavior.

### Pattern 4: Monitoring Dashboard
Split into multiple panes, each running a different monitoring command:
- `Get-Process | Sort-Object CPU -Descending | Select-Object -First 10`
- `Get-NetTCPConnection | Where-Object State -eq Listen`
- `Get-EventLog -LogName System -Newest 20`
- `docker stats`

## Future Agent Integration

### Planned: AI Agent SDK Integration
Each terminal pane could be driven by an AI agent (e.g., Claude, GPT) that:
1. Receives a task description
2. Generates and executes PowerShell commands
3. Reads output and decides next steps
4. Reports status back to the orchestrator

### Planned: Agent-to-Agent Communication
- Agents can share state via a central message bus
- One agent's output can trigger another agent's input
- Dependency graphs between agent tasks

### Planned: Presets & Recipes
- Save agent configurations as reusable presets
- "Web Scraping Swarm": 4 agents each scraping different sources
- "CI/CD Pipeline": build → test → lint → deploy chain
- "Server Monitoring": multi-server health check dashboard

### Planned: Agent Status Overlay
- Per-pane status indicators (idle, running, error, done)
- Aggregated progress bar in the status bar
- Alert system when an agent hits an error or completes

## Architecture for AI Agent Control

```
┌──────────────────────────────────────────────┐
│              Agent Orchestrator               │
│  (coordinates tasks, manages agent lifecycle) │
├──────────────┬───────────────┬───────────────┤
│   Agent 1    │   Agent 2     │   Agent 3     │
│   ┌──────┐   │   ┌──────┐    │   ┌──────┐    │
│   │ PTY  │   │   │ PTY  │    │   │ PTY  │    │
│   │ PS1  │   │   │ PS2  │    │   │ PS3  │    │
│   └──────┘   │   └──────┘    │   └──────┘    │
└──────────────┴───────────────┴───────────────┘
```

Each agent has:
- **PTY Session**: Its own PowerShell process
- **Task Queue**: Commands to execute
- **Output Buffer**: Captured output for analysis
- **State Machine**: idle → running → waiting → done/error

## Command Palette Extensions

The command palette (Ctrl+Shift+P) can be extended with agent-specific commands:
- `Agent: Start All` — begin execution on all agents
- `Agent: Pause All` — pause all running agents
- `Agent: Kill All` — terminate all agent processes
- `Agent: Load Preset` — load a saved agent configuration
- `Agent: Save Preset` — save current layout + commands as preset

## Tips for AI Coding Agents

When using this tool with AI coding agents (like Claude Code):
1. **One agent per concern**: Don't overload a single terminal — split tasks
2. **Use sequence mode**: For multi-step operations that need ordering
3. **Name your terminals**: Double-click the terminal label to rename (e.g., "builder", "tester")
4. **Watch the status bar**: Shows active pane count and current workspace
5. **Use workspaces for isolation**: Keep different projects in different workspace tabs
