# 📚 Immo2000 Documentation

**Version**: 2.0.0 | **Last Updated**: 2026-06-09 | **Status**: ✅ PRODUCTION READY

---

## 📖 Documentation Structure

This documentation is organized thematically for easy navigation:

### 🏗️ Core Documentation

| Category | File | Description |
|----------|------|-------------|
| **Architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, patterns, and data flows |
| **API Reference** | [API/REFERENCE.md](./API/REFERENCE.md) | Complete API documentation (Flask + FastAPI) |
| **Deployment** | [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guides (local, Railway, production) |
| **Security** | [SECURITY.md](./SECURITY.md) | Authentication, authorization, GDPR compliance |
| **Ports Configuration** | [DEPLOYMENT.md#infrastructure--ports](./DEPLOYMENT.md#infrastructure--ports) | All ports used by services |

### 📜 Domain-Specific Documentation

| Domain | Location | Description |
|--------|----------|-------------|
| **Notaire System** | [NOTAIRE/README.md](./NOTAIRE/README.md) | Partner notary integration, encryption, RGPD |
| **Legal Documents** | [LEGAL/](./LEGAL/) | Terms of service, privacy policy |
| **User Guides** | [GUIDES/](./GUIDES/) | Buying, selling, and usage guides |
| **Core Models** | [CORE/](./CORE/) | Annonces, Biens, Visites, Auth, Feedback |
| **Models Reference** | [MODELES/](./MODELES/) | Data models and schemas |

### 📅 Project Phases

| Phase | File | Description |
|-------|------|-------------|
| **Phase 2** | [PHASES/PHASE2.md](./PHASES/PHASE2.md) | Initial setup and dependencies cleanup |
| **Phase 3** | [PHASES/PHASE3.md](./PHASES/PHASE3.md) | Notaire system implementation |
| **Phase 4** | [PHASES/PHASE4.md](./PHASES/PHASE4.md) | Security implementation (S5, S6) |
| **Phase 5** | [PHASES/PHASE5.md](./PHASES/PHASE5.md) | Optimizations (M1-M8) |
| **Phase 6** | [PHASES/PHASE6.md](./PHASES/PHASE6.md) | FastAPI migration, complete deployment |
| **Phase 7** | [PHASES/PHASE7.md](./PHASES/PHASE7.md) | Scheduler, email integration |
| **Phase 8** | [PHASES/PHASE8.md](./PHASES/PHASE8.md) | Performance and analytics |
| **Phase 9** | [PHASES/PHASE9.md](./PHASES/PHASE9.md) | Final production readiness |

### 🚀 Quick Start Guides

| Guide | Location | Description |
|-------|----------|-------------|
| **Launch Guide** | [START/LAUNCH_GUIDE.md](./START/LAUNCH_GUIDE.md) | Get the project running quickly |
| **Integration Guide** | [START/INTEGRATION_GUIDE.md](./START/INTEGRATION_GUIDE.md) | Integrate matching and simulator |
| **Chatbot Quickstart** | [START/CHATBOT_QUICKSTART.md](./START/CHATBOT_QUICKSTART.md) | Chatbot integration |
| **FAQ** | [START/FAQ_QUICKSTART.md](./START/FAQ_QUICKSTART.md) | Frequently asked questions |
| **Navigation** | [START/NAVIGATION.md](./START/NAVIGATION.md) | App navigation guide |

### 📊 Additional Resources

| Resource | Location | Description |
|----------|----------|-------------|
| **Reference Materials** | [REFERENCE/](./REFERENCE/) | Architecture refs, audit reports, algorithms |
| **Announcements System** | [ANNONCES/](./ANNONCES/) | Annonce matching and management |
| **Authentication** | [AUTH/](./AUTH/) | JWT, 2FA, rate limiting guides |
| **Deployment Configs** | [DEPLOY/](./DEPLOY/) | Specific deployment configurations |

---

## 🎯 Quick Navigation

### For Developers
1. **First time?** → [DEPLOYMENT.md#quick-start](./DEPLOYMENT.md#quick-start)
2. **Need API docs?** → [API/REFERENCE.md](./API/REFERENCE.md)
3. **Understanding architecture?** → [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Working on authentication?** → [SECURITY.md#authentication--authorization](./SECURITY.md#authentication--authorization)

### For Notaire Partners
1. **Setup guide** → [NOTAIRE/README.md#quick-start](./NOTAIRE/README.md#quick-start)
2. **Profile configuration** → [NOTAIRE/README.md#profile-setup](./NOTAIRE/README.md#profile-setup)
3. **Document encryption** → [NOTAIRE/README.md#document-encryption--rgpd-compliance](./NOTAIRE/README.md#document-encryption--rgpd-compliance)

### For DevOps
1. **Deploy to Railway** → [DEPLOYMENT.md#deploy-to-railway-recommended-simplest](./DEPLOYMENT.md#deploy-to-railway-recommended-simplest)
2. **Production checklist** → [DEPLOYMENT.md#production-checklist](./DEPLOYMENT.md#production-checklist)
3. **Ports configuration** → [DEPLOYMENT.md#infrastructure--ports](./DEPLOYMENT.md#infrastructure--ports)

---

## 📝 Changelog & Status

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-06-09 | Complete documentation restructuring and consolidation |
| 1.0.0 | 2024-06-09 | Initial documentation |

**Current Status**: All documentation has been consolidated into thematic files. Redundant files have been archived.

---

## 🗂️ Archived Documentation

Old and redundant documentation files have been moved to:
- [archived/](./archived/) - Historical documents and old versions
- [_archives/](./_archives/) - Duplicate files and legacy content

> ⚠️ **Note**: Archived files are kept for reference but may contain outdated information. Always refer to the consolidated documentation in the main structure first.

---

## 🔍 Search Tips

1. **Use your IDE's search**: `Ctrl+Shift+F` (VS Code) to search across all documentation
2. **Table of Contents**: Each main file has a comprehensive TOC at the top
3. **Cross-references**: Files link to each other for related topics

---

## 🤝 Contributing to Documentation

1. **Before adding new files**: Check if the content fits in existing consolidated files
2. **Update the README**: Add new files to the appropriate section above
3. **Remove redundancy**: If adding content, check for and remove duplicates
4. **Keep it organized**: Use the thematic structure, not project phases

---

**Maintained by**: Immo2000 Team  
**Contact**: See project root for contact information
