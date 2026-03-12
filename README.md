# AI Agent Threat Modelling Scorecard

A comprehensive security risk assessment tool for evaluating the threat landscape of AI agent integrations and workflows.

## Overview

This interactive scorecard helps to quickly assess security risks when planning to integrate AI agents into our systems. It evaluates six critical threat categories and provides real-time risk tier assessments with actionable recommendations.

## Features

✨ **Interactive Scoring Interface**
- Six threat assessment categories with 0-100 scoring scale
- Real-time visual feedback with color-coded risk indicators
- Responsive design that works on desktop, tablet, and mobile devices

📊 **Dynamic Risk Assessment**
- Automatic overall risk score calculation
- Five-tier risk classification: Minimal, Low, Medium, High, Critical
- Visual progress bar showing risk level
- Color-coded severity indicators

💡 **Intelligent Recommendations**
- Category-specific risk mitigation strategies
- Tier-based actionable recommendations
- Comprehensive guidance for each threat area

📄 **Report Export**
- Generate printable PDF reports
- Include all category scores and risk assessments
- Detailed recommendations for risk mitigation
- Professional formatting with timestamps

## Threat Categories

1. **Data Exposure** 🔓
   - Risk of sensitive data being exposed or leaked
   - Covers data encryption, access controls, and data handling practices

2. **Model Poisoning** ☠️
   - Risk of AI model being manipulated or compromised
   - Addresses model integrity and validation procedures

3. **Prompt Injection** 💉
   - Risk of malicious prompts causing unexpected behavior
   - Evaluates input validation and sanitization

4. **Unauthorized Access** 🔐
   - Risk of unauthorized users gaining system access
   - Assesses authentication and authorization mechanisms

5. **System Integration Risk** ⚙️
   - Risk from integrating AI agent with existing systems
   - Evaluates integration points and isolation measures

6. **Compliance & Governance** ⚖️
   - Risk of non-compliance with regulations and policies
   - Addresses regulatory requirements and governance frameworks

## Risk Tiers

| Tier | Score Range | Severity | Action Required |
|------|-------------|----------|-----------------|
| **Critical** | 81-100 | 🔴 Critical | Immediate action required - Do not deploy |
| **High** | 61-80 | 🟠 High | Comprehensive review and controls needed |
| **Medium** | 41-60 | 🟡 Medium | Address identified areas before deployment |
| **Low** | 21-40 | 🟢 Low | Standard security practices sufficient |
| **Minimal** | 0-20 | 🔵 Minimal | Proceed with standard monitoring |

## How to Use

### Getting Started

1. **Open the Application**: Open `index.html` in a web browser
2. **Review Categories**: Read through the six threat categories
3. **Score Each Category**: Use the slider for each category to rate the risk (0-100)
4. **View Results**: See real-time updates to:
   - Overall Risk Score
   - Risk Tier classification
   - Tailored recommendations

### Scoring Guidelines

- **0-20 (Minimal Risk)**: Threat is well-controlled or non-existent
- **21-40 (Low Risk)**: Threat exists but is manageable with standard controls
- **41-60 (Medium Risk)**: Threat requires attention and additional controls
- **61-80 (High Risk)**: Significant threat requiring comprehensive remediation
- **81-100 (Critical Risk)**: Severe threat requiring immediate attention

### Interpreting Results

1. **Overall Risk Score**: Average of all category scores
2. **Risk Tier**: Classification based on overall score
3. **Recommendations**: Specific actions for each high-risk category
4. **Progress Bar**: Visual representation of risk level

### Exporting Reports

1. Click the **"Export Report"** button
2. A formatted report will be generated with:
   - Assessment timestamp
   - All category scores and risk tiers
   - Comprehensive recommendations
   - Professional formatting
3. Print or save the report for documentation

### Resetting the Scorecard

Click the **"Reset"** button to clear all scores and start a new assessment.

## File Structure

```
├── index.html          # Main HTML structure and form
├── styles.css          # Responsive CSS styling
├── script.js           # JavaScript logic for scoring and calculations
├── README.md           # This documentation file
└── image.png           # Design reference image
```

## Technical Details

### Built With
- **HTML5**: Semantic markup and form elements
- **CSS3**: Modern styling with CSS variables and Grid layout
- **Vanilla JavaScript**: No dependencies - pure JavaScript logic

### Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Key Features
- **Zero Dependencies**: Uses vanilla JavaScript - no frameworks or libraries required
- **Responsive Design**: Mobile-first approach with breakpoints for all screen sizes
- **Accessibility**: Semantic HTML and proper labeling
- **Performance**: Lightweight and fast-loading
- **Print Support**: Optimized styles for printing and PDF export

## License & Attribution

AI Agent Threat Modelling Scorecard © 2026 Code Institute

This assessment tool is provided as-is and should be reviewed by qualified security professionals.
Security recommendations based on Gen AI Security Project and [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
