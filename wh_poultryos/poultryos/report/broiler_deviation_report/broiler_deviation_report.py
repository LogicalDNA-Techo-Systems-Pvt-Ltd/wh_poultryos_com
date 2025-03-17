# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    # Ensure the batch is selected
    if not filters.get("Batch"):
        frappe.throw("Please select a Batch to view the report.")


    # Fetch filtered batch data
    query = """
        SELECT 
            b1.batch_name AS "Batch Name",
            b1.opening_date AS "Placement Date",
            d1.transaction_date AS "Transaction Date",
            b1.farmer_name AS "Farmer Name",
            d1.batch_age AS "Age",
            i1.item_name AS "Item Name",
            COALESCE(d1.total_mortality_qty, 0) AS "Mortality",
            COALESCE(d1.actual_total_feed_consumption, 0) AS "Feed",
            COALESCE(st.standard_mortality, 0) AS "mortality",
            COALESCE(st.standard_total_feed_consumption, 0) AS "Standard Consumption",
            COALESCE((d1.actual_total_feed_consumption - st.standard_total_feed_consumption), 0) AS "Deviation",
            CASE 
                WHEN COALESCE(st.standard_total_feed_consumption, 0) > 0 THEN 
                    ROUND(((d1.actual_total_feed_consumption - st.standard_total_feed_consumption) / st.standard_total_feed_consumption) * 100, 2)
                ELSE 
                    0
            END AS "Deviation P",
            COALESCE((d1.total_mortality_qty - st.standard_mortality), 0) AS "Mor Deviation",
            CASE 
                WHEN COALESCE(st.standard_mortality, 0) > 0 THEN 
                    ROUND(((d1.total_mortality_qty - st.standard_mortality) / st.standard_mortality) * 100, 2)
                ELSE 
                    0
            END AS "Mortality P",
            d1.owner AS "Owner"
        FROM 
            `tabBroiler Daily Transaction` d1 
        LEFT JOIN 
            `tabStandard Chart` st 
            ON d1.batch_age = st.age_in_days 
        LEFT JOIN 
            `tabBroiler Batch` b1 
            ON b1.name = d1.batch 
        LEFT JOIN
            `tabBroiler Consumption Detail` TC
            ON TC.parent = d1.name     
        LEFT JOIN 
            `tabItem Master` i1  
            ON i1.name = TC.consumption_item
        WHERE 
            d1.batch = %(Batch)s
         
        ORDER BY 
            d1.transaction_date ASC;
    """

    # Execute query
    data = frappe.db.sql(query, {
        "Batch": filters.get("Batch")        
    }, as_dict=True)

    # Define table columns
    columns = [
        {"fieldname": "Batch Name", "label": "Batch Name", "fieldtype": "Data", "width": 100},
        {"fieldname": "Placement Date", "label": "Placement Date", "fieldtype": "Date", "width": 120},
        {"fieldname": "Transaction Date", "label": "Transaction Date", "fieldtype": "Date", "width": 120},
        {"fieldname": "Farmer Name", "label": "Farmer Name", "fieldtype": "Data", "width": 110},
        {"fieldname": "Age", "label": "Age", "fieldtype": "Int", "width": 70},
        {"fieldname": "Item Name", "label": "Item Name", "fieldtype": "Data", "width": 100},
        {"fieldname": "Mortality", "label": "Mortality", "fieldtype": "Int", "width": 100},
        {"fieldname": "mortality", "label": "Mortality Std.", "fieldtype": "Float", "width": 120},
        {"fieldname": "Mor Deviation", "label": "Mortality Deviation", "fieldtype": "Float", "width": 130},
        {"fieldname": "Mortality P", "label": "Mortality Deviation %", "fieldtype": "Percent", "width": 120},
        {"fieldname": "Feed", "label": "Feed", "fieldtype": "Float", "width": 90},
        {"fieldname": "Standard Consumption", "label": "Feed Std.", "fieldtype": "Float", "width": 100},
        {"fieldname": "Deviation", "label": "Deviation", "fieldtype": "Float", "width": 100},
        {"fieldname": "Deviation P", "label": "Deviation %", "fieldtype": "Percent", "width": 120},
        {"fieldname": "Owner", "label": "Owner", "fieldtype": "Data", "width": 150},
    ]

    return columns, data
