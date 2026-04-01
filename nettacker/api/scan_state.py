"""
Shared state for tracking running scans across API and core modules.
This avoids circular imports between engine.py and app.py.
"""

from __future__ import annotations

from threading import Condition

# Global dictionary to track running scans
# Format: {scan_id: {'total_targets': int, 'total_modules': int, 'current_target': '', 'current_module': '', 'stop_requested': bool, 'status': str}}
running_scans = {}

# Change notification for real-time consumers (e.g., WebSocket handlers).
# We keep a monotonically increasing version number per scan_id.
_scan_versions = {}
_scan_state_changed = Condition()


def notify_scan_changed(scan_id: str) -> None:
    """Notify listeners that scan state/progress changed."""
    if not scan_id:
        return
    with _scan_state_changed:
        _scan_versions[scan_id] = _scan_versions.get(scan_id, 0) + 1
        _scan_state_changed.notify_all()


def get_scan_version(scan_id: str) -> int:
    """Get the current version counter for a scan_id."""
    if not scan_id:
        return 0
    with _scan_state_changed:
        return int(_scan_versions.get(scan_id, 0))


def wait_for_scan_change(scan_id: str, last_version: int, timeout: float = 30.0) -> int:
    """Block until scan version changes or timeout elapses.

    Returns the current version after waiting.
    """
    if not scan_id:
        return 0
    with _scan_state_changed:
        current = int(_scan_versions.get(scan_id, 0))
        if current != int(last_version):
            return current
        _scan_state_changed.wait(timeout=timeout)
        return int(_scan_versions.get(scan_id, 0))


def _to_count(value):
    """Coerce an int-or-sequence into a non-negative count."""
    if value is None:
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return max(0, value)
    try:
        return max(0, len(value))
    except Exception:
        return 0


def register_scan(scan_id, total_targets, total_modules):
    """Register a new scan in the tracker.

    Args:
        scan_id: Unique scan id
        total_targets: Either an int count or a target list/sequence
        total_modules: Either an int count or a module list/sequence
    """
    running_scans[scan_id] = {
        "total_targets": _to_count(total_targets),
        "total_modules": _to_count(total_modules),
        "current_target": "",
        "current_module": "",
        "stop_requested": False,
        "status": "running",
    }
    notify_scan_changed(scan_id)


def update_scan_info(scan_id, total_targets=None, total_modules=None):
    """Update the total targets and modules for a running scan"""
    if scan_id in running_scans:
        if total_targets is not None:
            running_scans[scan_id]["total_targets"] = _to_count(total_targets)
        if total_modules is not None:
            running_scans[scan_id]["total_modules"] = _to_count(total_modules)
        notify_scan_changed(scan_id)


def update_scan_progress(scan_id, current_target="", current_module=""):
    """Update the current target and module for a running scan"""
    if scan_id in running_scans:
        if current_target:
            running_scans[scan_id]["current_target"] = current_target
        if current_module:
            running_scans[scan_id]["current_module"] = current_module
        notify_scan_changed(scan_id)


def get_scan_info(scan_id):
    """Get current info for a scan"""
    return running_scans.get(scan_id, {})


def is_stop_requested(scan_id):
    """Check if a stop has been requested for this scan"""
    scan_info = running_scans.get(scan_id, {})
    return scan_info.get("stop_requested", False)


def unregister_scan(scan_id):
    """Remove a scan from tracking (when complete)"""
    if scan_id in running_scans:
        del running_scans[scan_id]
        notify_scan_changed(scan_id)


def set_scan_status(scan_id, status):
    """Set lifecycle status for a scan (running/completed/stopped/failed)."""
    if scan_id in running_scans and status:
        running_scans[scan_id]["status"] = str(status)
        notify_scan_changed(scan_id)

