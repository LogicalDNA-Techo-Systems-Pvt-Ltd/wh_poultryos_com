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
            b1.first_week_mortality,
            b1.mortality,
            b1.culls,
            b1.body_weight,
            b1.sale_quantity as "Sale",
            b1.total_delivered_weight as "Weight",
            b1.rate,
            b1.amount,
            b1.batch_status
        FROM 
            `tabBroiler Batch` b1
        WHERE 
           b1.name = %(Batch)s
    """

    

    # Execute the query
    data = frappe.db.sql(query, {       
        "Batch": filters.get("Batch")
    }, as_dict=True)

    # Define columns for report
    columns = [
        {"label": "Batch Status", "fieldname": "batch_status", "fieldtype": "Data", "width": 120},
        {"label": "Batch Name", "fieldname": "batch_name", "fieldtype": "Data", "width": 110},
        {"label": "Farmer Name", "fieldname": "farmer_name", "fieldtype": "Data", "width": 115},      
        {"label": "Placement Date", "fieldname": "Placement Date", "fieldtype": "Date", "width": 130},
        {"label": "Live Batch Date", "fieldname": "live_batch_date", "fieldtype": "Date", "width": 140},
        {"label": "Age", "fieldname": "Age", "fieldtype": "Int", "width": 70},
        {"label": "Place Quantity", "fieldname": "Placement_Quantity", "fieldtype": "Int", "width": 130},
        {"label": "Live Quantity", "fieldname": "Live_Quantity", "fieldtype": "Int", "width": 120},
        {"label": "FWM", "fieldname": "first_week_mortality", "fieldtype": "Int", "width": 90},
        {"label": "Mortality", "fieldname": "mortality", "fieldtype": "Int", "width": 90},
        {"label": "Culls", "fieldname": "culls", "fieldtype": "Int", "width": 70},
        {"label": "Body Weight", "fieldname": "body_weight", "fieldtype": "float", "width": 110},
        {"label": "Sale Quantity", "fieldname": "Sale", "fieldtype": "float", "width": 120},
        {"label": "Delivered Weight", "fieldname": "Weight", "fieldtype": "float", "width": 150},
        {"label": "Rate", "fieldname": "rate", "fieldtype": "Currency", "width": 100},
        {"label": "Amount", "fieldname": "amount", "fieldtype": "Currency", "width": 120}
       
    ]

    return columns, data
