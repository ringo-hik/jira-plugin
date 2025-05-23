# JIRA Remote Control

A simple VS Code extension for viewing JIRA issues and opening them in your browser.

## Features

- Connect to JIRA using URL and Personal Access Token (PAT)
- Add multiple projects to monitor
- View recent 50 issues per project
- View your assigned issues per project
- Click to open issues directly in browser
- Clean tree view interface

## Setup

1. Install the extension
2. Click on the JIRA icon in the activity bar
3. Click "Setup JIRA Connection"
4. Enter your JIRA server URL (e.g., https://jira.company.com)
5. Enter your username/email
6. Enter your Personal Access Token (PAT)

## Usage

- Click the "+" button to add a project (enter project key like "PROJ")
- Expand projects to see "Recent Issues" and "My Issues"
- Click on any issue to open it in your browser
- Use refresh button to update issue lists

## Requirements

- VS Code 1.74.0 or higher
- JIRA Server/Data Center 7.0 or higher
- JIRA Cloud (all versions)
- Valid JIRA server URL and PAT token

## Supported JIRA Versions

- **JIRA Server**: 7.0+, 8.x, 9.x
- **JIRA Data Center**: 7.0+, 8.x, 9.x
- **JIRA Cloud**: All versions
- Uses REST API v2 for maximum compatibility

## Simple and Clean

This extension is intentionally minimal:
- No complex features
- No working issue tracking
- No timers or status bars
- Just view issues and open them in browser

Perfect as a JIRA remote control!