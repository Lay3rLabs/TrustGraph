# Verifiable Offchain Governance

A LaTeX paper project with automated build system.

## 📁 Repository Structure

```
Verifiable-Offchain-Governance/
├── main.tex              # Main LaTeX document
├── references.bib        # Bibliography
├── figures/              # Paper figures and images
├── sections/             # LaTeX sections (optional)
├── out/                  # Build outputs (gitignored)
│   └── paper.pdf         # Compiled PDF
└── Makefile              # Build system
```

## 🚀 Quick Start

### Prerequisites

1. **LaTeX Distribution**:
   - **macOS**: MacTeX (`brew install --cask mactex`)
   - **Linux**: TeX Live (`sudo apt-get install texlive-full`)
   - **Windows**: MiKTeX (https://miktex.org/)

2. **Build Tools**:
   - `make` (usually pre-installed on Unix systems)
   - `latexmk` (optional, for watch mode)

### Building the Paper

```bash
# Build the paper
make

# or explicitly
make all

# Clean auxiliary files (keep PDF)
make clean

# Clean everything including PDF
make cleanall

# Watch mode for continuous compilation
make watch

# View the paper (macOS)
make view

# Show help
make help
```

## 📝 Working with the Paper

### Basic Workflow

1. Edit `main.tex` and related files
2. Run `make` to build the PDF
3. Check the output in `out/paper.pdf`

### Adding References

Add new citations to `references.bib`:

```bibtex
@article{example2024,
  author  = {Author Name},
  title   = {Paper Title},
  journal = {Journal Name},
  year    = {2024},
}
```

Then cite in your LaTeX document:

```latex
\cite{example2024}
```

### Adding Figures

Place images in the `figures/` directory and include them:

```latex
\begin{figure}[htbp]
  \centering
  \includegraphics[width=0.8\textwidth]{figures/your-figure.pdf}
  \caption{Your caption here}
  \label{fig:your-label}
\end{figure}
```

### Organizing Sections

For larger papers, split content into separate files in `sections/`:

```latex
% In main.tex
\input{sections/introduction}
\input{sections/methodology}
\input{sections/results}
```

## 🛠️ Development

### VS Code Integration

For seamless VS Code integration with LaTeX Workshop extension:

1. Install the "LaTeX Workshop" extension
2. The extension will auto-detect your LaTeX project
3. Configure output directory in `.vscode/settings.json`:

```json
{
  "latex-workshop.latex.outDir": "./out"
}
```

### Continuous Compilation

Use watch mode for automatic recompilation on file changes:

```bash
make watch
```

This requires `latexmk` to be installed. Press `Ctrl+C` to stop watching.

## 🔧 Troubleshooting

### Common Issues

1. **Missing packages**: Install full TeX distribution or specific packages
   ```bash
   # macOS
   sudo tlmgr install <package-name>
   
   # Linux
   sudo apt-get install texlive-<package-name>
   ```

2. **Bibliography not showing**: 
   - Ensure you have `\bibliography{references}` in your `main.tex`
   - Make sure you have `\cite{}` commands in your document
   - Run `make clean && make` to rebuild from scratch

3. **PDF not updating**: 
   - Check the `/out` directory
   - Run `make clean` and then `make`
   - Check for compilation errors in terminal output

4. **Compilation errors**: 
   - Check the log files in `/out` directory
   - Look for `out/main.log` for detailed error messages
   - Common errors include missing packages, syntax errors, or missing references

### Manual Compilation

If not using Make, compile manually:

```bash
mkdir -p out
pdflatex -output-directory=out main.tex
cd out && bibtex main
cd ..
pdflatex -output-directory=out main.tex
pdflatex -output-directory=out main.tex
mv out/main.pdf out/paper.pdf
```

## 📚 LaTeX Tips

### Document Structure

A typical LaTeX paper structure:

```latex
\documentclass[11pt,a4paper]{article}

% Packages
\usepackage[utf8]{inputenc}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{amsmath}

\title{Your Paper Title}
\author{Author Name}
\date{\today}

\begin{document}

\maketitle

\begin{abstract}
Your abstract here...
\end{abstract}

\section{Introduction}
Your content...

\section{Methodology}
More content...

\bibliographystyle{plain}
\bibliography{references}

\end{document}
```

### Useful Packages

- `graphicx` - Include images
- `hyperref` - Clickable references and URLs
- `amsmath` - Advanced math typesetting
- `algorithm2e` - Algorithm pseudocode
- `listings` - Source code formatting
- `tikz` - Diagrams and graphics

## 🔗 Additional Resources

### LaTeX Editors

- **VS Code**: With LaTeX Workshop extension (recommended)
- **Overleaf**: Online collaborative LaTeX editor
- **TeXShop** (macOS): Native LaTeX editor
- **TeXstudio**: Cross-platform LaTeX IDE

### Learning Resources

- [LaTeX Wikibook](https://en.wikibooks.org/wiki/LaTeX)
- [Overleaf Documentation](https://www.overleaf.com/learn)
- [CTAN Package Archive](https://ctan.org/)
- [LaTeX Stack Exchange](https://tex.stackexchange.com/)

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines if applicable]