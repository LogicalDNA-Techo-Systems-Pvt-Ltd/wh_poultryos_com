# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class GrowingCharges(Document):
	pass

import frappe


@frappe.whitelist()
def get_batch_rates(batch):
    if not batch:
        return {}

    feed_rate, medicine_rate, rate = frappe.db.get_value(
        "Broiler Batch",
        batch,
        ["feed_rate", "medicine_rate", "rate"]
    ) or (0, 0, 0)

    return {
        "feed_rate": feed_rate,
        "medicine_rate": medicine_rate,
        "rate": rate
    }
    
@frappe.whitelist()
def get_delivered_weights(batch):
    if not batch:
        return {"error": "Batch parameter is required."}

    # Fetch delivered weights and rates from Batch Selection
    delivered_weights = frappe.get_all(
        "Batch Selection",
        filters={"batch": batch},  
        fields=["rate", "weight"]
    )

    # Fetch feed costs from Daily Transaction and sum them
    feed_costs = frappe.get_all(
        "Broiler Daily Transaction",
        filters={"batch": batch},  
        fields=["feed_cost"]
    )

    # Sum up all feed costs
    total_feed_cost = sum(float(record.get("feed_cost", 0)) for record in feed_costs)

    return {
        "delivered_weights": delivered_weights,
        "feed_cost": total_feed_cost
    }



import frappe

@frappe.whitelist()
def get_scheme_with_child(scheme_name):
    # Fetch the parent scheme with child table details
    scheme = frappe.get_doc('Scheme Management', scheme_name)

    if scheme:
        # Prepare response with both parent and child data
        return {
            'scheme': scheme.as_dict(),
            'cost_details': [child.as_dict() for child in scheme.cost_detail]  # Fetch child table records
        }
    else:
        return {
            'error': 'Scheme not found'
        }


@frappe.whitelist()
def get_batch_cost(batch):
    try:
        # Fetch quantity and rate from Batch Selection doctype where batch field matches
        batch_data = frappe.get_value(
            "Batch Selection",  # Doctype name
            {"batch": batch},  # Filter condition: batch field equals the passed batch name
            ["quantity", "rate"]  # Fields to fetch
        )

        if batch_data:
            quantity, rate = batch_data
            
            if rate and quantity:
                batch_cost = rate * quantity
                return {"batch_cost": batch_cost}
            else:
                return {"batch_cost": 0, "error": "Rate or quantity not found."}
        else:
            return {"batch_cost": 0, "error": "Batch not found in Batch Selection."}
    
    except Exception as e:
        frappe.log_error(f"Error fetching batch cost: {str(e)}")
        return {"batch_cost": 0, "error": str(e)}
    
@frappe.whitelist()
def get_selling_rate(selling_rate):
    try:
        # Fetch incentive based on the given selling rate range
        incentive_doc = frappe.db.get_value(
            "Selling",
            {
                "from_selling_rate": ["<=", selling_rate],
                "to_selling_rate": [">=", selling_rate]
            },
            "incentive"
        )

        # If incentive is found, return it; otherwise, return 0
        return {"incentive": incentive_doc or 0}

    except Exception as e:
        frappe.log_error(f"Error fetching incentive: {str(e)}")
        return {"incentive": 0, "error": str(e)}
    

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


