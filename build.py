#!/usr/bin/env python3
"""
Build script to copy necessary components to dist folder.
"""

import json
import shutil
import sys
import time
import zipfile
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import minify_html
import rcssmin
import rjsmin
from rich.console import Console
from rich.text import Text
from textual.app import App, ComposeResult
from textual.containers import Container, VerticalScroll
from textual.widgets import RichLog, Static
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class BuildAsset:
    def __init__(
        self, src: str, dst_name: Any = None, is_dir: bool = False, minify: bool = False
    ):
        self.src = Path(src)
        self.dst_name = dst_name or src
        self.is_dir = is_dir
        self.minify = minify

    def _minify_content(self, content: str) -> Any:
        """Minify content based on file type."""
        if self.src.suffix == ".html":
            return minify_html.minify(content)
        elif self.src.suffix == ".css":
            return rcssmin.cssmin(content)
        elif self.src.suffix == ".js":
            return rjsmin.jsmin(content)
        return content

    def copy(self, dst_dir: Path, log_fn: Callable[[str], None]) -> bool:
        dst = dst_dir / self.dst_name
        if not self.src.exists():
            log_fn(f"[red]Warning: {self.src} not found[/]")
            return False

        try:
            if self.is_dir:
                if dst.exists():
                    shutil.rmtree(dst)

                if self.minify:
                    self._copy_dir_with_minify(self.src, dst, log_fn)
                else:
                    shutil.copytree(self.src, dst)
                log_fn(f"-  Copied {self.src} to {dst}")
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                if self.minify:
                    with open(self.src, "r", encoding="utf-8") as f:
                        content = f.read()
                    minified = self._minify_content(content)
                    with open(dst, "w", encoding="utf-8") as f:
                        f.write(minified)
                    log_fn(f"-  Minified and copied {self.src} to {dst}")
                else:
                    shutil.copy2(self.src, dst)
                    log_fn(f"-  Copied {self.src} to {dst}")
            return True
        except Exception as e:
            log_fn(f"[red]Error copying {self.src}: {e}[/]")
            return False

    def _copy_dir_with_minify(
        self, src: Path, dst: Path, log_fn: Callable[[str], None]
    ) -> None:
        dst.mkdir(parents=True, exist_ok=True)
        for item in src.iterdir():
            dst_item = dst / item.name
            if item.is_dir():
                self._copy_dir_with_minify(item, dst_item, log_fn)
            else:
                if item.suffix in [".css", ".js"]:
                    with open(item, "r", encoding="utf-8") as f:
                        content = f.read()
                    minified = self._minify_content_for_file(item, content)
                    dst_item.parent.mkdir(parents=True, exist_ok=True)
                    with open(dst_item, "w", encoding="utf-8") as f:
                        f.write(minified)
                else:
                    dst_item.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(item, dst_item)

    def _minify_content_for_file(self, file_path: Path, content: str) -> Any:
        if file_path.suffix == ".css":
            return rcssmin.cssmin(content)
        elif file_path.suffix == ".js":
            return rjsmin.jsmin(content)
        return content


class BuildConfig:
    def __init__(self, name: str, assets: List[BuildAsset]):
        self.name = name
        self.assets = assets

    def build(self, output_dir: Path, log_fn: Callable[[str], None]) -> None:
        log_fn(f"\n[bold cyan]Building {self.name}...[/]")
        target_dir = output_dir / self.name
        target_dir.mkdir(parents=True, exist_ok=True)
        for asset in self.assets:
            asset.copy(target_dir, log_fn)
        log_fn(f"-  [bold green]{self.name} build complete[/]")


class FileChangeHandler(FileSystemEventHandler):
    def __init__(
        self, build_config: BuildConfig, output_dir: Path, log_fn: Callable[[str], None]
    ):
        self.build_config = build_config
        self.output_dir = output_dir
        self.log_fn = log_fn
        self.last_update = time.time()

    def _should_rebuild(self, path: Path) -> bool:
        path = Path(path).resolve()
        for asset in self.build_config.assets:
            asset_src = asset.src.resolve()
            try:
                if path == asset_src or (
                    asset_src.is_dir() and path.is_relative_to(asset_src)
                ):
                    return True
            except ValueError:
                continue
        return False

    def on_modified(self, event):
        if not self._should_rebuild(event.src_path):
            return
        current_time = time.time()
        if current_time - self.last_update < 0.5:
            return
        self.last_update = current_time
        self.log_fn(f"[yellow]Detected change: {event.src_path}[/]")
        self.build_config.build(self.output_dir, self.log_fn)


def get_build_configs() -> Dict[str, BuildConfig]:
    assets = [
        BuildAsset("src/assets/manifest.json", "manifest.json"),
        BuildAsset("src/pages/background.js", "pages/background.js"),
        BuildAsset("src/assets/favicons", dst_name="assets/favicons", is_dir=True),
        BuildAsset("src/pages/newtab", "pages/newtab", is_dir=True, minify=True),
        BuildAsset("src/pages/options", "pages/options", is_dir=True, minify=True),
        BuildAsset("src/components", "components", is_dir=True, minify=True),
        BuildAsset("src/widgets", "widgets", is_dir=True, minify=True),
        BuildAsset("src/shared", "shared", is_dir=True, minify=True),
    ]
    return {"prod": BuildConfig("prod", assets), "dev": BuildConfig("dev", assets)}


def build(mode: str, log_fn: Callable[[str], None]) -> None:
    configs = get_build_configs()
    if mode not in configs:
        log_fn(f"[red]Unknown mode: {mode}[/]")
        sys.exit(1)
    dist_dir = Path("dist")
    dist_dir.mkdir(exist_ok=True)
    configs[mode].build(dist_dir, log_fn)


def get_version() -> str:
    try:
        with open("src/assets/manifest.json", "r") as f:
            return json.load(f).get("version", "1.0.0")
    except:
        return "1.0.0"


def zip_build(mode: str, log_fn: Callable[[str], None]) -> None:
    if mode != "prod":
        log_fn(f"[red]Zipping is only available for prod mode[/]")
        sys.exit(1)
    dist_dir = Path("dist")
    build_dir = dist_dir / mode
    if not build_dir.exists():
        log_fn(f"[red]Build directory not found. Run build first.[/]")
        sys.exit(1)
    version = get_version()
    zip_path = dist_dir / f"minimal_newtab_v{version}.zip"
    try:
        if zip_path.exists():
            zip_path.unlink()
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file in build_dir.rglob("*"):
                if file.is_file():
                    zipf.write(file, file.relative_to(build_dir))
        log_fn(f"-  [bold]Created minimal_newtab_v{version}.zip[/]")
    except Exception as e:
        log_fn(f"[red]Error creating zip: {e}[/]")
        sys.exit(1)


class BuildApp(App):
    CSS = """
    Screen { background: $surface; }
    #header-bar { dock: top; height: 1; layout: horizontal; }
    #header-title { width: 70%; content-align: left middle; }
    #header-mode { width: 30%; content-align: right middle; }
    #footer-bar { dock: bottom; height: 1; layout: horizontal; }
    #footer-hint { width: 100%; content-align: left middle; }
    #log-panel { border: solid $border; border-title-style: bold; border-title-color: $accent; }
    """

    BINDINGS = [("q", "quit", "Quit")]

    def __init__(self, mode: str, once_mode: bool = False, zip_mode: bool = False):
        super().__init__()
        self.mode = mode
        self.once_mode = once_mode
        self.zip_mode = zip_mode
        self.observer = None

    def compose(self) -> ComposeResult:
        yield Container(
            Static("Minimal New Tab", id="header-title"),
            Static(f"Build Mode - {self.mode}", id="header-mode"),
            id="header-bar",
        )
        yield Container(VerticalScroll(RichLog(id="log-panel", markup=True)))
        yield Container(Static("Press q to quit", id="footer-hint"), id="footer-bar")

    def on_mount(self) -> None:
        self.sub_title = "Press q to quit"
        header_mode = self.query_one("#header-mode", Static)
        header_mode.styles.color = "green"
        self.log_panel = self.query_one("#log-panel", RichLog)
        self.log_panel.auto_scroll = True
        self.set_timer(0.1, self._run_build)

    def _run_build(self) -> None:
        log_panel = self.log_panel

        def log(msg: str) -> None:
            ts = datetime.now().strftime("%H:%M:%S")
            log_panel.write(ts + " " + msg)

        if self.zip_mode and self.mode == "prod":
            log("[bold cyan]Starting build in prod mode with zip...[/]")
            build(self.mode, log)
            zip_build(self.mode, log)
        elif self.mode == "dev" and not self.once_mode:
            log("[bold cyan]Starting build in dev mode (watch mode)...[/]")
            self.run_watch(log)
        else:
            log(f"[bold cyan]Starting build in {self.mode} mode...[/]")
            build(self.mode, log)

    def run_watch(self, log: Callable[[str], None]) -> None:
        configs = get_build_configs()
        dist_dir = Path("dist")
        dist_dir.mkdir(exist_ok=True)
        config = configs[self.mode]
        config.build(dist_dir, log)
        event_handler = FileChangeHandler(config, dist_dir, log)
        self.observer = Observer()
        self.observer.schedule(event_handler, path=".", recursive=True)
        self.observer.start()
        log(f"\n[bold]Watching for changes in {self.mode} mode...[/]")

    def on_key(self, event) -> None:
        if event.key == "ctrl_c":
            if self.observer:
                self.observer.stop()
            self.exit()


def main():
    if len(sys.argv) < 2:
        print("Usage: python build.py <mode> [--once] [--zip]")
        print("Modes: prod, dev")
        sys.exit(1)

    mode = sys.argv[1]
    once_mode = "--once" in sys.argv
    zip_mode = "--zip" in sys.argv

    if mode == "prod":
        console = Console(force_terminal=True)

        def log(msg: str):
            console.print(Text.from_markup(msg))

        console.print(Text.from_markup("[bold cyan]Starting build in prod mode...[/]"))
        build(mode, log)
        if zip_mode:
            zip_build(mode, log)
    else:
        app = BuildApp(mode, once_mode, zip_mode)
        app.run()


if __name__ == "__main__":
    main()
