// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.query_reports["Broiler Batch Details Report"] = {
	"filters": [

		{
            "fieldname": "from_date",
            "label": __("From Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.now_date().slice(0, 4) + "-01-01",
            "reqd": 1
        },
        {
            "fieldname": "to_date",
            "label": __("To Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.get_today(),
            "reqd": 1
        },
        {
            "fieldname": "Batch",
            "label": __("Batch"),
            "fieldtype": "Link",
            "options": "Broiler Batch",
            "reqd": 0
        }
	]
};
