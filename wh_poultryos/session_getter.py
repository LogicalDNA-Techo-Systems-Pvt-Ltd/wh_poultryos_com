import frappe


@frappe.whitelist(allow_guest=False)
def get_org_name_from_session():
    """Get organization name from session"""
    try:
        user = frappe.session.user
        print(f"Getting session for user: {user}")

        # Method 1: Try direct session access
        org_name = getattr(frappe.session, "org_name", None)
        print(f"Method 1 - frappe.session.org_name: {org_name}")

        if org_name:
            return {"success": True, "org_name": org_name}

        # Method 2: Try local session
        org_name = getattr(frappe.local.session, "org_name", None)
        print(f"Method 2 - frappe.local.session.org_name: {org_name}")

        if org_name:
            return {"success": True, "org_name": org_name}

        # Method 3: Try dictionary access
        org_name = frappe.session.get("org_name")
        print(f"Method 3 - frappe.session.get('org_name'): {org_name}")

        if org_name:
            return {"success": True, "org_name": org_name}

        # Method 4: Try cache
        org_name = frappe.cache().get_value(f"org_name:{user}")
        print(f"Method 4 - from cache: {org_name}")

        if org_name:
            return {"success": True, "org_name": org_name}

        # If nothing found, check if organization exists
        organization = frappe.get_all(
            "Organization",
            filters={"organization_owner": user},
            fields=["name"],
            limit=1,
        )
        print(f"Fallback - Found organization: {organization}")

        if organization:
            return {
                "success": True,
                "org_name": organization[0].name,
                "message": "Organization exists but not in session. Try setting it first.",
                "debug_info": {"user": user, "organization": organization[0]},
            }

        return {"success": False, "message": f"No organization found for user {user}"}

    except Exception as e:
        print(f"Error in get_org_name_from_session: {str(e)}")
        frappe.log_error(frappe.get_traceback(), "Session Getter Error")
        return {
            "success": False,
            "message": f"Failed to get organization from session: {str(e)}",
        }
