# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}
    
    query = """
        SELECT 
            t2.batch_name AS Batch, 
            t2.farmer_name,
            l1.location_name,
            s1.shed_name,
            t1.batch_placed_on AS Placement_Date,
            t1.transaction_date AS Transaction_Date,
            t1.batch_live_quantity AS Live_Quantity,
            t1.mortality_number_of_birds AS Mortality,
            t1.culls as Culls,
            t1.feed_consumed_quantity AS Feed,
            t1.feed_cost AS Feed_Cost,            
            t2.batch_status as Batch_Status
        FROM 
            `tabBroiler Daily Transaction` AS t1
        LEFT JOIN 
            `tabBroiler Batch` AS t2 
            ON t1.batch = t2.name
        LEFT JOIN `tabLocation` AS l1 ON l1.name = t2.location
        LEFT JOIN `tabShed` AS s1 ON s1.name = t2.shed
        WHERE 
            t1.transaction_date BETWEEN %(from_date)s AND %(to_date)s
            AND t2.name = %(Batch)s
            ORDER BY t1.transaction_date ASC
    """

    
    data = frappe.db.sql(query, {
        "from_date": filters.get("from_date"),
        "to_date": filters.get("to_date"),
        "Batch": filters.get("Batch")
    }, as_dict=True)
    
    columns = [
        {"label": "Batch", "fieldname": "Batch", "fieldtype": "Data", "width": 90},
        {"label": "Location", "fieldname": "location_name", "fieldtype": "Data", "width": 90},
        {"label": "Shed", "fieldname": "shed_name", "fieldtype": "Data", "width": 120},
        {"label": "Farmer Name", "fieldname": "farmer_name", "fieldtype": "Data", "width": 120},
        {"label": "Placement Date", "fieldname": "Placement_Date", "fieldtype": "Date", "width": 120},
        {"label": "Transaction Date", "fieldname": "Transaction_Date", "fieldtype": "Date", "width": 120},
        {"label": "Live Quantity", "fieldname": "Live_Quantity", "fieldtype": "Int", "width": 120},
        {"label": "Mortality", "fieldname": "Mortality", "fieldtype": "Int", "width": 100},
        {"label": "Culls", "fieldname": "Culls", "fieldtype": "Int", "width": 100},
        {"label": "Feed", "fieldname": "Feed", "fieldtype": "Float", "width": 100},
        {"label": "Feed Cost", "fieldname": "Feed_Cost", "fieldtype": "Currency", "width": 120},
     
        
    ]
    
    return columns, data
