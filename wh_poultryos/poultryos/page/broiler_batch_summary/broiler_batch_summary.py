import frappe
from frappe import _
from datetime import datetime, timedelta
import random  # Added for generating sample data


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
            "fcr": round((batch.current_fcr or 0), 3),
            "body_weight": round((batch.body_weight or 0), 2),
            "eef": round((batch.current_eef or 0), 3),
            "production_cost": round((batch.production_cost or 0), 2),
        }

        # Transaction dates for x-axis
        transaction_dates = _get_actual_metric(batch, "transaction_date")

        # Charts Data (Comparative Performance)
        charts_data = {
            "transaction_date": transaction_dates,
            "mortality_std": _get_std_metric(
                batch, "mortality"
            ),  # Standard mortality progression
            "mortality_actual": _get_actual_metric(batch, "mortality"),
            "feed_std": _get_std_metric(
                batch, "feed_consumption"
            ),  # Standard feed consumption
            "feed_actual": _get_actual_metric(batch, "feed_consumption"),
            "fcr_std": _get_std_metric(batch, "fcr"),  # Standard FCR
            "fcr_actual": _get_actual_metric(batch, "fcr"),
            "weight_std": _get_std_metric(batch, "body_weight"),  # Standard body weight
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


def _get_std_metric(batch, metric_type):
    """
    Retrieve standard metric data from Standard Chart for comparative analysis.

    Args:
        batch (Document): Broiler Batch document
        metric_type (str): Type of metric to retrieve ('mortality', 'feed_consumption', 'fcr', 'body_weight')

    Returns:
        List of standard metric values corresponding to the daily transactions
    """
    # Get the breed from the batch
    breed = batch.breed_name

    if not breed:
        return []  # Return empty list if breed not found

    # Get opening quantity for percentage to quantity conversion
    opening_quantity = (
        batch.place_quantity_number_of_birds
        or batch.place_quantity_number_of_birds
        or 0
    )

    if opening_quantity <= 0:
        return []  # Return empty list if no valid opening quantity

    # Get all daily transactions to match standard values to actual dates
    transactions = _get_daily_transactions(batch.name)

    if not transactions:
        return []  # Return empty list if no transactions

    # Sort transactions by date
    sorted_transactions = sorted(transactions, key=lambda x: x["date"])

    # Map metric types to Standard Chart fields
    metric_field_map = {
        "mortality": "standard_mortality",
        "feed_consumption": "standard_total_feed_consumption",
        "fcr": "standard_fcr",
        "body_weight": "standard_avg_bird_weight",
    }

    field_name = metric_field_map.get(metric_type)
    if not field_name:
        return []  # Return empty list for unknown metric types

    # Prepare result list
    standard_data = []

    # For each transaction date, fetch corresponding standard value based on age
    for transaction in sorted_transactions:
        transaction_date = datetime.strptime(transaction["date"], "%Y-%m-%d").date()

        # Calculate age in days for this transaction
        placement_date = batch.opening_date
        if not placement_date:
            continue

        age_in_days = (transaction_date - placement_date).days

        if age_in_days < 0:
            continue  # Skip invalid ages

        # Query the Standard Chart for the given breed and age
        standard_values = frappe.get_all(
            "Standard Chart",
            filters={"breed": breed, "age_in_days": age_in_days},
            fields=[field_name],
        )

        # If exact age match is not found, find the closest age
        if not standard_values:
            closest_age_record = frappe.db.sql(
                """
                SELECT 
                    {0}
                FROM 
                    `tabStandard Chart`
                WHERE 
                    breed = %s 
                ORDER BY 
                    ABS(age_in_days - %s) ASC
                LIMIT 1
            """.format(
                    field_name
                ),
                (breed, age_in_days),
                as_dict=True,
            )

            if not closest_age_record:
                # No standard data available, use placeholder
                standard_value = 0
            else:
                standard_value = closest_age_record[0].get(field_name) or 0
        else:
            standard_value = standard_values[0].get(field_name) or 0

        # Convert percentage to quantity for mortality
        if metric_type == "mortality" and standard_value:
            standard_value = (standard_value / 100) * opening_quantity

        # For cumulative metrics, we need to account for the cumulative nature
        if metric_type in ["mortality", "feed_consumption"]:
            # Find previous cumulative value
            prev_cumulative = 0
            if standard_data:
                prev_cumulative = standard_data[-1]["value"]

            if metric_type == "mortality":
                # For mortality, we're getting daily mortality percentage, so we need to add to cumulative
                daily_value = standard_value - prev_cumulative
                standard_data.append(
                    {"date": transaction["date"], "value": standard_value}
                )
            else:
                # For feed consumption, the standard is total consumption, not daily
                standard_data.append(
                    {"date": transaction["date"], "value": standard_value}
                )
        else:
            # For non-cumulative metrics (fcr, body_weight)
            standard_data.append({"date": transaction["date"], "value": standard_value})

    return standard_data


def _get_actual_metric(batch, metric_type):
    """
    Retrieve actual metric data from daily transactions for charts.

    Args:
        batch (Document): Broiler Batch document
        metric_type (str): Type of metric to retrieve ('transaction_date', 'mortality', 'feed_consumption', 'fcr', 'body_weight')

    Returns:
        List of daily metric values for the batch duration
    """
    # Get all daily transactions for this batch
    transactions = _get_daily_transactions(batch.name)

    if not transactions:
        return []  # Return empty list if no transactions

    # Sort transactions by date
    sorted_transactions = sorted(transactions, key=lambda x: x["date"])

    # Special case for transaction_date - just return the dates
    if metric_type == "transaction_date":
        return [transaction["date"] for transaction in sorted_transactions]

    # Map transaction fields to metric types
    metric_field_map = {
        "mortality": "total_mortality_qty",
        "feed_consumption": "actual_total_feed_consumption",
        "fcr": "fcr",
        "body_weight": "actual_avg_bird_weight",
    }

    field_name = metric_field_map.get(metric_type)
    if not field_name:
        return []  # Return empty list for unknown metric types

    # Create a dictionary of date to value mapping
    daily_data_dict = {}

    for transaction in sorted_transactions:
        date_str = transaction["date"]
        value = (
            float(transaction[field_name]) if transaction[field_name] is not None else 0
        )
        daily_data_dict[date_str] = value

    # For cumulative metrics (mortality, feed_consumption), calculate running totals
    # if metric_type in ["mortality", "feed_consumption"]:
    #     running_total = 0
    #     for date_str in sorted(daily_data_dict.keys()):
    #         running_total += daily_data_dict[date_str]
    #         daily_data_dict[date_str] = running_total

    # Convert dictionary to a list of daily values in chronological order
    dates = sorted(daily_data_dict.keys())
    daily_data = [{"date": date, "value": daily_data_dict[date]} for date in dates]

    return daily_data


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
        fields=[
            "transaction_date",
            "total_mortality_qty",
            "total_cull_qty",
            "actual_total_feed_consumption",
            "actual_avg_bird_weight",
            "fcr",
            "eef",
        ],
        order_by="transaction_date",
    )

    return [
        {
            "date": str(trans.transaction_date),
            "total_mortality_qty": trans.total_mortality_qty or 0,
            "total_cull_qty": trans.total_cull_qty or 0,
            "actual_total_feed_consumption": trans.actual_total_feed_consumption or 0,
            "actual_avg_bird_weight": trans.actual_avg_bird_weight or 0,
            "fcr": trans.fcr or 0,
            "eef": trans.eef or 0,
        }
        for trans in transactions
    ]


def _generate_activity_heatmap(batch_name):
    """
    Generate activity heatmap data for the batch.

    Args:
        batch_name (str): Name of the broiler batch

    Returns:
        Dictionary of activity data for Frappe Heatmap
    """
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)

    # Generate sample activity data (replace with actual data retrieval)
    dataPoints = {}
    current_date = start_date

    while current_date <= end_date:
        # In a real scenario, count actual events/transactions for this date
        activity_count = frappe.db.count(
            "Broiler Daily Transaction",
            filters={"batch": batch_name, "transaction_date": current_date},
        )

        dataPoints[str(current_date)] = activity_count
        current_date += timedelta(days=1)

    return {"dataPoints": dataPoints, "start": str(start_date), "end": str(end_date)}
