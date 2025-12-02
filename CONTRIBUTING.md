# Contributing to Graiph

Thank you for considering contributing to Graiph! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- Clear title describing the problem
- Steps to reproduce the bug
- Expected behavior vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, Python version)

### Suggesting Features

Feature requests are welcome! Please create an issue with:
- Clear title describing the feature
- Detailed description of the feature
- Use cases and benefits
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/YourFeatureName
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   - Test with multiple dataset types
   - Ensure no existing functionality breaks
   - Check both frontend and backend work together

4. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```

   Commit message prefixes:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

5. **Push to your fork**
   ```bash
   git push origin feature/YourFeatureName
   ```

6. **Create a Pull Request**
   - Provide clear title and description
   - Reference any related issues
   - Explain what your changes do
   - Include screenshots for UI changes

## Development Setup

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

### Backend Development

```bash
cd python-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

## Code Style

### TypeScript/React
- Use TypeScript for all new code
- Follow React hooks best practices
- Use functional components
- Add types for all functions and variables
- Use meaningful variable names

### Python
- Follow PEP 8 style guide
- Use type hints where applicable
- Add docstrings for functions
- Keep functions small and focused
- Use meaningful variable names

## Testing

Currently, Graiph uses manual testing. We welcome contributions to add:
- Unit tests (Jest for frontend, pytest for backend)
- Integration tests
- End-to-end tests

## Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- [ ] Add support for Excel files (.xlsx)
- [ ] Add unit tests for critical functions
- [ ] Improve error handling and user feedback
- [ ] Add loading states and progress indicators
- [ ] Support for larger datasets (100k+ rows)

### Medium Priority
- [ ] Add more chart types (candlestick, gantt, sankey)
- [ ] Custom color themes
- [ ] Dashboard templates by industry
- [ ] Interactive chart filters
- [ ] Export to PowerPoint

### Nice to Have
- [ ] Real-time data connections (databases)
- [ ] Collaborative editing
- [ ] Version history for dashboards
- [ ] API documentation
- [ ] Multi-language support

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the "question" label
- Reach out to the maintainers
- Check existing issues and pull requests

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory comments
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## Recognition

Contributors will be:
- Listed in the README
- Credited in release notes
- Given a shoutout on social media (if desired)

Thank you for helping make Graiph better!
