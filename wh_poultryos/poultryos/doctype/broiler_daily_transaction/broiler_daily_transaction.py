# Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document

class BroilerDailyTransaction(Document):
    pass

from datetime import datetime, timedelta

@frappe.whitelist()
def get_first_week_mortality(batch_name):
    """Fetches and returns the total mortality sum for the first 7 days of the given batch."""
    
    # Check if the batch exists
    batch_exists = frappe.db.exists("Broiler Batch", batch_name)

    if not batch_exists:
        frappe.throw(f"Batch '{batch_name}' not found!")

    batch_details = frappe.get_all(
        "Broiler Batch",
        filters={"name": batch_name},
        fields=["*"]  # Fetch all fields
    )   

    if batch_details:
        print(batch_details[0])  # Print batch details         
    
    batch_start_date = batch_details[0].opening_date  # Ensure this field exists       
    
    if not batch_start_date:
        frappe.throw("Placed On date is missing in the Broiler Batch")

    # Convert to date format
    if isinstance(batch_start_date, str):
        batch_start_date = batch_start_date
       

    # Calculate the end date (first 7 days)
    first_week_end = batch_start_date + timedelta(days=6)
   

    
    # Fetch the mortality sum for the first 7 days
    mortality_sum = frappe.db.sql("""
        SELECT SUM(mortality_number_of_birds) 
        FROM `tabBroiler Daily Transaction`
        WHERE batch = %s AND transaction_date BETWEEN %s AND %s
    """, (batch_name, batch_start_date, first_week_end))

    return mortality_sum[0][0] if mortality_sum and mortality_sum[0][0] else 0

@frappe.whitelist()
def update_batch_status(batch):
    if batch:  # Use the correct parameter name
        # Check the current status of the batch
        batch_status = frappe.db.get_value('Broiler Batch', batch, 'batch_status')
        
        # Update status ONLY if it's still 'New'
        if batch_status == "New":
            frappe.db.set_value('Broiler Batch', batch, 'batch_status', 'Batch Started')
            frappe.db.commit()
            
            return {"status": "success", "message": f"Batch {batch} updated successfully"}

    return {"status": "error", "message": "Batch not found or status not updated"}



def show_delete_message(doc, method):
    # Get mortality number of birds from the current document
    mortality_number_of_birds = doc.mortality_number_of_birds

    # If there is mortality number of birds, proceed
    if mortality_number_of_birds > 0:
        # Get the batch data using the batch identifier from the form
        batch = doc.batch
        batch_data = frappe.get_doc('Broiler Batch', batch)

        if batch_data and batch_data.live_quantity_number_of_birds is not None:
            batch_placed_quantity = batch_data.place_quantity_number_of_birds
            current_batch_live_quantity = batch_data.live_quantity_number_of_birds

            # Fetch all transactions related to the batch to calculate total mortality
            transactions = frappe.get_all(
                'Broiler Daily Transaction',
                filters={'batch': batch},
                fields=['mortality_number_of_birds'],
                order_by='transaction_date asc'  # Order by date (ascending)
            )

            if transactions:
                # Calculate total mortality from all transactions
                total_mortality = sum([transaction.mortality_number_of_birds or 0 for transaction in transactions])

                # Calculate updated live bird count
                updated_batch_live_quantity = batch_placed_quantity - total_mortality

                # Prevent updating if the live bird count goes negative
                if updated_batch_live_quantity < 0:
                    frappe.msgprint('Total Mortality cannot be greater than the placed quantity of birds.')
                    raise frappe.ValidationError  # Prevent document saving

                else:
                    # Update the batch with the new live bird count
                    batch_data.live_quantity_number_of_birds = updated_batch_live_quantity
                    batch_data.save()

                    frappe.msgprint('Live Birds Count has been updated.')

            else:
                frappe.msgprint('No transactions found for the specified batch.')
                raise frappe.ValidationError  # Prevent document saving

        else:
            frappe.msgprint('Batch data not found.')
            raise frappe.ValidationError  # Prevent document saving