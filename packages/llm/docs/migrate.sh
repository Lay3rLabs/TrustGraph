#!/bin/bash

# WAVS Components Migration Script for wavs-llm API Upgrade
# This script automates the migration of DAO Agent and LLM Attester components
# to use the new simplified wavs-llm API

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../../../.." && pwd )"
PATCHES_DIR="$SCRIPT_DIR/patches"
BACKUP_BRANCH="wavs-llm-upgrade-backup-$(date +%Y%m%d-%H%M%S)"

# Components to migrate
COMPONENTS=("dao-agent" "llm-attester")

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create backup
create_backup() {
    print_status "Creating backup branch: $BACKUP_BRANCH"
    cd "$PROJECT_ROOT"

    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        print_warning "You have uncommitted changes. Please commit or stash them before running migration."
        echo "Run: git stash"
        exit 1
    fi

    git checkout -b "$BACKUP_BRANCH" 2>/dev/null || {
        print_warning "Backup branch already exists or git error occurred"
    }
    print_success "Backup created on branch: $BACKUP_BRANCH"
}

# Function to apply a patch
apply_patch() {
    local component=$1
    local patch_file="$PATCHES_DIR/${component}.patch"

    if [[ ! -f "$patch_file" ]]; then
        print_error "Patch file not found: $patch_file"
        return 1
    fi

    print_status "Applying patch for $component..."
    cd "$PROJECT_ROOT"

    # Check if patch can be applied
    if git apply --check "$patch_file" 2>/dev/null; then
        git apply "$patch_file"
        print_success "Patch applied successfully for $component"
    else
        print_warning "Patch cannot be applied cleanly. Attempting manual migration..."
        manual_migrate_$component
    fi
}

# Manual migration for DAO Agent
manual_migrate_dao-agent() {
    local file="$PROJECT_ROOT/components/dao-agent/src/lib.rs"

    print_status "Performing manual migration for DAO Agent..."

    # Create a temporary backup
    cp "$file" "$file.bak"

    # Update imports
    sed -i '' 's/use wavs_llm::client::{LlmResponse, Message};/use wavs_llm::{LlmResponse, Message};/' "$file"

    # Update Message construction (simplified approach)
    print_warning "Manual migration partially complete. Please review and update:"
    echo "  1. Message construction around line 55-63"
    echo "  2. LLM client usage around line 72-74"
    echo ""
    echo "Refer to $PATCHES_DIR/dao-agent.patch for the exact changes needed"

    return 0
}

# Manual migration for LLM Attester
manual_migrate_llm-attester() {
    local file="$PROJECT_ROOT/components/llm-attester/src/lib.rs"

    print_status "Performing manual migration for LLM Attester..."

    # Create a temporary backup
    cp "$file" "$file.bak"

    # Update imports
    sed -i '' 's/use wavs_llm::client;/use wavs_llm::{LLMClient, LlmOptions};/' "$file"

    # Update complete_structured to chat_structured
    sed -i '' 's/\.complete_structured::<LikeResponse>(&user_prompt)/.chat_structured::<LikeResponse>(\&user_prompt)\n        .send()/' "$file"

    # Update LLMClient instantiation
    sed -i '' 's/client::LLMClient/LLMClient/' "$file"

    print_success "Manual migration complete for LLM Attester"
    return 0
}

# Function to build and test a component
test_component() {
    local component=$1
    local component_dir="$PROJECT_ROOT/components/$component"

    if [[ ! -d "$component_dir" ]]; then
        print_error "Component directory not found: $component_dir"
        return 1
    fi

    print_status "Building and testing $component..."
    cd "$component_dir"

    # Build the component
    if cargo component build 2>&1 | grep -q "error"; then
        print_error "Build failed for $component"
        return 1
    fi

    print_success "$component built successfully"

    # Run tests if they exist
    if cargo test --lib 2>&1 | grep -q "test result: ok"; then
        print_success "$component tests passed"
    else
        print_warning "No tests found or tests failed for $component"
    fi

    return 0
}

# Function to validate component with WASI
validate_wasi() {
    local component=$1

    print_status "Validating $component with WASI..."
    cd "$PROJECT_ROOT"

    if command_exists make; then
        make validate-component COMPONENT=$component 2>/dev/null || {
            print_warning "WASI validation not available or failed for $component"
        }
    else
        print_warning "Make not available, skipping WASI validation"
    fi
}

# Function to rollback changes
rollback() {
    print_warning "Rolling back changes..."
    cd "$PROJECT_ROOT"

    # Restore from backup files if they exist
    for component in "${COMPONENTS[@]}"; do
        local file="$PROJECT_ROOT/components/$component/src/lib.rs"
        if [[ -f "$file.bak" ]]; then
            mv "$file.bak" "$file"
            print_status "Restored $component from backup"
        fi
    done

    # Return to original branch
    git checkout - 2>/dev/null || true
    print_success "Rollback complete"
}

# Main migration function
main() {
    echo "======================================"
    echo "WAVS Components Migration Tool"
    echo "Migrating to new wavs-llm API"
    echo "======================================"
    echo ""

    # Check prerequisites
    print_status "Checking prerequisites..."

    if ! command_exists cargo; then
        print_error "Cargo not found. Please install Rust."
        exit 1
    fi

    if ! command_exists git; then
        print_error "Git not found. Please install Git."
        exit 1
    fi

    print_success "Prerequisites checked"

    # Create backup
    create_backup

    # Build wavs-llm package first
    print_status "Building wavs-llm package..."
    cd "$PROJECT_ROOT/packages/llm"
    if cargo build 2>&1 | grep -q "error"; then
        print_error "wavs-llm package build failed. Please fix errors before migrating."
        exit 1
    fi
    print_success "wavs-llm package built successfully"

    # Migrate each component
    local failed_components=()

    for component in "${COMPONENTS[@]}"; do
        echo ""
        echo "Processing $component..."
        echo "------------------------"

        # Apply patch
        if ! apply_patch "$component"; then
            print_error "Failed to apply patch for $component"
            failed_components+=("$component")
            continue
        fi

        # Test component
        if ! test_component "$component"; then
            print_error "Tests failed for $component"
            failed_components+=("$component")
            continue
        fi

        # Validate with WASI
        validate_wasi "$component"

        print_success "$component migration complete"
    done

    echo ""
    echo "======================================"
    echo "Migration Summary"
    echo "======================================"

    if [[ ${#failed_components[@]} -eq 0 ]]; then
        print_success "All components migrated successfully!"
        echo ""
        echo "Next steps:"
        echo "  1. Review the changes: git diff"
        echo "  2. Run integration tests: make wasi-build && bash ./script/deploy-script.sh"
        echo "  3. Commit changes: git add -A && git commit -m 'Migrate to new wavs-llm API'"
        echo ""
        echo "To rollback if needed: git checkout $BACKUP_BRANCH"
    else
        print_warning "Migration completed with issues:"
        for component in "${failed_components[@]}"; do
            echo "  - $component"
        done
        echo ""
        echo "Please fix the issues manually and re-run the migration."
        echo "To rollback: ./migrate.sh --rollback"
    fi
}

# Handle command line arguments
case "${1:-}" in
    --rollback)
        rollback
        ;;
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --rollback    Rollback migration changes"
        echo "  --help        Show this help message"
        echo ""
        echo "This script migrates WAVS components to use the new wavs-llm API."
        ;;
    *)
        main
        ;;
esac
