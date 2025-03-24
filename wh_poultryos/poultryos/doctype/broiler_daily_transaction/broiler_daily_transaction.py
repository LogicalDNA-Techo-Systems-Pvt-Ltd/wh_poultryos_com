# broiler_daily_transaction.py
from frappe import _
import frappe
from frappe.model.document import Document
from datetime import datetime, timedelta

class BroilerDailyTransaction(Document):
    def validate(self):
        
        self.calculate_totals()        
        self.calculate_mortality_stats()
        self.calculate_weight_stats()
        self.calculate_consumption_stats()
        # # Update batch statistics after all calculations
        # self.update_batch_statistics()

    def calculate_totals(self):
        
        # Calculate mortality and cull quantities
        self.total_mortality_qty = (
            sum(
                [
                    d.qty
                    for d in self.mortality_details
                    if d.transaction_type == "Mortality"
                ]
            )
            or 0
        )
        frappe.msgprint(f"total_mortality_qty: {self.total_mortality_qty}")
        
        self.total_cull_qty = (
            sum([float(d.qty or 0) for d in self.mortality_details if d.transaction_type == "Cull"])
            or 0
        )
       
        
        
        # Calculate mortality and cull costs
        
        self.total_mortality_cost = (
            sum(
                [
                    float(d.cost or 0)
                    for d in self.mortality_details
                    if d.transaction_type == "Mortality"
                ]
            )
            or 0
        )
        frappe.msgprint(f"total_mortality_cost: {self.total_mortality_cost}")
        
        self.total_cull_cost = (
            sum(
                [float(d.cost or 0) for d in self.mortality_details if d.transaction_type == "Cull"]
            )
            or 0
        )

        # Calculate feed consumption
        self.actual_total_feed_consumption = (
            sum(
                [
                    d.consumption_qty
                    for d in self.consumption_details
                    if d.consumption_type == "Feed"
                ]
            )
            or 0
        )
        frappe.msgprint(f"actual_total_feed_consumption: {self.actual_total_feed_consumption}")
        
        # Calculate consumption costs
        self.total_feed_cost = (
            sum(
                [
                    d.consumption_cost
                    for d in self.consumption_details
                    if d.consumption_type == "Feed"
                ]
            )
            or 0
        )
        frappe.msgprint(f"total_feed_cost: {self.total_feed_cost}")
        
        self.total_medicine_cost = (
            sum(
                [
                    d.consumption_cost
                    for d in self.consumption_details
                    if d.consumption_type == "Medicine"
                ]
            )
            or 0
        )
      
        self.total_vaccine_cost = (
            sum(
                [
                    d.consumption_cost
                    for d in self.consumption_details
                    if d.consumption_type == "Vaccine"
                ]
            )
            or 0
        )
    
        self.total_vitamin_cost = (
            sum(
                [
                    d.consumption_cost
                    for d in self.consumption_details
                    if d.consumption_type == "Vitamin"
                ]
            )
            or 0
        )
       
        
        # Calculate total daily cost
        self.total_daily_cost = (
        (self.total_mortality_cost or 0) +
        (self.total_cull_cost or 0) +
        (self.total_feed_cost or 0) +
        (self.total_medicine_cost or 0) +
        (self.total_vaccine_cost or 0) +
        (self.total_vitamin_cost or 0)
        )
        frappe.msgprint(f"total_daily_cost: {self.total_daily_cost}")


    def calculate_mortality_stats(self):
        # Get batch details
        batch = frappe.get_doc("Broiler Batch", self.batch)

        # Calculate mortality percentages if place quantity exists
        if batch.place_quantity_number_of_birds:
            self.mortality_percentage = (
                self.total_mortality_qty / batch.place_quantity_number_of_birds
            ) * 100

            self.cull_percentage = (
                self.total_cull_qty / batch.place_quantity_number_of_birds
            ) * 100

        # Compare with standards (safely handle None values)
        self.standard_mortality = self.standard_mortality or 0
        self.standard_culls = self.standard_culls or 0

        self.mortality_variance = self.total_mortality_qty - self.standard_mortality
        self.cull_variance = self.total_cull_qty - self.standard_culls
      
    
    
    def calculate_weight_stats(self):
        # Ensure values are not None to avoid calculation errors
        self.actual_avg_bird_weight = self.actual_avg_bird_weight or 0
        self.standard_avg_bird_weight = self.standard_avg_bird_weight or 0

        # Calculate weight variance
        self.weight_variance = (
            self.actual_avg_bird_weight - self.standard_avg_bird_weight
        )

        # Calculate weight variance percentage (avoid division by zero)
        if self.standard_avg_bird_weight:
            self.weight_variance_percentage = (
                self.weight_variance / self.standard_avg_bird_weight * 100
            )
        else:
            self.weight_variance_percentage = 0
       

    def calculate_consumption_stats(self):
        # Ensure values are not None
        self.actual_total_feed_consumption = self.actual_total_feed_consumption or 0
        self.standard_total_feed_consumption = self.standard_total_feed_consumption or 0

        # Calculate feed consumption variance
        self.feed_consumption_variance = (
            self.actual_total_feed_consumption - self.standard_total_feed_consumption
        )

        # Calculate feed consumption variance percentage (avoid division by zero)
        if self.standard_total_feed_consumption:
            self.feed_consumption_variance_percentage = (
                self.feed_consumption_variance
                / self.standard_total_feed_consumption
                * 100
            )
        else:
            self.feed_consumption_variance_percentage = 0
     

    def update_batch_statistics(self):
        """Update batch statistics using the centralized API function"""
        try:
            from wh_poultryos.api import update_batch_stats

            result = update_batch_stats(self.batch, self.transaction_date)

            if result.get("success"):
                # Update local variables from the API response
               
                data = result.get("data", {})
                print("Data is", data)
                self.fcr = data.get("current_fcr", 0)
                self.eef = data.get("current_eef", 0)
                self.production_cost = data.get("production_cost", 0)

                frappe.msgprint(_("Batch statistics updated successfully"), alert=True)
            else:
                frappe.msgprint(
                    _("Warning: Failed to update batch statistics: {0}").format(
                        result.get("message", "Unknown error")
                    ),
                    alert=True,
                )
        except Exception as e:
            frappe.log_error(str(e), "Error updating batch statistics")
            frappe.msgprint(
                _("Error updating batch statistics. Please check the error log."),
                alert=True,
            )



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
        
        mortality_sum = frappe.db.sql("""
            SELECT SUM(md.qty) 
            FROM `tabBroiler Daily Transaction` AS bdt
            LEFT JOIN `tabBroiler Mortality Detail` AS md 
                ON md.parent = bdt.name
                AND md.transaction_type = 'Mortality'
            WHERE bdt.batch = %s 
            AND bdt.transaction_date BETWEEN %s AND %s
        """, (batch_name, batch_start_date, first_week_end))        
          
        return mortality_sum[0][0] if mortality_sum and mortality_sum[0][0] else 0 
    
@frappe.whitelist()
def update_first_week_mortality(batch_name, mortality_value):
    frappe.db.set_value("Broiler Batch", batch_name, "first_week_mortality", mortality_value, update_modified=False)
    frappe.db.commit()


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

@frappe.whitelist()
def scrap_batch(batch_name):
    try:
        # Fetch Broiler Batch details
        batch_doc = frappe.get_doc("Broiler Batch", batch_name)
        
        if batch_doc.batch_status == "Scrapped":
            return "Batch is already scrapped."

        # Calculate remaining live quantity
        # live_quantity = batch_doc.place_quantity_number_of_birds - (
        #     batch_doc.total_mortality_qty + batch_doc.total_cull_qty + batch_doc.sale_quantity
        # )
        
        live_quantity = batch_doc.live_quantity_number_of_birds

        # Update batch status and culls
        batch_doc.batch_status = "Completed"
        batch_doc.culls += live_quantity  # Add live birds to culls
        batch_doc.live_quantity_number_of_birds = 0
        batch_doc.save()

        frappe.db.commit()
        return "success"

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Scrap Batch Error")
        return str(e)
    
    
@frappe.whitelist()
def check_daily_transaction(batch, transaction_date):
    """Check if a daily transaction exists for the given batch and date."""

    exists = frappe.db.exists(
        "Broiler Daily Transaction",
        {"batch": batch, "transaction_date": transaction_date}
    )

    return {"exists": bool(exists)}

