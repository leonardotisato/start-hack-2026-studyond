#!/usr/bin/env python3
"""Custom MCP server for the Studyond Brain knowledge graph."""

import re
from pathlib import Path

import mcp.server.stdio
import mcp.types as types
from mcp.server import Server

CONTEXT_DIR = Path(__file__).parent / "context"

app = Server("studyond-brain")


def _all_notes() -> dict[str, Path]:
    return {p.stem: p for p in CONTEXT_DIR.glob("*.md")}


def _resolve(name: str) -> Path | None:
    notes = _all_notes()
    if name in notes:
        return notes[name]
    name_lower = name.lower()
    for stem, path in notes.items():
        if stem.lower() == name_lower:
            return path
    return None


def _read_note(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _parse_frontmatter_tags(content: str) -> list[str]:
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return []
    fm = match.group(1)
    tags: list[str] = []
    in_tags = False
    for line in fm.splitlines():
        if line.strip() == "tags:":
            in_tags = True
        elif in_tags:
            m = re.match(r"\s+-\s+(.+)", line)
            if m:
                tags.append(m.group(1).strip())
            else:
                in_tags = False
    return tags


def _parse_wiki_links(content: str) -> list[str]:
    return re.findall(r"\[\[([^\]]+?)(?:\|[^\]]+)?\]\]", content)


@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="list_notes",
            description="List all note names in the Studyond Brain knowledge graph.",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="get_note",
            description="Get the full content of a note by name (without .md extension).",
            inputSchema={
                "type": "object",
                "properties": {"name": {"type": "string", "description": "Note name, e.g. 'Studyond' or 'Challenge Brief'"}},
                "required": ["name"],
            },
        ),
        types.Tool(
            name="get_linked_notes",
            description="Get names of all notes that a given note links to via [[wiki-links]].",
            inputSchema={
                "type": "object",
                "properties": {"name": {"type": "string", "description": "Note name to find outgoing links from"}},
                "required": ["name"],
            },
        ),
        types.Tool(
            name="list_by_tag",
            description="List all notes that have a specific frontmatter tag.",
            inputSchema={
                "type": "object",
                "properties": {"tag": {"type": "string", "description": "Tag to filter by, e.g. 'core'"}},
                "required": ["tag"],
            },
        ),
        types.Tool(
            name="search_notes",
            description="Search note contents for a keyword or phrase (case-insensitive).",
            inputSchema={
                "type": "object",
                "properties": {"query": {"type": "string", "description": "Search term"}},
                "required": ["query"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "list_notes":
        names = sorted(_all_notes().keys())
        return [types.TextContent(type="text", text="\n".join(names))]

    if name == "get_note":
        note_name = arguments["name"]
        path = _resolve(note_name)
        if path is None:
            return [types.TextContent(type="text", text=f"Note '{note_name}' not found.")]
        return [types.TextContent(type="text", text=_read_note(path))]

    if name == "get_linked_notes":
        note_name = arguments["name"]
        path = _resolve(note_name)
        if path is None:
            return [types.TextContent(type="text", text=f"Note '{note_name}' not found.")]
        content = _read_note(path)
        links = sorted(set(_parse_wiki_links(content)))
        if not links:
            return [types.TextContent(type="text", text="No outgoing links found.")]
        all_notes = _all_notes()
        result = []
        for link in links:
            exists = link in all_notes or any(s.lower() == link.lower() for s in all_notes)
            result.append(f"{'✓' if exists else '?'} {link}")
        return [types.TextContent(type="text", text="\n".join(result))]

    if name == "list_by_tag":
        tag = arguments["tag"].lower()
        matches = []
        for note_name, path in sorted(_all_notes().items()):
            content = _read_note(path)
            tags = [t.lower() for t in _parse_frontmatter_tags(content)]
            if tag in tags:
                matches.append(note_name)
        if not matches:
            return [types.TextContent(type="text", text=f"No notes found with tag '{tag}'.")]
        return [types.TextContent(type="text", text="\n".join(matches))]

    if name == "search_notes":
        query = arguments["query"].lower()
        matches = []
        for note_name, path in sorted(_all_notes().items()):
            content = _read_note(path)
            if query in content.lower():
                # find first matching line for context
                for line in content.splitlines():
                    if query in line.lower():
                        matches.append(f"{note_name}: {line.strip()[:100]}")
                        break
        if not matches:
            return [types.TextContent(type="text", text=f"No notes found matching '{query}'.")]
        return [types.TextContent(type="text", text="\n".join(matches))]

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
