import requests
import frappe
from frappe import _


@frappe.whitelist(
    allow_guest=True
)  # This allows guests (non-logged-in users) to call the API
def create_payment_order(amount_needed, batch_count):
    """Creates an order in Cashfree and returns the response."""
    try:
        # Call the function to create the Cashfree order
        result = frappe.get_attr("wh_poultryos.payment.create_cashfree_order")(
            amount_needed, batch_count
        )
        return result
    except Exception as e:
        frappe.log_error(f"Error while creating payment order: {str(e)}")
        return {"error": str(e)}
