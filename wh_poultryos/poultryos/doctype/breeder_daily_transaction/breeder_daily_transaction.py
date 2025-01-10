# Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document

class BreederDailyTransaction(Document):
    pass

def show_delete_message(doc, method):
    # Get mortality number of birds from the current document
    mortality_number_of_birds = doc.mortality_number_of_birds

    # If there is mortality number of birds, proceed
    if mortality_number_of_birds > 0:
        # Get the batch data using the batch identifier from the form
        batch = doc.batch
        batch_data = frappe.get_doc('Batch', batch)

        if batch_data and batch_data.live_quantity_number_of_birds is not None:
            batch_placed_quantity = batch_data.place_quantity_number_of_birds
            current_batch_live_quantity = batch_data.live_quantity_number_of_birds

            # Fetch all transactions related to the batch to calculate total mortality
            transactions = frappe.get_all(
                'Breeder Daily Transaction',
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