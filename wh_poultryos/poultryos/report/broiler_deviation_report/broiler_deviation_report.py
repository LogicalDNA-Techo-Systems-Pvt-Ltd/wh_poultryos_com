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
        b1.batch_status as "Status",
        b1.batch_name,
        b1.opening_date AS "Placement Date",
        d1.transaction_date AS "Transaction Date",
        b1.farmer_name AS "Farmer Name",
        d1.batch_age AS "Age",
        i1.item_name AS "Item Name",
        COALESCE(TM.qty, 0) AS "Mortality",
        COALESCE(d1.standard_mortality, 0) AS "Std Mortality",
        COALESCE(d1.standard_mortality, 0) - COALESCE(d1.total_mortality_qty, 0) AS "Mortality Deviation",
        CASE  
            WHEN COALESCE(st.standard_mortality, 0) > 0 THEN 
                ROUND(((d1.standard_mortality - d1.total_mortality_qty) / d1.standard_mortality) * 100, 2)
            ELSE 
                0
        END AS "Mortality Deviation Percentage",
        COALESCE(TC.consumption_qty,0) as "Feed",
        COALESCE(st.standard_total_feed_consumption, 0) AS "Standard Consumption",
        COALESCE(st.standard_total_feed_consumption, 0) - COALESCE(d1.actual_total_feed_consumption, 0) AS "Feed Deviation",
        CASE  
            WHEN COALESCE(st.standard_total_feed_consumption, 0) > 0 THEN 
                ROUND(((st.standard_total_feed_consumption - d1.actual_total_feed_consumption) / st.standard_total_feed_consumption) * 100, 2)
            ELSE 
                0
        END AS "Feed Deviation Percentage",
        d1.owner AS "Owner"
FROM 
            `tabBroiler Daily Transaction` d1 
        LEFT JOIN
            `tabBroiler Consumption Detail` TC
            ON TC.parent = d1.name
        LEFT JOIN
            `tabBroiler Mortality Detail` TM
            ON TM.parent = d1.name
        LEFT JOIN 
            `tabBroiler Batch` b1 
            ON b1.name = d1.batch 
        LEFT JOIN 
            `tabItem Master` i1  
            ON i1.name = TC.consumption_item
        LEFT JOIN 
            `tabStandard Chart` st 
            ON d1.batch_age = st.age_in_days and st.breed = b1.breed_name
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
        {"fieldname": "batch_name", "label": "Batch", "fieldtype": "Data", "width": 90},
        {"fieldname": "Placement Date", "label": "Placement Date", "fieldtype": "Date", "width": 135},
        {"fieldname": "Transaction Date", "label": "Transaction Date", "fieldtype": "Date", "width": 145},
        {"fieldname": "Farmer Name", "label": "Farmer", "fieldtype": "Data", "width": 80},
        {"fieldname": "Age", "label": "Age", "fieldtype": "Int", "width": 70},
        {"fieldname": "Item Name", "label": "Item Name", "fieldtype": "Data", "width": 100},
        {"fieldname": "Mortality", "label": "Mortality", "fieldtype": "Int", "width": 100},
        {"fieldname": "Std Mortality", "label": "Mortality Std.", "fieldtype": "Float", "width": 120},
        {"fieldname": "Mortality Deviation", "label": "Mortality Deviation", "fieldtype": "Float", "width": 160},
        {"fieldname": "Mortality Deviation Percentage", "label": "Mortality Deviation %", "fieldtype": "Percent", "width": 190},
        {"fieldname": "Feed", "label": "Feed", "fieldtype": "Float", "width": 90},
        {"fieldname": "Standard Consumption", "label": "Feed Std.", "fieldtype": "Float", "width": 100},
        {"fieldname": "Feed Deviation", "label": "Feed Deviation", "fieldtype": "Float", "width": 130},
        {"fieldname": "Feed Deviation Percentage", "label": "Feed Deviation %", "fieldtype": "Percent", "width": 160},
        {"fieldname": "Owner", "label": "Owner", "fieldtype": "Data", "width": 150},
    ]

    return columns, data
