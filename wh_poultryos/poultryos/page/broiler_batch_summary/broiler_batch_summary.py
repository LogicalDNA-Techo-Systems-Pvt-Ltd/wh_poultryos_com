import frappe
from frappe import _
from datetime import datetime, timedelta


@frappe.whitelist()
def get_broiler_batches():
    """
    Retrieve a list of all broiler batches for the dropdown selection.

    Returns:
        List of dictionaries containing batch name and batch name for display
    """
    batches = frappe.get_all(
        "Broiler Batch", fields=["name", "batch_name"], order_by="creation desc"
    )
    return batches


@frappe.whitelist()
def get_batch_summary_data(batch_name):
    """
    Fetch comprehensive summary data for a specific broiler batch.

    Args:
        batch_name (str): Name of the broiler batch

    Returns:
        Dictionary containing batch performance metrics, charts data, and transactions
    """
    try:
        # Fetch Batch Details
        batch = frappe.get_doc("Broiler Batch", batch_name)

        # Performance Metrics
        performance_data = {
            "placed_quantity": batch.place_quantity_number_of_birds or 0,
            "live_quantity": batch.live_quantity_number_of_birds or 0,
            "first_week_mortality": round((batch.mortality or 0), 2),
            "total_mortality": round((batch.mortality or 0), 2),
            "fcr": round((batch.total_feed or 0), 2),
            "body_weight": round((batch.mortality or 0), 2),
            "eef": round((batch.mortality or 0), 2),
            "production_cost": round((batch.mortality or 0), 2),
        }

        # Charts Data (Comparative Performance)
        charts_data = {
            "mortality_std": [3, 5, 7, 10, 12, 15],  # Standard mortality progression
            "mortality_actual": _get_actual_metric(batch, "mortality"),
            "feed_std": [1.2, 1.5, 1.8, 2.0, 2.2, 2.5],  # Standard feed consumption
            "feed_actual": _get_actual_metric(batch, "feed_consumption"),
            "fcr_std": [1.6, 1.7, 1.8, 1.9, 2.0, 2.1],  # Standard FCR
            "fcr_actual": _get_actual_metric(batch, "fcr"),
            "weight_std": [0.2, 0.5, 1.0, 1.5, 2.0, 2.5],  # Standard body weight
            "weight_actual": _get_actual_metric(batch, "body_weight"),
        }

        # Daily Transactions
        transactions = _get_daily_transactions(batch_name)

        # Activity Heatmap Data
        activity_data = _generate_activity_heatmap(batch_name)

        return {
            "performance_metrics": performance_data,
            "charts_data": charts_data,
            "transactions": transactions,
            "activity_data": activity_data,
        }

    except Exception as e:
        frappe.log_error(f"Error fetching batch summary: {str(e)}")
        return {"error": str(e)}


def _get_actual_metric(batch, metric_type):
    """
    Generate actual metric data for charts.
    In a real implementation, this would fetch actual tracked data.

    Args:
        batch (Document): Broiler Batch document
        metric_type (str): Type of metric to retrieve

    Returns:
        List of metric values for each week
    """
    # Placeholder logic - replace with actual data retrieval
    metric_map = {
        "mortality": [2, 4, 6, 8, 10, 12],
        "feed_consumption": [1.0, 1.3, 1.6, 1.9, 2.1, 2.3],
        "fcr": [1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
        "body_weight": [0.1, 0.4, 0.8, 1.2, 1.7, 2.2],
    }
    return metric_map.get(metric_type, [0, 0, 0, 0, 0, 0])


def _get_daily_transactions(batch_name):
    """
    Retrieve daily transactions for the batch.

    Args:
        batch_name (str): Name of the broiler batch

    Returns:
        List of transaction dictionaries
    """
    transactions = frappe.get_all(
        "Broiler Daily Transaction",
        filters={"batch": batch_name},
        fields=["transaction_date", "feed_consumed_quantity", "mortality_reason"],
        order_by="transaction_date",
    )

    return [
        {
            "date": str(trans.transaction_date),
            "quantity": trans.feed_consumed_quantity,
            "details": trans.mortality_reason or "N/A",
        }
        for trans in transactions
    ]


def _generate_activity_heatmap(batch_name):
    """
    Generate activity heatmap data for the batch.

    Args:
        batch_name (str): Name of the broiler batch

    Returns:
        List of activity data points
    """
    # Generate heatmap data points
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=90)

    activity_data = []
    current_date = start_date

    while current_date <= end_date:
        # In a real scenario, count actual events/transactions for this date
        activity_count = frappe.db.count(
            "Broiler Daily Transaction",
            filters={"batch": batch_name, "transaction_date": current_date},
        )

        activity_data.append({"date": str(current_date), "count": activity_count})

        current_date += timedelta(days=1)

    return activity_data
