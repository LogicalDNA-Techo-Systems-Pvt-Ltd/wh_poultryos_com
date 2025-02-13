import frappe
from frappe import _
from frappe.utils import escape_html

# Convert MODULE_ROLE_MAPPING keys to lowercase
MODULE_ROLE_MAPPING = {
    "broiler": ["Broiler Farm Owner"],
    "layer": ["Layer Farm Owner"],
    "breeder": ["Breeder Farm Owner"],
    "hatchery": ["Hatchery Farm Owner"],
    "feed mill": ["Feed Mill Farm Owner"],
}


@frappe.whitelist(allow_guest=True)
def get_modules():
    """Fetch available modules from user_modules doctype"""
    try:
        modules = frappe.get_all(
            "Module", fields=["name", "module_name"], order_by="module_name"
        )
        return modules
    except Exception as e:
        frappe.local.response.http_status_code = 500
        return {"message": str(e), "success": False}


@frappe.whitelist()
def setup_organization():
    try:
        data = frappe.request.get_json()

        # Validate required fields
        required_fields = ["organization_name", "address", "city", "state", "modules"]
        for field in required_fields:
            if not data.get(field):
                frappe.throw(_(f"{field.replace('_', ' ').title()} is required"))

        print(frappe.session.user)
        user = frappe.get_doc("User", frappe.session.user)
        print(user)
        # Create organization
        organization = frappe.get_doc(
            {
                "doctype": "Organization",
                "organization_name": escape_html(data.get("organization_name")),
                "address": escape_html(data.get("address")),
                "city": escape_html(data.get("city")),
                "state": escape_html(data.get("state")),
                "organization_owner": frappe.session.user,
            }
        )
        organization.insert(ignore_permissions=True)

        org_name = organization.name
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

        # Assign roles based on selected modules
        selected_modules = [
            module.lower() for module in data.get("modules")
        ]  # Convert selected modules to lowercase

        print(selected_modules)

        for module in selected_modules:
            print(module)
            if module in MODULE_ROLE_MAPPING:
                for role in MODULE_ROLE_MAPPING[module]:
                    print(role)
                    if role not in [
                        r.role for r in user.roles
                    ]:  # Prevent duplicate roles
                        user.append("roles", {"role": role})

        # Save the updated user document to apply the roles
        user.save(ignore_permissions=True)
        frappe.db.commit()

        # Determine redirect URL based on selected modules
        redirect_url = "/app/dashboard"  # Default redirect
        if len(selected_modules) == 1:
            module_pages = {
                "broiler": "/app/broiler",
                "layer": "/app/layer",
                "breeder": "/app/breeder",
                "hatchery": "/app/hatchery",
                "feed mill": "/app/feed-mill",
            }
            redirect_url = module_pages.get(selected_modules[0], redirect_url)

        return {
            "message": "Organization setup successful",
            "success": True,
            "redirect_url": redirect_url,
        }
    except Exception as e:
        frappe.db.rollback()
        frappe.local.response.http_status_code = 400
        return {"message": str(e), "success": False}
