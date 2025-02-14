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
            s1.shed_name,
            l1.location_name,
            b1.opening_date,
            b1.live_batch_date,
            b1.batch_age_in_days AS Age,
            br1.breed_name,
            b1.place_quantity_number_of_birds AS Placement,
            b1.live_quantity_number_of_birds AS Live_Quantity,
            m1.module_name AS Module,
            b1.mortality,
            b1.culls,
            b1.biological_value,
            b1.bird_cost
        FROM 
            `tabBroiler Batch` b1
        LEFT JOIN `tabLocation` l1 ON l1.name = b1.location
        LEFT JOIN `tabShed` s1 ON s1.name = b1.shed
        LEFT JOIN `tabModule` m1 ON b1.module = m1.name
        LEFT JOIN `tabBreed` br1 ON br1.name = b1.breed_name
        WHERE 
            b1.opening_date BETWEEN %(from_date)s AND %(to_date)s
            AND (%(Batch)s IS NULL OR b1.name = %(Batch)s)
        ORDER BY 
            b1.opening_date ASC;
    """

    # Execute query
    data = frappe.db.sql(
        query,
        {
            "from_date": filters.get("from_date"),
            "to_date": filters.get("to_date"),
            "Batch": filters.get("Batch"),
        },
        as_dict=True,
    )

    # Define columns
    columns = [
        {
            "label": "Batch Name",
            "fieldname": "batch_name",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Farmer Name",
            "fieldname": "farmer_name",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Shed Name",
            "fieldname": "shed_name",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": "Location Name",
            "fieldname": "location_name",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": "Opening Date",
            "fieldname": "opening_date",
            "fieldtype": "Date",
            "width": 120,
        },
        {
            "label": "Live Batch Date",
            "fieldname": "live_batch_date",
            "fieldtype": "Date",
            "width": 120,
        },
        {"label": "Age", "fieldname": "Age", "fieldtype": "Int", "width": 100},
        {
            "label": "Breed Name",
            "fieldname": "breed_name",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": "Placement",
            "fieldname": "Placement",
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "label": "Live Quantity",
            "fieldname": "Live_Quantity",
            "fieldtype": "Int",
            "width": 120,
        },
        {"label": "Module", "fieldname": "Module", "fieldtype": "Data", "width": 90},
        {
            "label": "Mortality",
            "fieldname": "mortality",
            "fieldtype": "Int",
            "width": 90,
        },
        {"label": "Culls", "fieldname": "culls", "fieldtype": "Int", "width": 100},
        {
            "label": "Biological Value",
            "fieldname": "biological_value",
            "fieldtype": "Float",
            "width": 120,
        },
        {
            "label": "Bird Cost",
            "fieldname": "bird_cost",
            "fieldtype": "Currency",
            "width": 120,
        },
    ]

    return columns, data
