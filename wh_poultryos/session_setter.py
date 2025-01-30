import frappe


@frappe.whitelist(allow_guest=False)
def set_org_name_in_session():
    """Set organization name in session for current user"""
    try:
        user = frappe.session.user
        print(f"Setting session for user: {user}")

        # Debug: Print all organizations
        all_orgs = frappe.get_all(
            "Organization", fields=["name", "organization_name", "organization_owner"]
        )
        print(f"All organizations: {all_orgs}")

        # Get organization for current user
        organization = frappe.get_all(
            "Organization",
            filters={"organization_owner": user},
            fields=["name", "organization_name", "organization_owner"],
            limit=1,
        )
        print(f"Found organization for user: {organization}")

        if not organization:
            print(f"No organization found for user {user}")
            return {
                "success": False,
                "message": f"No organization found for user {user}",
            }

        org_name = organization[0].name
        print(f"Setting org_name to: {org_name}")

        # Method 1: Set directly in session
        frappe.session.org_name = org_name
        print(
            f"After setting - frappe.session.org_name: {getattr(frappe.session, 'org_name', None)}"
        )

        # Method 2: Set in local session
        frappe.local.session.org_name = org_name
        print(
            f"After setting - frappe.local.session.org_name: {getattr(frappe.local.session, 'org_name', None)}"
        )

        # Method 3: Try setting as dictionary
        frappe.session["org_name"] = org_name
        print(
            f"After setting as dict - frappe.session.get('org_name'): {frappe.session.get('org_name')}"
        )

        # Method 4: Set in cache
        frappe.cache().set_value(f"org_name:{user}", org_name)
        print(f"Set in cache - org_name:{user}")

        frappe.db.commit()

        return {
            "success": True,
            "org_name": org_name,
            "message": "Organization set successfully",
            "debug_info": {"user": user, "organization": organization[0]},
        }

    except Exception as e:
        print(f"Error in set_org_name_in_session: {str(e)}")
        frappe.log_error(frappe.get_traceback(), "Session Setter Error")
        return {
            "success": False,
            "message": f"Failed to set organization in session: {str(e)}",
        }
