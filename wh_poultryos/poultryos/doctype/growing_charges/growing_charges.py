# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class GrowingCharges(Document):
	pass

import frappe

@frappe.whitelist()
def get_delivered_weights(batch):
    if not batch:
        return {"error": "Batch parameter is required."}

    # Fetch all child records where the batch matches
    delivered_weights = frappe.get_all(
        "Batch Selection",
        filters={"batch": batch},  # Adjust field name if needed
        fields=["rate", "weight"]
    )

    return delivered_weights


import frappe

@frappe.whitelist()
def get_available_batches():
    # Get batches that already exist in Growing Charges
    used_batches = frappe.get_all("Growing Charges", fields=["batch"])
    used_batch_names = [batch["batch"] for batch in used_batches]

    # Fetch batches that are not used in Growing Charges
    available_batches = frappe.get_all(
        "Broiler Batch",
        filters={"name": ["not in", used_batch_names]},
        fields=["name", "batch_name"]
    )

    return available_batches

@frappe.whitelist()
def update_batches(batch, status):
    """
    Update the ready_for_sale field in the Batch doctype.
    :param batch_name: Name of the batch to update
    :param ready_for_sale: Boolean (0 or 1) to update the status
    """
    if batch:
        frappe.db.set_value("Broiler Batch", batch, "gc_calculated", status)
        frappe.db.commit()
        return {"status": "success", "message": f"Batch {batch} updated successfully"}
    
    return {"status": "error", "message": "Batch not found"}


