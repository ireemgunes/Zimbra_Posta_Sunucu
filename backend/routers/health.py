from fastapi import APIRouter, Request, Depends
from system_monitor import monitor
from security_core import RoleChecker

router = APIRouter()


@router.get("/")
async def get_health(
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    """Full system health snapshot with quota & resource threshold alerts."""
    settings = request.app.state.settings
    metrics = monitor.get_all_metrics()
    
    # Calculate Quota & Resource Usage Alarms
    disk_pct = metrics.get('disk', {}).get('percent', 0.0)
    cpu_pct = metrics.get('cpu', {}).get('total_percent', 0.0)
    mem_pct = metrics.get('memory', {}).get('percent', 0.0)

    alerts = []
    if disk_pct >= settings.quota_critical_threshold_pct:
        alerts.append({"level": "CRITICAL", "message": f"Storage volume at {disk_pct}% capacity! Urgent cleanup needed."})
    elif disk_pct >= settings.quota_alert_threshold_pct:
        alerts.append({"level": "WARNING", "message": f"Storage volume reached {disk_pct}% quota limit."})

    if mem_pct >= 90.0:
        alerts.append({"level": "WARNING", "message": f"High memory allocation: {mem_pct}% utilized."})

    return {
        **metrics,
        "resource_alerts": alerts,
        "quota_threshold_pct": settings.quota_alert_threshold_pct,
        "status": "warning" if alerts else "healthy"
    }


@router.get("/cpu")
async def get_cpu(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return monitor.get_cpu_metrics()


@router.get("/memory")
async def get_memory(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return monitor.get_memory_metrics()


@router.get("/disk")
async def get_disk(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return monitor.get_disk_metrics()


@router.get("/network")
async def get_network(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return monitor.get_network_metrics()


@router.get("/processes")
async def get_processes(
    limit: int = 10,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    return {"processes": monitor.get_top_processes(min(limit, 50))}


@router.get("/uptime")
async def get_uptime(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return monitor.get_uptime()

