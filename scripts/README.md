# 🛠️ Scripts & Utilities

This directory contains utility scripts for development, testing, and database management.

## 📋 Script Categories

### 🧪 Testing Scripts
```bash
run_tests.sh                    # Run all tests
test_image_optimization.py      # Test image optimization
test_images_integration.py      # Test image integration
test_matching.sh                # Test matching algorithm
test_notaire_system.py          # Test notaire system
```

### 🗄️ Database Scripts
```bash
create_test_user.py             # Create test user in DB
create_admin_profile.py          # Create admin profile
create_notaire_profile.py        # Create notaire profile
list_users.py                   # List all users
check_admin_role.sql            # Check admin role
check_notaire_role.sql          # Check notaire role
create_admin_role.sql           # Create admin role
create_notaire_role.sql         # Create notaire role
init_encryption_rgpd.py         # Initialize RGPD encryption
```

### 🔄 Migration & Setup Scripts
```bash
run_migrations_and_tests.py      # Run migrations + tests
run_phase2_migrations.sh         # Phase 2 migrations
setup_task3.sh                  # Setup task 3
setup.sh                        # Initial setup
assign_random_photos.py         # Assign random photos to listings
compress_and_upload_images.py   # Image compression & upload
```

### 🔧 Refactoring Scripts
```bash
refactor_phase2.py              # Phase 2 refactoring
refactor_phase2_routes.py       # Refactor Phase 2 routes
refactor_routes.py              # General route refactoring
phase2_batch_refactor.py        # Batch refactor Phase 2
phase2_complete_refactor.py     # Complete Phase 2 refactor
```

### 📊 Utility Scripts
```bash
run.sh                          # Run application
verify_github.sh                # Verify GitHub setup
show_structure.sh               # Show project structure
example_complete_auth.sh        # Example auth flow
```

---

## 🚀 Common Usage

### Running Tests
```bash
./run_tests.sh
```

### Setting Up Development Environment
```bash
./setup.sh
```

### Creating Test Data
```bash
python create_test_user.py
python create_admin_profile.py
python create_notaire_profile.py
```

### Running Migrations
```bash
python run_migrations_and_tests.py
```

### Image Optimization
```bash
python compress_and_upload_images.py
python test_image_optimization.py
```

---

## 📁 Script Organization

```
scripts/
├── README.md (this file)
│
├── test_*.py                   # Testing utilities
├── test_*.sh                   # Testing shell scripts
│
├── create_*.py                 # Database creation scripts
├── create_*.sql                # SQL creation scripts
│
├── run_*.sh                    # Execution scripts
├── setup*.sh                   # Setup scripts
│
├── refactor_*.py              # Refactoring scripts
│
├── *_encrypt*.py              # Encryption related
├── compress_*.py              # Compression utilities
├── assign_*.py                # Assignment utilities
└── verify_*.sh                # Verification scripts
```

---

## 🔍 Script Details

### Testing
| Script | Purpose |
|--------|---------|
| `run_tests.sh` | Execute full test suite |
| `test_image_optimization.py` | Validate image optimization |
| `test_images_integration.py` | Test image system integration |
| `test_matching.sh` | Verify matching algorithm |
| `test_notaire_system.py` | Test notaire functionality |

### Database Management
| Script | Purpose |
|--------|---------|
| `create_test_user.py` | Add test user to database |
| `list_users.py` | Display all users |
| `create_admin_profile.py` | Setup admin account |
| `create_notaire_profile.py` | Setup notaire account |

### Development Setup
| Script | Purpose |
|--------|---------|
| `setup.sh` | Initial project setup |
| `run.sh` | Start application |
| `run_migrations_and_tests.py` | DB migrations + tests |

### Data Processing
| Script | Purpose |
|--------|---------|
| `compress_and_upload_images.py` | Optimize & upload images |
| `assign_random_photos.py` | Add sample photos |

---

## ⚙️ Requirements

- Python 3.11+
- Bash/Zsh shell
- PostgreSQL 15
- Node.js 18+ (for some scripts)
- Docker (optional, for containerized execution)

---

## 💡 Tips

### Run from Project Root
```bash
# From /home/djali/code/Soipadeg/Immo2000
./scripts/run_tests.sh
python scripts/create_test_user.py
```

### Use with Python Virtual Environment
```bash
# Activate venv first
source backend/venv/bin/activate

# Then run scripts
python scripts/create_test_user.py
```

### Make Scripts Executable
```bash
chmod +x scripts/*.sh
```

---

## 🐛 Troubleshooting

### "Permission Denied"
```bash
chmod +x scripts/run_tests.sh
./scripts/run_tests.sh
```

### "Python Module Not Found"
```bash
# Install requirements
pip install -r backend/requirements.txt
```

### "Database Connection Error"
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Verify database is running
psql postgres://user:pass@localhost/immo2000
```

---

## 📚 Related Documentation

- 🔧 Development Setup: [../DEV_MODE.md](../DEV_MODE.md)
- 📖 Project README: [../../README.md](../../README.md)
- 🏗️ Architecture: [../architecture/](../architecture/)

---

**Last Updated**: 2024
**Maintained By**: Development Team
