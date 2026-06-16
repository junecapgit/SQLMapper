# Contributing to SqlMapper

Thank you for your interest in contributing to SqlMapper! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** and clone your fork locally
2. **Install dependencies**: `npm install`
3. **Create a branch** for your changes: `git checkout -b feature/my-new-feature`
4. **Make your changes** and test them thoroughly
5. **Run tests**: `npm test`
6. **Commit your changes** with a clear commit message
7. **Push to your fork** and create a Pull Request

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Running Locally
```bash
npm install
npm run dev
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test
npm test -- schema-parser.test.ts
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Run `npm run lint` before committing
- Write meaningful variable and function names
- Add comments for complex logic

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage on core modules
- Test with various schema types and edge cases

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update README.md** if needed
5. **Describe your changes** clearly in the PR description
6. **Link related issues** if applicable

## Reporting Bugs

When reporting bugs, include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Sample schema (if applicable)
- Screenshots (if applicable)
- Your environment (OS, Node version, etc.)

## Feature Requests

Feature requests are welcome! Please:
- Check existing issues first
- Describe the use case clearly
- Explain why it would be useful
- Consider if it fits the project scope

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on what is best for the project
- Show empathy towards others

## Questions?

Feel free to open an issue with the question label.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
