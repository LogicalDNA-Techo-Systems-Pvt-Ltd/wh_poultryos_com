# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    query = """
        SELECT 
            s1.date,
            s1.party,
            p1.party_name,
            p1.party_group,
            b1.type,
            b1.instock,
            COALESCE(b1.body_weight, 0) AS "body_weight",
            b1.quantity,
            b1.rate,
            s1.total_amount
        FROM 
            `tabCustom Sales Invoice` s1
        LEFT JOIN 
            `tabBatch Selection` b1 
            ON b1.parent = s1.name
        LEFT JOIN 
            `tabParty` p1 
            ON p1.name = s1.party
        WHERE 
            s1.date BETWEEN %(from_date)s AND %(to_date)s
            AND p1.name = %(party_name)s  -- Removed the extra closing parenthesis
        ORDER BY 
            s1.date ASC;
    """

    # Execute query
    data = frappe.db.sql(query, {
        "party_name": filters.get("party_name"),
        "from_date": filters.get("from_date"),
        "to_date": filters.get("to_date")
    }, as_dict=True)
    
    columns = [
        {"label": "Date", "fieldname": "date", "fieldtype": "Date", "width": 120},
        {"label": "Party", "fieldname": "party", "fieldtype": "Data", "width": 150},
        {"label": "Party Name", "fieldname": "party_name", "fieldtype": "Data", "width": 200},
        {"label": "Party Group", "fieldname": "party_group", "fieldtype": "Data", "width": 150},
        {"label": "Type", "fieldname": "type", "fieldtype": "Data", "width": 100},
        {"label": "Instock", "fieldname": "instock", "fieldtype": "Float", "width": 100},
        {"label": "Body Weight", "fieldname": "body_weight", "fieldtype": "Float", "width": 100},
        {"label": "Quantity", "fieldname": "quantity", "fieldtype": "Float", "width": 100},
        {"label": "Rate", "fieldname": "rate", "fieldtype": "Currency", "width": 120},
        {"label": "Total Amount", "fieldname": "total_amount", "fieldtype": "Currency", "width": 150},
    ]

    return columns, data
