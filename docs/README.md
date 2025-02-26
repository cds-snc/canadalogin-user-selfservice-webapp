# Authentication Flow Diagrams

This folder contains sequence diagrams for various authentication flows in the application. The diagrams are stored in JSON format and can be rendered using Mermaid.

## Available Flows
1. Password Sign-in (`mermaid-password-signin.json`)
2. Passkey Sign-in (`mermaid-passkey-signin.json`)
3. Password Sign-up (`mermaid-password-signup.json`)
4. MFA Sign-up (`mermaid-mfa-signup.json`)
5. Passkey Registration (`mermaid-passkey-signup.json`)

## How to View

### Using Online Mermaid Editor
1. Go to [Mermaid Live Editor](https://mermaid.live/)
2. Copy the "diagram" value from any JSON file
3. Paste into the editor to see the visualization

### Using VS Code
1. Install "Markdown Preview Mermaid Support" extension
2. Create a markdown file
3. Paste the diagram code between triple backticks with mermaid tag:   ```mermaid
   // paste diagram here   ```
4. Use VS Code's markdown preview to view the diagram

### Using GitHub
The diagrams can be viewed directly in GitHub by creating a markdown file and using the mermaid syntax as described above.

## Diagram Updates
When making changes to the authentication flows, please update the corresponding diagram files to maintain accurate documentation. 