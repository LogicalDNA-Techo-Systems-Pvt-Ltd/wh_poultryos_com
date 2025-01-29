import frappe
from frappe import _
from frappe.utils import (
    cint,
    escape_html,
    flt,
    format_datetime,
    get_formatted_email,
    get_system_timezone,
    has_gravatar,
    now_datetime,
    today,
)


@frappe.whitelist(allow_guest=True)
def register():
    try:
        # Get the request data
        data = frappe.request.get_json()

        # Validate required fields
        required_fields = ["email", "full_name", "phone", "password"]
        for field in required_fields:
            if not data.get(field):
                frappe.throw(_(f"{field.replace('_', ' ').title()} is required"))

        # Check if user already exists
        if frappe.db.exists("User", {"email": data.get("email")}):
            frappe.throw(_("Email already registered"))

        # Create new user
        user = frappe.get_doc(
            {
                "doctype": "User",
                "email": data.get("email"),
                "first_name": escape_html(data.get("full_name")),
                "mobile_no": data.get("phone"),
                "new_password": data.get("password"),
                "send_welcome_email": 0,
                "user_type": "System User",
            }
        )

        user.insert(ignore_permissions=True)

		# set default signup role as per Portal Settings
        default_role = frappe.db.get_single_value("Portal Settings", "default_role")
        if default_role:
            user.add_roles(default_role)
        frappe.db.commit()

        frappe.local.login_manager.login_as(data.get("email"))
        
        return {"message": "Registration successful", "success": True}
    except Exception as e:
        frappe.db.rollback()
        frappe.local.response.http_status_code = 400
        return {"message": str(e), "success": False}
