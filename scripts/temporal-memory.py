#!/usr/bin/env python3
import os
import sys
import asyncio
import argparse
from pathlib import Path

# Try importing Graphiti and FalkorDB components
try:
    from graphiti_core import Graphiti
    from graphiti_core.driver.falkordb_driver import FalkorDriver
    from redislite import AsyncFalkorDB
    from graphiti_core.utils.maintenance.graph_data_operations import clear_data
except ImportError as e:
    print(f"Error: Required dependency is missing ({e}).", file=sys.stderr)
    print("Please run: pip install 'graphiti-core[falkordblite]'", file=sys.stderr)
    sys.exit(1)

# Ensure output directory exists
DB_DIR = Path("graphify-out")
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "temporal_memory.db"

# Check for LLM Keys (Graphiti requires an LLM with structured output, typically OpenAI)
if not os.environ.get("OPENAI_API_KEY"):
    print("Warning: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
    print("Graphiti relies on LLM structured output to process text. Operations might fail without it.", file=sys.stderr)

async def init_graphiti():
    """Initializes the FalkorDB embedded driver and Graphiti client."""
    db = AsyncFalkorDB(dbfilename=str(DB_PATH.resolve()))
    driver = FalkorDriver(falkor_db=db)
    graphiti = Graphiti(graph_driver=driver)
    
    # Auto-build indexes and constraints on first load
    try:
        await graphiti.build_indices_and_constraints()
    except Exception:
        # Might already exist
        pass
        
    return graphiti, driver

async def add_episode(text: str):
    """Adds a fact/context episode to the temporal graph."""
    print(f"Ingesting memory to temporal graph: '{text}'...")
    graphiti, driver = await init_graphiti()
    try:
        await graphiti.add_episode(name=text, episode_body=text)
        print("Success: Episode added to temporal memory.")
    except Exception as e:
        print(f"Error adding episode: {e}", file=sys.stderr)

async def query_memory(query_text: str):
    """Queries the temporal memory graph for context."""
    print(f"Searching temporal memory for: '{query_text}'...")
    graphiti, driver = await init_graphiti()
    try:
        results = await graphiti.search(query_text)
        if not results:
            print("No matching memories found.")
            return
            
        print("\n=== MATCHING MEMORIES ===")
        for idx, res in enumerate(results, 1):
            print(f"{idx}. {res}")
    except Exception as e:
        print(f"Error querying graph: {e}", file=sys.stderr)

async def clear_graph():
    """Wipes the local memory database clean."""
    print("Resetting temporal memory database...")
    graphiti, driver = await init_graphiti()
    try:
        await clear_data(graphiti.driver)
        print("Success: Database wiped clean.")
    except Exception as e:
        print(f"Error wiping database: {e}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(
        description="Graphiti Local Agent Memory CLI helper (Temporal Knowledge Graph)"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 'add' command
    add_parser = subparsers.add_parser("add", help="Add a text memory/episode to the graph")
    add_parser.add_argument("text", type=str, help="Text description of the developer decision or log")

    # 'query' command
    query_parser = subparsers.add_parser("query", help="Search the temporal memory graph")
    query_parser.add_argument("query", type=str, help="Search terms or question")

    # 'clear' command
    subparsers.add_parser("clear", help="Clear all stored memory in the database")

    args = parser.parse_args()

    if args.command == "add":
        asyncio.run(add_episode(args.text))
    elif args.command == "query":
        asyncio.run(query_memory(args.query))
    elif args.command == "clear":
        asyncio.run(clear_graph())

if __name__ == "__main__":
    main()
