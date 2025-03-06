# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    query = """
        SELECT 
            b1.batch_name,
            b1.farmer_name,
            b1.opening_date as "Placement Date",
            b1.live_batch_date,
            b1.batch_age_in_days AS Age,
            b1.place_quantity_number_of_birds AS Placement_Quantity,
            b1.live_quantity_number_of_birds AS Live_Quantity,
            b1.mortality,
            b1.culls,
            b1.body_weight,
            b1.rate,
            b1.amount,
            b1.batch_status
        FROM 
            `tabBroiler Batch` b1
        WHERE 
            b1.opening_date BETWEEN %(from_date)s AND %(to_date)s
            AND b1.name = %(Batch)s
    """

    

    # Execute the query
    data = frappe.db.sql(query, {
        "from_date": filters.get("from_date"),
        "to_date": filters.get("to_date"),
        "Batch": filters.get("Batch")
    }, as_dict=True)

    # Define columns for report
    columns = [
        {"label": "Batch Status", "fieldname": "batch_status", "fieldtype": "Data", "width": 120},
        {"label": "Batch Name", "fieldname": "batch_name", "fieldtype": "Data", "width": 130},
        {"label": "Farmer Name", "fieldname": "farmer_name", "fieldtype": "Data", "width": 115},      
        {"label": "Placement Date", "fieldname": "Placement Date", "fieldtype": "Date", "width": 130},
        {"label": "Live Batch Date", "fieldname": "live_batch_date", "fieldtype": "Date", "width": 140},
        {"label": "Place Quantity", "fieldname": "Placement_Quantity", "fieldtype": "Int", "width": 130},
        {"label": "Live Quantity", "fieldname": "Live_Quantity", "fieldtype": "Int", "width": 120},
        {"label": "Mortality", "fieldname": "mortality", "fieldtype": "Int", "width": 90},
        {"label": "Culls", "fieldname": "culls", "fieldtype": "Int", "width": 70},
        {"label": "Body Weight", "fieldname": "body_weight", "fieldtype": "float", "width": 110},
        {"label": "Rate", "fieldname": "rate", "fieldtype": "Currency", "width": 100},
        {"label": "Amount", "fieldname": "amount", "fieldtype": "Currency", "width": 120}
       
    ]

    return columns, data
