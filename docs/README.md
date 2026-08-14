# CanadaLogin Architecture and Application Flow Diagrams

This folder contains the system design and architecture documentation for CanadaLogin.

For architecture diagrams, we have chosen to use draw.io (https://app.diagrams.net/), as it is a common industry standard tool.

For sequence and flow diagrams, we have chosen to use Mermaid for its simplicity and ability to commit diagrams as code.

## Mermaid Diagrams

### Using the Online Mermaid Editor

1. Go to [Mermaid Live Editor](https://mermaid.live/)
2. Copy the "diagram" value from any JSON file
3. Paste into the editor to see the visualization

### Using Mermaid in VS Code

1. The Mermaid extension is included in our devcontainer config
2. Create a markdown file
3. Paste the diagram code between triple backticks with mermaid tag
4. Use VS Code's markdown preview to view the diagram

### Using GitHub

The diagrams can be viewed directly in GitHub by creating a markdown file and using the mermaid syntax as described above.

## Diagram Updates

When making changes to the authentication flows, please update the corresponding diagram files to maintain accurate documentation.

## Implementation Notes

- Provincial partner DEV/DEV2 identity linking implementation and findings:
  [developer_guides/provincial-partner-dev-dev2-integration.md](developer_guides/provincial-partner-dev-dev2-integration.md)
- In-person identity verification code generation sequence (frontend -> backend -> idv-data-store):
  [developer_guides/idv_in_person_verification_flow.md](developer_guides/idv_in_person_verification_flow.md)
- Proposed central backend integration layer for idv-data-store:
  [developer_guides/idv_data_store_integration_layer.md](developer_guides/idv_data_store_integration_layer.md)
