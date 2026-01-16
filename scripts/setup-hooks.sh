#!/bin/bash
# Setup script for collaborative Claude Code workflow
# Run this after cloning the repository

echo "Setting up git hooks..."
git config core.hooksPath .githooks
chmod +x .githooks/*

echo "Done! Git hooks configured."
echo ""
echo "Remember to:"
echo "1. Read CLAUDE.md for the collaboration workflow"
echo "2. Check .claude/worklog.md before starting work"
echo "3. Always 'git pull origin main' before making changes"
