#!/usr/bin/env python3
"""
Build script to copy necessary components to dist folder.

Usage:
    python build.py <mode> [options]

Modes:
    prod    Production build (one-time)
    dev     Development build (watch mode by default)

Options:
    --once  One-time build (dev mode only, skips watch)
    --zip   Create a zip file (prod mode only)

Examples:
    python build.py dev           # Start watching for changes
    python build.py dev --once    # One-time dev build
    python build.py prod          # One-time prod build
    python build.py prod --zip    # Prod build + create zip file

The script will minify and copy all necessary files to the dist/ directory.
For dev mode, changes to tracked files trigger automatic rebuilds.
"""

import shutil
import sys
import time
import json
import zipfile
from pathlib import Path
from typing import List, Dict, Callable
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import minify_html
import rcssmin
import rjsmin


# ANSI color codes
RED = "\033[91m"
RESET = "\033[0m"


def error(msg: str) -> None:
    """Print error message in red."""
    print(f"{RED}{msg}{RESET}")


class BuildAsset:
    """Represents a build asset (file or folder) to be copied."""

    def __init__(self, src: str, dst_name: str = None, is_dir: bool = False, minify: bool = False):
        self.src = Path(src)
        self.dst_name = dst_name or src
        self.is_dir = is_dir
        self.minify = minify

    def _minify_content(self, content: str) -> str:
        """Minify content based on file type."""
        if self.src.suffix == ".html":
            return minify_html.minify(content)
        elif self.src.suffix == ".css":
            return rcssmin.cssmin(content)
        elif self.src.suffix == ".js":
            return rjsmin.jsmin(content)
        return content

    def copy(self, dst_dir: Path) -> bool:
        """Copy asset to destination directory."""
        dst = dst_dir / self.dst_name
        if not self.src.exists():
            error(f"Warning: {self.src} not found")
            return False

        try:
            if self.is_dir:
                if dst.exists():
                    shutil.rmtree(dst)
                
                if self.minify:
                    self._copy_dir_with_minify(self.src, dst)
                else:
                    shutil.copytree(self.src, dst)
                print(f"-  Copied {self.src} to {dst}")
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                if self.minify:
                    with open(self.src, 'r', encoding='utf-8') as f:
                        content = f.read()
                    minified = self._minify_content(content)
                    with open(dst, 'w', encoding='utf-8') as f:
                        f.write(minified)
                    print(f"-  Minified and copied {self.src} to {dst}")
                else:
                    shutil.copy2(self.src, dst)
                    print(f"-  Copied {self.src} to {dst}")
            return True
        except Exception as e:
            error(f"Error copying {self.src}: {e}")
            return False

    def _copy_dir_with_minify(self, src: Path, dst: Path) -> None:
        """Recursively copy directory, minifying CSS and JS files."""
        dst.mkdir(parents=True, exist_ok=True)
        
        for item in src.iterdir():
            dst_item = dst / item.name
            
            if item.is_dir():
                self._copy_dir_with_minify(item, dst_item)
            else:
                if item.suffix in ['.css', '.js']:
                    # Minify CSS and JS files
                    with open(item, 'r', encoding='utf-8') as f:
                        content = f.read()
                    minified = self._minify_content_for_file(item, content)
                    dst_item.parent.mkdir(parents=True, exist_ok=True)
                    with open(dst_item, 'w', encoding='utf-8') as f:
                        f.write(minified)
                else:
                    # Copy other files as-is
                    dst_item.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(item, dst_item)

    def _minify_content_for_file(self, file_path: Path, content: str) -> str:
        """Minify content based on file type."""
        if file_path.suffix == ".css":
            return rcssmin.cssmin(content)
        elif file_path.suffix == ".js":
            return rjsmin.jsmin(content)
        return content


class BuildConfig:
    """Configuration for build targets."""

    def __init__(self, name: str, assets: List[BuildAsset]):
        self.name = name
        self.assets = assets

    def build(self, output_dir: Path) -> None:
        """Execute build for this target."""
        print(f"\nBuilding {self.name}...")
        target_dir = output_dir / self.name
        target_dir.mkdir(parents=True, exist_ok=True)

        for asset in self.assets:
            asset.copy(target_dir)

        print(f"-  {self.name} build complete")


class FileChangeHandler(FileSystemEventHandler):
    """Handles file system events for dev mode."""

    def __init__(self, build_config: BuildConfig, output_dir: Path):
        self.build_config = build_config
        self.output_dir = output_dir
        self.src_paths = {asset.src for asset in build_config.assets}
        self.last_update = time.time()

    def _should_rebuild(self, path: Path) -> bool:
        """Check if this path matches any build assets."""
        path = Path(path).resolve()
        for asset in self.build_config.assets:
            asset_src = asset.src.resolve()
            try:
                # Check if path is the asset itself or within it
                if path == asset_src or (asset_src.is_dir() and path.is_relative_to(asset_src)):
                    return True
            except ValueError:
                continue
        return False

    def on_modified(self, event):
        """Handle file modification."""
        if not self._should_rebuild(event.src_path):
            return

        # Debounce rapid changes
        current_time = time.time()
        if current_time - self.last_update < 0.5:
            return
        self.last_update = current_time

        print(f"🔄 Detected change: {event.src_path}")
        self.build_config.build(self.output_dir)


def get_build_configs() -> Dict[str, BuildConfig]:
    """Define build configurations."""
    assets = [
        BuildAsset("manifest.json"),
        BuildAsset("favicons", is_dir=True),
        BuildAsset("index.html", minify=True),
        BuildAsset("main.js", minify=True),
        BuildAsset("art.js", minify=True),
        BuildAsset("defaultSettings.js", minify=True),
        BuildAsset("utils.js", minify=True),
        BuildAsset("style.css", minify=True),
        BuildAsset("options.html", minify=True),
        BuildAsset("options.js", minify=True),
        BuildAsset("components", is_dir=True, minify=True),
        BuildAsset("widgets", is_dir=True, minify=True),
    ]

    return {
        "prod": BuildConfig("prod", assets),
        "dev": BuildConfig("dev", assets),
    }


def build(mode: str) -> None:
    """Execute build for specified mode."""
    configs = get_build_configs()

    if mode not in configs:
        error(f"Unknown mode: {mode}")
        error(f"Available modes: {', '.join(configs.keys())}")
        sys.exit(1)

    dist_dir = Path("dist")
    dist_dir.mkdir(exist_ok=True)

    config = configs[mode]
    config.build(dist_dir)


def get_version() -> str:
    """Extract version from manifest.json."""
    try:
        with open("manifest.json", "r", encoding="utf-8") as f:
            manifest = json.load(f)
        return manifest.get("version", "1.0.0")
    except Exception as e:
        error(f"Error reading manifest.json: {e}")
        return "1.0.0"


def zip_build(mode: str) -> None:
    """Zip the built directory."""
    if mode != "prod":
        error("Zipping is only available for prod mode")
        sys.exit(1)

    dist_dir = Path("dist")
    build_dir = dist_dir / mode

    if not build_dir.exists():
        error(f"Build directory {build_dir} not found. Run build first.")
        sys.exit(1)

    version = get_version()
    zip_filename = f"minimal_newtab_v{version}.zip"
    zip_path = dist_dir / zip_filename

    try:
        # Remove existing zip if it exists
        if zip_path.exists():
            zip_path.unlink()

        # Create zip file
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file in build_dir.rglob("*"):
                if file.is_file():
                    arcname = file.relative_to(build_dir)
                    zipf.write(file, arcname)

        print(f"-  Created {zip_filename}")
    except Exception as e:
        error(f"Error creating zip: {e}")
        sys.exit(1)


def watch(mode: str) -> None:
    """Watch for file changes and rebuild in dev mode."""
    configs = get_build_configs()
    dist_dir = Path("dist")
    dist_dir.mkdir(exist_ok=True)

    config = configs[mode]

    # Initial build
    config.build(dist_dir)

    # Set up file watcher
    event_handler = FileChangeHandler(config, dist_dir)
    observer = Observer()
    observer.schedule(event_handler, path=".", recursive=True)
    observer.start()

    print(f"\nWatching for changes in {mode} mode (Press Ctrl+C to stop)...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n-  dev mode stopped")

    observer.join()


def main() -> None:
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python build.py <mode> [--once] [--zip]")
        print("Modes: prod, dev")
        print("Options:")
        print("  --once (one-time build, only for dev mode)")
        print("  --zip (create zip file, only for prod mode)")
        sys.exit(1)

    mode = sys.argv[1]
    once_mode = "--once" in sys.argv
    zip_mode = "--zip" in sys.argv

    if zip_mode and mode == "prod":
        # Build first, then zip
        build(mode)
        zip_build(mode)
    elif mode == "dev" and not once_mode:
        watch(mode)
    else:
        build(mode)


if __name__ == "__main__":
    main()
