# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class CustomSalesInvoice(Document):
	pass

import frappe
import json


@frappe.whitelist()
def get_total_weight(batches):
    """
    Fetch total weight for given batch names in 'Custom Sales Invoice'.
    
    :param batches: List of batch names (JSON formatted string)
    :return: Total weight sum
    """
    
    print(batches)    
        
    if not batches:
        return {"error": "Batches parameter is required."}

    try:
        # Convert JSON string to list if it's not already a list
        if isinstance(batches, str):
            import json
            batches = json.loads(batches)

        total_weight = 0  # Initialize total weight

        # # Loop through each batch and fetch its weight
        # for batch in batches:            
            
        #     batch_name = batch.get("batch")
        #     print(batch_name)
        #     weight_entry = frappe.get_value("Batch Selection", {"batch": batch_name}, "weight")
        #     print(weight_entry)
            
        #     # If weight exists, add it to total
        #     if weight_entry:
        #         total_weight += float(weight_entry) if weight_entry else 0

        # return {"total_weight": total_weight}
        
        batch_weights = []  # Dictionary to store batch names and their total weights

        # Loop through each batch and fetch its weight
        for batch in batches:            
            batch_name = batch.get("batch")
            print("Processing Batch:", batch_name)

            weight_entry = frappe.get_value("Batch Selection", {"batch": batch_name}, "weight")
            print("Weight:", weight_entry)

             # If weight exists, add it to the result list
            batch_weights.append({
                "batch_name": batch_name,
                "total_weight": float(weight_entry) if weight_entry else 0
            })

        return batch_weights

    except Exception as e:
        frappe.log_error(f"Error in get_total_weight: {str(e)}", "Batch Weight Fetch")
        return {"error": str(e)}
    

@frappe.whitelist()
def update_batch_quantities(batches):
    if not batches:
        return {"status": "error", "message": "No batches found in the invoice"}

    # ✅ Convert JSON string to Python list if needed
    if isinstance(batches, str):  
        try:
            batches = json.loads(batches)  # Convert string to list
        except json.JSONDecodeError:
            return {"status": "error", "message": "Invalid JSON format for batches"}

    if not isinstance(batches, list):
        return {"status": "error", "message": "Batches must be a list of dictionaries"}

    for batch in batches:
        if not isinstance(batch, dict):
            return {"status": "error", "message": "Invalid batch data format"}

        batch_id = batch.get("batch")
        quantity_sold = batch.get("quantity")
        batch_type = batch.get("type")  # "Bird" or "Culls"

        if not batch_id or quantity_sold is None:
            return {"status": "error", "message": "Batch ID or quantity missing"}

        # ✅ Determine which field to update based on type
        field_to_update = "live_quantity_number_of_birds" if batch_type == "Bird" else "culls"
        print(field_to_update)
        # ✅ Retrieve batch details safely
        batch_data = frappe.db.get_value("Broiler Batch", batch_id, 
                                         ["live_quantity_number_of_birds", "culls", "sale_quantity", "bird_cost", "biological_value"], 
                                         as_dict=True)

        if not batch_data:
            return {"status": "error", "message": f"Batch {batch_id} not found"}

        # ✅ Convert values properly
        current_quantity = int(batch_data.get(field_to_update) or 0)
        current_sale_quantity = int(batch_data.get("sale_quantity") or 0)
        bird_cost = float(batch_data.get("bird_cost") or 0.0)
        biological_value = float(batch_data.get("biological_value") or 0.0)
        liveQTY = int(batch_data.get("live_quantity_number_of_birds") or 0)


        # ✅ Check stock before processing
        if current_quantity >= quantity_sold:
            # 1️⃣ Deduct sold quantity from live batch
            new_quantity = current_quantity - quantity_sold
            frappe.db.set_value("Broiler Batch", batch_id, field_to_update, new_quantity)

            # 2️⃣ Update sale quantity
            new_sale_quantity = current_sale_quantity + quantity_sold
            frappe.db.set_value("Broiler Batch", batch_id, "sale_quantity", new_sale_quantity)

            # 3️⃣ Update biological value
            deducted_value = quantity_sold * bird_cost
            new_biological_value = max(biological_value - deducted_value, 0)  
            frappe.db.set_value("Broiler Batch", batch_id, "biological_value", new_biological_value)

            # 4️⃣ Recalculate bird cost
            new_bird_cost = (new_biological_value / new_quantity) if new_quantity > 0 else 0.0
            frappe.db.set_value("Broiler Batch", batch_id, "bird_cost", new_bird_cost)

            # ✅ Commit changes
            frappe.db.commit()
        else:
            return {"status": "error", "message": f"Insufficient stock for Batch {batch_id}"}

    return {"status": "success", "message": "Batch quantities updated successfully"}




