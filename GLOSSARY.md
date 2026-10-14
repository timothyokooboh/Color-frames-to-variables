# Color Frames to Variables

A palette conversion tool that turns selected color swatches into native Figma color variables while preserving designer-defined names and paint values.

## Language

**Source layer**:
An explicitly selected Figma frame or rectangle whose name and fill supply a proposed color variable.

**Relative variable name**:
The source layer's name, or a designer-approved replacement, before any destination prefix is applied.

**Full variable path**:
The complete proposed variable name within its destination collection, including any destination prefix and slash-separated groups.

**Destination collection**:
The new or existing local Figma variable collection chosen to receive the color variables.

**Colors group**:
The slash-based hierarchy beginning with `Colors/` inside an existing destination collection.
_Avoid_: Nested collection

**Existing-variable conflict**:
A proposed full variable path that matches a variable already in the destination collection.

**Selection duplicate**:
Two or more source layers proposing the same full variable path in the destination collection.

**Paint alpha**:
The opacity of the source solid fill, distinct from the source layer's overall opacity.
