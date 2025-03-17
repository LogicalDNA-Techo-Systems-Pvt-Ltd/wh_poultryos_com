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
            b2.item_type,
            btch.batch_name,
            btch2.batch_name as Batch_Name,
            s1.sales_type,
            b1.instock,
            b1.weight,
            COALESCE(b1.body_weight, 0) AS "body_weight",
            b1.quantity,
            b2.weights,  
            b2.birdquantity,
            b2.instock as Instock,
            COALESCE(b2.body_weight, 0) AS "Body_Weight",
            b2.rate as Rate,
            b1.rate,
            s1.total_amount
        FROM 
            `tabCustom Sales Invoice` s1
        LEFT JOIN 
            `tabBatch Selection` b1 
            ON b1.parent = s1.name
        LEFT JOIN 
            `tabBatch Selection Weight` b2
            ON b2.parent = s1.name
        LEFT JOIN 
            `tabParty` p1 
            ON p1.name = s1.party
        LEFT JOIN
            `tabBroiler Batch` btch
            ON btch.name = b1.batch 
        LEFT JOIN
            `tabBroiler Batch` btch2
            ON btch2.name = b2.batch 
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
    
    # Initialize totals
    total_body_weight = 0.0
    total_quantity = 0
    total_weight = 0.0    
    total_stock = 0.0
    total_rate = 0
    total_amt = 0.0
    # Modify data to assign the correct quantity
    for row in data:
        if row["sales_type"] == "Sales by Bird":
            row["final_quantity"] = row["quantity"]  # Use 'quantity'
            row["final_weight"] = row["weight"]  # Use 'quantity'
            row["final_rate"] = row["rate"]  # Use 'quantity'
            row["finalbodyweight"] = row["body_weight"]  # Use 'quantity'
            row["finalinstock"] = row["instock"]  # Use 'quantity'
            row["finaltype"] = row["type"]  # Use 'quantity'
            row["finalbatch"] = row["batch_name"]  # Use 'quantity'
            
        else:
            row["final_quantity"] = row["birdquantity"]  # Use 'birdquantity'
            row["final_weight"] = row["weights"]  # Use 'birdquantity'
            row["final_rate"] = row["Rate"]  # Use 'birdquantity'
            row["finalbodyweight"] = row["Body_Weight"]  # Use 'quantity'
            row["finalinstock"] = row["Instock"]  # Use 'quantity'
            row["finaltype"] = row["item_type"]  # Use 'quantity'
            row["finalbatch"] = row["Batch_Name"]  # Use 'quantity'
            
            
        # Sum up totals
        total_body_weight += float(row["finalbodyweight"] or 0)
        total_quantity += row["final_quantity"] or 0
        total_weight += float(row["final_weight"] or 0)
        total_stock += float(row["finalinstock"] or 0)
        total_rate += float(row["final_rate"] or 0)
        total_amt += float(row["total_amount"] or 0)
        
      # Append a totals row at the end
    totals_row = {
        "date": "", 
        "party": "TOTAL",       
        "finalbodyweight": total_body_weight,
        "final_quantity": total_quantity,
        "final_weight": total_weight,
        "finalinstock": total_stock,
        "final_rate": total_rate,
        "total_amount": total_amt
    }
    
   
    data.append(totals_row)
    
    columns = [
        {"label": "Date", "fieldname": "date", "fieldtype": "Date", "width": 120},
        {"label": "Party", "fieldname": "party", "fieldtype": "Data", "width": 120},
        {"label": "Party Name", "fieldname": "party_name", "fieldtype": "Data", "width": 120},
        {"label": "Party Group", "fieldname": "party_group", "fieldtype": "Data", "width": 120},
        {"label": "Item", "fieldname": "finaltype", "fieldtype": "Data", "width": 100},
        {"label": "Sales Type", "fieldname": "sales_type", "fieldtype": "Data", "width": 130},
        {"label": "Batch", "fieldname": "finalbatch", "fieldtype": "Data", "width": 100},
        {"label": "Live Quantity", "fieldname": "finalinstock", "fieldtype": "Float", "width": 120},
        {"label": "Body Weight", "fieldname": "finalbodyweight", "fieldtype": "Float", "width": 120},
        {"label": "Quantity", "fieldname": "final_quantity", "fieldtype": "Float", "width": 100},
        {"label": "Weight", "fieldname": "final_weight", "fieldtype": "Float", "width": 100},
        {"label": "Rate", "fieldname": "final_rate", "fieldtype": "Currency", "width": 120},
        {"label": "Total Amount", "fieldname": "total_amount", "fieldtype": "Currency", "width": 150},
    ]

   
            
    return columns, data

