# PACKAGE INFO:
- npm package name: stackscope-worker (CLI and worker infrastructure)
- This is the infrastructure deployment and management package
- Browser SDK is in separate stackscope package

# PUBLISHING STEPS:
When ready to publish a new version:
1. Update README.md with latest CLI features and deployment instructions
2. Update package.json version number
3. Test worker template deployment
4. Build worker templates: `cd templates/worker && npm run build`
5. Test CLI commands: `npm test`
6. Publish: `npm publish` (uses npm token configured in ~/.npmrc)

# CODING RULES FOR WORKER (NON-NEGOTIABLE):

- All logic MUST depend on interfaces, never concrete classes
- Every external dependency MUST be expressed as an interface
- Classes may ONLY appear in infrastructure / adapters
- No function may accept a concrete class type
- Prefer interfaces over type aliases unless modeling data
- No inline implementations inside constructors
- Dependency Injection is mandatory
- Violations are bugs and must be refactored immediately
- Log files MUST be stored in project directory, never in user root
- CLI must be Node.js compatible (Node 16+)
- Worker templates must be Cloudflare Workers compatible

# TEMPLATE MANAGEMENT:
- Keep `/worker/` as development/testing worker
- Keep `/templates/worker/` as clean template for users
- When making changes, update both locations for consistency
- Template must work out-of-the-box after `stackscope-worker init`