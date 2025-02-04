# Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe

class Batch(Document):
	pass

def before_insert(doc, method):
    # Fetch the current token count
    settings = frappe.get_single("Demo Batch Settings")  # Assuming Demo Batch Settings DocType exists
    if settings.count <= 0:
        frappe.throw("Demo batch count is 0. Please purchase a token to add a new batch.")
    
    # Deduct one token for batch creation
    settings.count -= 1
    settings.save()

    frappe.msgprint("Batch token used. Please purchase more tokens if required.")
    
@frappe.whitelist()
def update_batch_ready_for_sale(batch_name, ready_for_sale):
    """
    Update the ready_for_sale field in the Batch doctype.
    :param batch_name: Name of the batch to update
    :param ready_for_sale: Boolean (0 or 1) to update the status
    """
    if batch_name:
        frappe.db.set_value("Batch", batch_name, "ready_for_sale", ready_for_sale)
        frappe.db.commit()
        return {"status": "success", "message": f"Batch {batch_name} updated successfully"}
    
    return {"status": "error", "message": "Batch not found"}

