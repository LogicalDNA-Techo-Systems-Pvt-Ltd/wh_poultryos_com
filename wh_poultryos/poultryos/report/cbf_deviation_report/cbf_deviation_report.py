# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    # Ensure the batch is selected
    if not filters.get("batch"):
        frappe.throw("Please select a Batch to view the report.")

    if not filters.get("from_date") or not filters.get("to_date"):
        frappe.throw("Please select From Date and To Date.")

    # Fetch filtered batch data
    query = """
        SELECT 
            b1.batch_name AS "Batch Name",
            d1.batch_placed_on AS "Placement Date",
            d1.transaction_date AS "Transaction Date",
            b1.farmer_name AS "Farmer Name",
            d1.batch_age_in_days AS "Age",
            i1.item_name AS "Item Name",
            d1.feed_consumed_quantity AS "Feed Quantity",
            st.feed_consumption AS "Standard Consumption",
            (d1.feed_consumed_quantity - st.feed_consumption) AS "Deviation",
            CASE 
                WHEN st.feed_consumption > 0 THEN 
                    ROUND(((d1.feed_consumed_quantity - st.feed_consumption) / st.feed_consumption) * 100, 2)
                ELSE 
                    NULL
            END AS "Deviation Percentage",
            d1.owner AS "Owner"
        FROM 
            `tabCBF Daily Transaction` d1 
        LEFT JOIN 
            `tabStandard Chart` st 
            ON d1.batch_age_in_days = st.age_in_days 
        LEFT JOIN 
            `tabCBF Batch` b1 
            ON b1.name = d1.batch 
        LEFT JOIN 
            `tabItem Master` i1  
            ON i1.name = d1.item_name
        WHERE 
            d1.batch = %(batch)s
            AND d1.transaction_date BETWEEN %(from_date)s AND %(to_date)s
        ORDER BY 
            d1.transaction_date ASC;
    """

    # Execute query
    data = frappe.db.sql(query, {
        "batch": filters.get("batch"),
        "from_date": filters.get("from_date"),
        "to_date": filters.get("to_date")
    }, as_dict=True)

    # Define table columns
    columns = [
        {"fieldname": "Batch Name", "label": "Batch Name", "fieldtype": "Data", "width": 150},
        {"fieldname": "Placement Date", "label": "Placement Date", "fieldtype": "Date", "width": 120},
        {"fieldname": "Transaction Date", "label": "Transaction Date", "fieldtype": "Date", "width": 120},
        {"fieldname": "Farmer Name", "label": "Farmer Name", "fieldtype": "Data", "width": 150},
        {"fieldname": "Age", "label": "Age", "fieldtype": "Int", "width": 80},
        {"fieldname": "Item Name", "label": "Item Name", "fieldtype": "Data", "width": 100},
        {"fieldname": "Feed Quantity", "label": "Feed Quantity", "fieldtype": "Float", "width": 120},
        {"fieldname": "Standard Consumption", "label": "Standard Consumption", "fieldtype": "Float", "width": 140},
        {"fieldname": "Deviation", "label": "Deviation", "fieldtype": "Float", "width": 120},
        {"fieldname": "Deviation Percentage", "label": "Deviation %", "fieldtype": "Percent", "width": 120},
        {"fieldname": "Owner", "label": "Owner", "fieldtype": "Data", "width": 150},
    ]

    return columns, data
