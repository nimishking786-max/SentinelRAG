from fastapi import Depends, HTTPException, status
from typing import List, Optional
from app.auth.auth import TokenData, get_current_user

class RBAC:
    @staticmethod
    def require_role(allowed_roles: List[str]):
        def role_checker(user: TokenData = Depends(get_current_user)):
            if user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="ACCESS DENIED: You do not have permission to perform this action."
                )
            return user
        return role_checker

    @staticmethod
    def can_access_document(user: TokenData, doc_department: str, doc_sensitivity: str, doc_allowed_roles: Optional[List[str]] = None) -> bool:
        if user.role == "ADMIN":
            return True

        allowed_roles = doc_allowed_roles or []

        # If document has explicit roles and the user is not in them
        if allowed_roles and "ALL" not in allowed_roles and user.role not in allowed_roles:
            return False

        if doc_sensitivity == "PUBLIC":
            return True

        # Basic departmental checks
        if doc_sensitivity in ["CONFIDENTIAL", "RESTRICTED"]:
            if user.role in ["HR_MANAGER", "FINANCE_MANAGER"]:
                # Managers can access their own department's confidential docs
                if user.department == doc_department:
                    return True
            return False # Regular employees or cross-dept managers cannot

        # INTERNAL documents can be accessed by same department
        if doc_sensitivity == "INTERNAL":
            return user.department == doc_department

        return False
