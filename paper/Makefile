# Makefile for LaTeX paper
# Builds a single paper and outputs PDF to the out/ directory

# LaTeX compiler settings
LATEX = pdflatex
BIBTEX = bibtex
LATEX_FLAGS = -interaction=nonstopmode -halt-on-error -output-directory=out

# Paper name (derived from directory or set to "paper")
PAPER_NAME = Verifiable-Offchain-Governance

# Output files
PDF = out/$(PAPER_NAME).pdf

# Colors for output
GREEN = \033[0;32m
BLUE = \033[0;34m
RED = \033[0;31m
NC = \033[0m # No Color

# Default target - build the paper
.PHONY: all
all: $(PDF)
	@echo "$(GREEN)✓ Paper built successfully: $(PDF)$(NC)"

# Build the paper
$(PDF): main.tex references.bib | out
	@echo "$(BLUE)Building paper...$(NC)"
	@$(LATEX) $(LATEX_FLAGS) main.tex
	@cd out && $(BIBTEX) main || true
	@$(LATEX) $(LATEX_FLAGS) main.tex
	@$(LATEX) $(LATEX_FLAGS) main.tex
	@mv out/main.pdf $(PDF)
	@echo "$(GREEN)✓ Paper complete: $(PDF)$(NC)"

# Create output directory
out:
	@mkdir -p out

# Clean auxiliary files but keep PDF
.PHONY: clean
clean:
	@echo "$(BLUE)Cleaning auxiliary files...$(NC)"
	@rm -f out/*.aux out/*.bbl out/*.blg out/*.log out/*.out out/*.toc out/*.fls out/*.fdb_latexmk out/*.synctex.gz
	@echo "$(GREEN)✓ Clean complete$(NC)"

# Clean all generated files including PDF
.PHONY: cleanall
cleanall: clean
	@echo "$(RED)Removing PDF...$(NC)"
	@rm -f out/*.pdf
	@echo "$(GREEN)✓ All files removed$(NC)"

# Watch mode for continuous compilation (requires latexmk)
.PHONY: watch
watch:
	@echo "$(BLUE)Watching for changes...$(NC)"
	@latexmk -pdf -pvc -output-directory=out main.tex

# View the paper (macOS)
.PHONY: view
view:
	@if [ -f "$(PDF)" ]; then \
		open $(PDF); \
	else \
		echo "$(RED)Error: $(PDF) not found. Run 'make' first.$(NC)"; \
	fi

# Help target
.PHONY: help
help:
	@echo "$(BLUE)LaTeX Paper Makefile$(NC)"
	@echo ""
	@echo "Available targets:"
	@echo "  $(GREEN)make$(NC) or $(GREEN)make all$(NC)  - Build the paper"
	@echo "  $(GREEN)make clean$(NC)          - Remove auxiliary files (keep PDF)"
	@echo "  $(GREEN)make cleanall$(NC)       - Remove all generated files"
	@echo "  $(GREEN)make watch$(NC)          - Watch and auto-rebuild paper"
	@echo "  $(GREEN)make view$(NC)           - Open PDF in viewer (macOS)"
	@echo "  $(GREEN)make help$(NC)           - Show this help message"
