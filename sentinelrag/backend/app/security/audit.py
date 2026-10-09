from typing import Optional, Dict, Any
from app.database.supabase import supabase_client

class SecurityAuditLogger:
    @staticmethod
    def log_event(
        user_id: str, 
        event_type: str, 
        severity: str, 
        description: str, 
        document_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Log a security event to the security_events table.
        severity: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        """
        try:
            data = {
                "user_id": user_id,
                "event_type": event_type,
                "severity": severity,
                "description": description,
                "metadata": metadata or {}
            }
            if document_id:
                data["document_id"] = document_id
                
            supabase_client.table("security_events").insert(data).execute()
        except Exception as e:
            # In production, we'd fall back to a local log file if DB fails
            print(f"Failed to log security event: {e}")

    @staticmethod
    def log_audit(
        user_id: str,
        action: str,
        resource_type: str,
        status: str,
        resource_id: Optional[str] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Log an action to the audit_logs table.
        status: 'SUCCESS', 'DENIED', 'ERROR'
        """
        try:
            data = {
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "status": status,
                "metadata": metadata or {}
            }
            if resource_id:
                data["resource_id"] = resource_id
            if reason:
                data["reason"] = reason

            supabase_client.table("audit_logs").insert(data).execute()
        except Exception as e:
            print(f"Failed to log audit event: {e}")
