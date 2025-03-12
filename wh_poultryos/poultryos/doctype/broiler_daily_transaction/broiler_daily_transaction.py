# broiler_daily_transaction.py
from frappe import _
import frappe
from frappe.model.document import Document


class BroilerDailyTransaction(Document):
    def validate(self):
        self.calculate_totals()
        self.calculate_mortality_stats()
        self.calculate_weight_stats()
        self.calculate_consumption_stats()
        # Update batch statistics after all calculations
        self.update_batch_statistics()

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

        self.total_cull_qty = (
            sum([d.qty for d in self.mortality_details if d.transaction_type == "Cull"])
            or 0
        )

        # Calculate mortality and cull costs
        self.total_mortality_cost = (
            sum(
                [
                    d.cost
                    for d in self.mortality_details
                    if d.transaction_type == "Mortality"
                ]
            )
            or 0
        )

        self.total_cull_cost = (
            sum(
                [d.cost for d in self.mortality_details if d.transaction_type == "Cull"]
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
            self.total_mortality_cost
            + self.total_cull_cost
            + self.total_feed_cost
            + self.total_medicine_cost
            + self.total_vaccine_cost
            + self.total_vitamin_cost
        )

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

            result = update_batch_stats(self.batch)

            if result.get("success"):
                # Update local variables from the API response
                data = result.get("data", {})
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
