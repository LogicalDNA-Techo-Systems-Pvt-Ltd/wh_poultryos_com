# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}
    
    query = """
        SELECT 
            t2.batch_name AS Batch,
            g1.farmer_name,
            g1.production_cost,
            g1.production_costkg,
            g1.fcr,
            g1.placed_quanity,
            g1.first_week_mortality,
            g1.total_mortality,
            g1.total_feed_consumed,
            g1.feed_cost,
            g1.medicine_cost,
            g1.mortality_percentage,
            g1.administrative_cost,
            g1.production_cost,
            g1.total_sale_quantity,
            g1.total_delivered_weight,
            g1.net_payable_amount AS Final_Amount,
            t2.culls as Culls
        FROM `tabGrowing Charges` g1 
        LEFT JOIN `tabBroiler Batch` AS t2 ON g1.batch = t2.name
        WHERE t2.name = %(Batch)s
    """
    
    data = frappe.db.sql(query, {"Batch": filters.get("Batch")}, as_dict=True)
    
    columns = [
        {"label": "Batch", "fieldname": "Batch", "fieldtype": "Data", "width": 150},
        {"label": "Farmer Name", "fieldname": "farmer_name", "fieldtype": "Data", "width": 150},
        {"label": "Production Cost", "fieldname": "production_cost", "fieldtype": "float", "width": 150},
        {"label": "Production Cost/KG", "fieldname": "production_costkg", "fieldtype": "float", "width": 150},
        {"label": "FCR", "fieldname": "fcr", "fieldtype": "float", "width": 150},
        {"label": "Placed Quantity", "fieldname": "placed_quanity", "fieldtype": "Int", "width": 120},
        {"label": "First Week Mortality", "fieldname": "first_week_mortality", "fieldtype": "Int", "width": 150},
        {"label": "Total Mortality", "fieldname": "total_mortality", "fieldtype": "Int", "width": 120},
        {"label": "Total Feed Consumed", "fieldname": "total_feed_consumed", "fieldtype": "Float", "width": 150},
        {"label": "Feed Cost", "fieldname": "feed_cost", "fieldtype": "Currency", "width": 120},
        {"label": "Medicine Cost", "fieldname": "medicine_cost", "fieldtype": "Currency", "width": 120},
        {"label": "Mortality Percentage", "fieldname": "mortality_percentage", "fieldtype": "Percent", "width": 120},
        {"label": "Administrative Cost", "fieldname": "administrative_cost", "fieldtype": "Currency", "width": 150},
        {"label": "Production Cost", "fieldname": "production_cost", "fieldtype": "Currency", "width": 120},
        {"label": "Total Sale Quantity", "fieldname": "total_sale_quantity", "fieldtype": "Int", "width": 120},
        {"label": "Total Delivered Weight", "fieldname": "total_delivered_weight", "fieldtype": "Float", "width": 150},
        {"label": "Final Amount", "fieldname": "Final_Amount", "fieldtype": "Currency", "width": 150}
    ]
    
    return columns, data
